import getAccountDb from "./index.js";
import { generators, Issuer } from 'openid-client';

export function bootstrapOpenId(config) {
    if (!config.hasOwnProperty('issuer')) {
      return { error: 'missing-issuer' };
    }
    if (!config.hasOwnProperty('client_id')) {
      return { error: 'missing-client-id' };
    }
    if (!config.hasOwnProperty('client_secret')) {
      return { error: 'missing-client-secret' };
    }
    if (!config.hasOwnProperty('server_hostname')) {
      return { error: 'missing-server-hostname' };
    }

    // Beyond verifying that the configuration exists, we do not attempt
    // to check if the configuration is actually correct.
    // If the user improperly configures this during bootstrap, there is
    // no way to recover without manually editing the database. However,
    // this might not be a real issue since an analogous situation happens
    // if they forget their password.
    let accountDb = getAccountDb();
    accountDb.mutate(
      "INSERT INTO auth (method, extra_data) VALUES ('openid', ?)",
      [JSON.stringify(config)],
    );

    return {};
}

async function setupOpenIdClient(config) {
  const issuer = await Issuer.discover(config.issuer);

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
  let config = accountDb.first(
    "SELECT extra_data FROM auth WHERE method = 'openid'",
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
    scope: 'openid',
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
    "SELECT extra_data FROM auth WHERE method = 'openid'",
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
    await client.userinfo(grant);
    // The server requests have succeeded, so the user has been authenticated.
    // Ideally, we would create a session token here tied to the returned access token
    // and verify it with the server whenever the user connects.
    // However, the rest of this server code uses only a single permanent token,
    // so that is what we do here as well.
  } catch (err) {
    return { error: 'openid-grant-failed: ' + err };
  }

  let { token } = accountDb.first('SELECT token FROM sessions');
  return { url: `${return_url}/login/openid-cb?token=${token}` };
}

