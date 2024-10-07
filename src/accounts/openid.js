import getAccountDb, { clearExpiredSessions } from '../account-db.js';
import * as uuid from 'uuid';
import { generators, Issuer } from 'openid-client';
import finalConfig from '../load-config.js';
import { TOKEN_EXPIRATION_NEVER } from '../util/validate-user.js';

export async function bootstrapOpenId(config) {
  if (!('issuer' in config)) {
    return { error: 'missing-issuer' };
  }
  if (!('client_id' in config)) {
    return { error: 'missing-client-id' };
  }
  if (!('client_secret' in config)) {
    return { error: 'missing-client-secret' };
  }
  if (!('server_hostname' in config)) {
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
  accountDb.transaction(() => {
    accountDb.mutate('UPDATE auth SET active = 0');
    accountDb.mutate(
      "INSERT INTO auth (method, display_name, extra_data, active) VALUES ('openid', 'OpenID', ?, 1)",
      [JSON.stringify(config)],
    );
  });

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
    redirect_uri: config.server_hostname + '/openid/callback',
    validate_id_token: true,
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

  try {
    config = JSON.parse(config['extra_data']);
  } catch (err) {
    return { error: 'openid-setup-failed: ' + err };
  }

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
  try {
    config = JSON.parse(config['extra_data']);
  } catch (err) {
    return { error: 'openid-setup-failed: ' + err };
  }
  let client;
  try {
    client = await setupOpenIdClient(config);
  } catch (err) {
    return { error: 'openid-setup-failed: ' + err };
  }

  let pendingRequest = accountDb.first(
    'SELECT code_verifier, return_url FROM pending_openid_requests WHERE state = ? AND expiry_time > ?',
    [body.state, Date.now()],
  );

  if (!pendingRequest) {
    return { error: 'invalid-or-expired-state' };
  }

  let { code_verifier, return_url } = pendingRequest;

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

    let { countUsersWithUserName } = accountDb.first(
      'SELECT count(*) as countUsersWithUserName FROM users WHERE user_name <> ?',
      [''],
    );
    let userId = null;
    if (countUsersWithUserName === 0) {
      userId = uuid.v4();
      accountDb.mutate(
        'INSERT INTO users (id, user_name, display_name, enabled, owner) VALUES (?, ?, ?, 1, 1)',
        [userId, identity, userInfo.name ?? userInfo.email ?? identity],
      );

      const { id: adminRoleId } =
        accountDb.first('SELECT id FROM roles WHERE name = ?', ['Admin']) || {};

      if (!adminRoleId) {
        return { error: 'administrator-role-not-found' };
      }

      accountDb.mutate(
        'INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)',
        [userId, adminRoleId],
      );
    } else {
      let { id: userIdFromDb, display_name: displayName } =
        accountDb.first(
          'SELECT id, display_name FROM users WHERE user_name = ? and enabled = 1',
          [identity],
        ) || {};

      if (userIdFromDb == null) {
        return { error: 'openid-grant-failed' };
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

    let expiration;
    if (finalConfig.token_expiration === 'openid-provider') {
      expiration = grant.expires_at ?? TOKEN_EXPIRATION_NEVER;
    } else if (finalConfig.token_expiration === 'never') {
      expiration = TOKEN_EXPIRATION_NEVER;
    } else if (typeof finalConfig.token_expiration === 'number') {
      expiration =
        Math.floor(Date.now() / 1000) + finalConfig.token_expiration * 60;
    } else {
      expiration = TOKEN_EXPIRATION_NEVER;
    }

    accountDb.mutate(
      'INSERT INTO sessions (token, expires_at, user_id, auth_method) VALUES (?, ?, ?, ?)',
      [token, expiration, userId, 'openid'],
    );

    clearExpiredSessions();

    return { url: `${return_url}/openid-cb?token=${token}` };
  } catch (err) {
    console.error('OpenID grant failed:', err);
    return { error: 'openid-grant-failed: ' + err };
  }
}
