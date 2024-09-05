import getAccountDb, { clearExpiredSessions } from '../account-db.js';
import * as uuid from 'uuid';
import { generators, Issuer } from 'openid-client';
import { TOKEN_EXPIRATION_NEVER } from '../app-admin.js';
import finalConfig from '../load-config.js';

export async function bootstrapOpenId(config) {
  if (!Object.prototype.hasOwnProperty.call(config, 'issuer')) {
    return { error: 'missing-issuer' };
  }
  if (!Object.prototype.hasOwnProperty.call(config, 'client_id')) {
    return { error: 'missing-client-id' };
  }
  if (!Object.prototype.hasOwnProperty.call(config, 'client_secret')) {
    return { error: 'missing-client-secret' };
  }
  if (!Object.prototype.hasOwnProperty.call(config, 'server_hostname')) {
    return { error: 'missing-server-hostname' };
  }

  try {
    await setupOpenIdClient(config);
  } catch (err) {
    return { error: 'configuration-error' };
  }

  getAccountDb().mutate('DELETE FROM auth WHERE method = ?', ['openid']);

  // Beyond verifying that the configuration exists, we do not attempt
  // to check if the configuration is actually correct.
  // If the user improperly configures this during bootstrap, there is
  // no way to recover without manually editing the database. However,
  // this might not be a real issue since an analogous situation happens
  // if they forget their password.
  let accountDb = getAccountDb();
  accountDb.mutate('UPDATE auth SET active = 0');
  accountDb.mutate(
    "INSERT INTO auth (method, display_name, extra_data, active) VALUES ('openid', 'OpenID', ?, 1)",
    [JSON.stringify(config)],
  );

  return {};
}

async function setupOpenIdClient(config) {
  let issuer =
    typeof config.issuer === 'string'
      ? await Issuer.discover(config.issuer)
      : new Issuer({
          issuer: config.issuer.name,
          authorization_endpoint: config.issuer.authorization_endpoint,
          token_endpoint: config.issuer.token_endpoint,
          userinfo_endpoint: config.issuer.userinfo_endpoint,
        });

  const client = new issuer.Client({
    client_id: config.client_id,
    client_secret: config.client_secret,
    redirect_uri: config.server_hostname + '/account/login-openid/cb',
  });

  return client;
}

export async function loginWithOpenIdSetup(body) {
  if (!body.return_url) {
    return { error: 'return-url-missing' };
  }

  let accountDb = getAccountDb();
  let config = accountDb.first('SELECT extra_data FROM auth WHERE method = ?', [
    'openid',
  ]);
  if (!config) {
    return { error: 'openid-not-configured' };
  }
  config = JSON.parse(config['extra_data']);

  let client;
  try {
    client = await setupOpenIdClient(config);
  } catch (err) {
    return { error: 'openid-setup-failed: ' + err };
  }

  const state = generators.state();
  const code_verifier = generators.codeVerifier();
  const code_challenge = generators.codeChallenge(code_verifier);

  const now_time = Date.now();
  const expiry_time = now_time + 300 * 1000;

  accountDb.mutate(
    'DELETE FROM pending_openid_requests WHERE expiry_time < ?',
    [now_time],
  );
  accountDb.mutate(
    'INSERT INTO pending_openid_requests (state, code_verifier, return_url, expiry_time) VALUES (?, ?, ?, ?)',
    [state, code_verifier, body.return_url, expiry_time],
  );

  const url = client.authorizationUrl({
    response_type: 'code',
    scope: 'openid email profile',
    state,
    code_challenge,
    code_challenge_method: 'S256',
  });

  return { url };
}

export async function loginWithOpenIdFinalize(body) {
  if (!body.code) {
    return { error: 'missing-authorization-code' };
  }
  if (!body.state) {
    return { error: 'missing-state' };
  }

  let accountDb = getAccountDb();
  let config = accountDb.first(
    "SELECT extra_data FROM auth WHERE method = 'openid' AND active = 1",
  );
  if (!config) {
    return { error: 'openid-not-configured' };
  }
  config = JSON.parse(config['extra_data']);

  let client;
  try {
    client = await setupOpenIdClient(config);
  } catch (err) {
    return { error: 'openid-setup-failed: ' + err };
  }

  let { code_verifier, return_url } = accountDb.first(
    'SELECT code_verifier, return_url FROM pending_openid_requests WHERE state = ? AND expiry_time > ?',
    [body.state, Date.now()],
  );

  try {
    let grant = await client.grant({
      grant_type: 'authorization_code',
      code: body.code,
      code_verifier,
      redirect_uri: client.redirect_uris[0],
    });
    const userInfo = await client.userinfo(grant);
    const identity =
      userInfo.preferred_username ??
      userInfo.login ??
      userInfo.email ??
      userInfo.id ??
      userInfo.name;
    if (identity == null) {
      return { error: 'openid-grant-failed: no identification was found' };
    }

    let { c } = accountDb.first(
      'SELECT count(*) as c FROM users WHERE user_name <> ?',
      [''],
    );
    let userId = null;
    if (c === 0) {
      userId = uuid.v4();
      accountDb.mutate(
        'INSERT INTO users (id, user_name, display_name, enabled, master) VALUES (?, ?, ?, 1, 1)',
        [userId, identity, userInfo.name ?? userInfo.email ?? identity],
      );

      accountDb.mutate(
        'INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)',
        [userId, '213733c1-5645-46ad-8784-a7b20b400f93'],
      );
    } else {
      let { id: userIdFromDb, display_name: displayName } =
        accountDb.first(
          'SELECT id, display_name FROM users WHERE user_name = ? and enabled = 1',
          [identity],
        ) || {};

      if (userIdFromDb == null) {
        return {
          error:
            'openid-grant-failed: user does not have access to Actual Budget',
        };
      }

      if (!displayName && userInfo.name) {
        accountDb.mutate('UPDATE users set display_name = ? WHERE id = ?', [
          userInfo.name,
          userIdFromDb,
        ]);
      }

      userId = userIdFromDb;
    }

    const token = uuid.v4();

    let expiration = TOKEN_EXPIRATION_NEVER;
    if (finalConfig.token_expiration == 'openid-provider') {
      expiration = grant.expires_at ?? TOKEN_EXPIRATION_NEVER;
    } else if (finalConfig.token_expiration != 'never' &&
      typeof finalConfig.token_expiration === 'number') {
      expiration =
        Math.floor(Date.now() / 1000) + finalConfig.token_expiration * 60;
    }

    accountDb.mutate(
      'INSERT INTO sessions (token, expires_at, user_id, auth_method) VALUES (?, ?, ?, ?)',
      [token, expiration, userId, 'openid'],
    );

    clearExpiredSessions();

    return { url: `${return_url}/openid-cb?token=${token}` };
  } catch (err) {
    return { error: 'openid-grant-failed: ' + err };
  }
}
