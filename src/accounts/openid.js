import getAccountDb, { clearExpiredSessions } from '../account-db.js';
import * as uuid from 'uuid';
import * as openIdClient from 'openid-client';
import finalConfig from '../load-config.js';
import { TOKEN_EXPIRATION_NEVER } from '../util/validate-user.js';
import {
  getUserByUsername,
  transferAllFilesFromUser,
} from '../services/user-service.js';
import { webcrypto } from 'node:crypto';
import fetch from 'node-fetch';

/* eslint-disable-next-line no-undef */
if (!globalThis.crypto) {
  /* eslint-disable-next-line no-undef */
  globalThis.crypto = webcrypto;
}

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
    console.error('Error setting up OpenID client:', err);
    return { error: 'configuration-error' };
  }

  let accountDb = getAccountDb();
  try {
    accountDb.transaction(() => {
      accountDb.mutate('DELETE FROM auth WHERE method = ?', ['openid']);
      accountDb.mutate('UPDATE auth SET active = 0');
      accountDb.mutate(
        "INSERT INTO auth (method, display_name, extra_data, active) VALUES ('openid', 'OpenID', ?, 1)",
        [JSON.stringify(config)],
      );
    });
  } catch (err) {
    console.error('Error updating auth table:', err);
    return { error: 'database-error' };
  }

  return {};
}

async function setupOpenIdClient(config) {
  let discovered;
  if (typeof config.issuer === 'string') {
    discovered = await openIdClient.discovery(
      new URL(config.issuer),
      config.client_id,
      config.client_secret,
    );
  } else {
    const serverMetadata = {
      issuer: config.issuer.name,
      authorization_endpoint: config.issuer.authorization_endpoint,
      token_endpoint: config.issuer.token_endpoint,
      userinfo_endpoint: config.issuer.userinfo_endpoint,
    };
    discovered = new openIdClient.Configuration(
      serverMetadata,
      config.client_id,
      config.client_secret,
    );
  }

  const client = {
    redirect_uris: [
      new URL('/openid/callback', config.server_hostname).toString(),
    ],
    authorizationUrl(params) {
      const urlObj = openIdClient.buildAuthorizationUrl(discovered, {
        ...params,
        redirect_uri: this.redirect_uris[0],
      });
      return urlObj.href;
    },
    async callback(redirectUri, params, checks) {
      const currentUrl = new URL(redirectUri);
      currentUrl.searchParams.set('code', params.code);
      const tokens = await openIdClient.authorizationCodeGrant(
        discovered,
        currentUrl,
        {
          pkceCodeVerifier: checks.code_verifier,
          idTokenExpected: true,
        },
      );
      return {
        access_token: tokens.access_token,
        expires_at: tokens.expires_at,
        claims: () => tokens.claims?.(),
      };
    },
    async grant(grantParams) {
      const currentUrl = new URL(this.redirect_uris[0]);
      currentUrl.searchParams.set('code', grantParams.code);
      currentUrl.searchParams.set('state', grantParams.state);
      const tokens = await openIdClient.authorizationCodeGrant(
        discovered,
        currentUrl,
        {
          pkceCodeVerifier: grantParams.code_verifier,
          expectedState: grantParams.state,
          idTokenExpected: false,
        },
      );
      return {
        access_token: tokens.access_token,
        expires_at: tokens.expires_at,
        claims: () => tokens.claims?.(),
      };
    },
    async userinfo(accessToken, sub = '') {
      if (!config.authMethod || config.authMethod === 'openid') {
        return openIdClient.fetchUserInfo(discovered, accessToken, sub);
      } else {
        const response = await fetch('https://api.github.com/user', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        return response.json();
      }
    },
  };

  return client;
}

export async function loginWithOpenIdSetup(returnUrl) {
  if (!returnUrl) {
    return { error: 'return-url-missing' };
  }
  if (!isValidRedirectUrl(returnUrl)) {
    return { error: 'invalid-return-url' };
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
    console.error('Error parsing OpenID configuration:', err);
    return { error: 'openid-setup-failed' };
  }

  let client;
  try {
    client = await setupOpenIdClient(config);
  } catch (err) {
    console.error('Error setting up OpenID client:', err);
    return { error: 'openid-setup-failed' };
  }

  const state = openIdClient.randomState();
  const code_verifier = openIdClient.randomPKCECodeVerifier();
  const code_challenge = await openIdClient.calculatePKCECodeChallenge(
    code_verifier,
  );

  const now_time = Date.now();
  const expiry_time = now_time + 300 * 1000;

  accountDb.mutate(
    'DELETE FROM pending_openid_requests WHERE expiry_time < ?',
    [now_time],
  );
  accountDb.mutate(
    'INSERT INTO pending_openid_requests (state, code_verifier, return_url, expiry_time) VALUES (?, ?, ?, ?)',
    [state, code_verifier, returnUrl, expiry_time],
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
    console.error('Error parsing OpenID configuration:', err);
    return { error: 'openid-setup-failed' };
  }
  let client;
  try {
    client = await setupOpenIdClient(config);
  } catch (err) {
    console.error('Error setting up OpenID client:', err);
    return { error: 'openid-setup-failed' };
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
    let tokenSet = null;
    if (!config.authMethod || config.authMethod === 'openid') {
      const params = { code: body.code, state: body.state };
      tokenSet = await client.callback(client.redirect_uris[0], params, {
        code_verifier,
        state: body.state,
      });
    } else {
      tokenSet = await client.grant({
        grant_type: 'authorization_code',
        code: body.code,
        redirect_uri: client.redirect_uris[0],
        code_verifier,
        state: body.state,
      });
    }

    const userInfo = await client.userinfo(tokenSet.access_token);

    const identity =
      userInfo.preferred_username ??
      userInfo.login ??
      userInfo.email ??
      userInfo.id ??
      userInfo.name ??
      'default-username';
    if (identity == null) {
      return { error: 'openid-grant-failed: no identification was found' };
    }

    let userId = null;
    try {
      accountDb.transaction(() => {
        let { countUsersWithUserName } = accountDb.first(
          'SELECT count(*) as countUsersWithUserName FROM users WHERE user_name <> ?',
          [''],
        );
        if (countUsersWithUserName === 0) {
          userId = uuid.v4();
          const existingUser = accountDb.first(
            'SELECT id FROM users WHERE user_name = ?',
            [identity],
          );
          if (existingUser) {
            throw new Error('user-already-exists');
          }
          accountDb.mutate(
            'INSERT INTO users (id, user_name, display_name, enabled, owner, role) VALUES (?, ?, ?, 1, 1, ?)',
            [
              userId,
              identity,
              userInfo.name ?? userInfo.email ?? identity,
              'ADMIN',
            ],
          );

          const userFromPasswordMethod = getUserByUsername('');
          if (userFromPasswordMethod) {
            transferAllFilesFromUser(userId, userFromPasswordMethod.user_id);
          }
        } else {
          let { id: userIdFromDb, display_name: displayName } =
            accountDb.first(
              'SELECT id, display_name FROM users WHERE user_name = ? and enabled = 1',
              [identity],
            ) || {};

          if (userIdFromDb == null) {
            throw new Error('openid-grant-failed');
          }

          if (!displayName && userInfo.name) {
            accountDb.mutate('UPDATE users set display_name = ? WHERE id = ?', [
              userInfo.name,
              userIdFromDb,
            ]);
          }

          userId = userIdFromDb;
        }
      });
    } catch (error) {
      if (error.message === 'user-already-exists') {
        return { error: 'user-already-exists' };
      } else if (error.message === 'openid-grant-failed') {
        return { error: 'openid-grant-failed' };
      } else {
        throw error;
      }
    }

    const token = uuid.v4();
    let expiration;
    if (finalConfig.token_expiration === 'openid-provider') {
      expiration = tokenSet.expires_at ?? TOKEN_EXPIRATION_NEVER;
    } else if (finalConfig.token_expiration === 'never') {
      expiration = TOKEN_EXPIRATION_NEVER;
    } else if (typeof finalConfig.token_expiration === 'number') {
      expiration =
        Math.floor(Date.now() / 1000) + finalConfig.token_expiration * 60;
    } else {
      expiration = Math.floor(Date.now() / 1000) + 10 * 60;
    }

    accountDb.mutate(
      'INSERT INTO sessions (token, expires_at, user_id, auth_method) VALUES (?, ?, ?, ?)',
      [token, expiration, userId, 'openid'],
    );

    clearExpiredSessions();

    return { url: `${return_url}/openid-cb?token=${token}` };
  } catch (err) {
    console.error('OpenID grant failed:', err);
    return { error: 'openid-grant-failed' };
  }
}

export function getServerHostname() {
  const auth = getAccountDb().first(
    'select * from auth WHERE method = ? and active = 1',
    ['openid'],
  );
  if (auth && auth.extra_data) {
    try {
      const openIdConfig = JSON.parse(auth.extra_data);
      return openIdConfig.server_hostname;
    } catch (error) {
      console.error('Error parsing OpenID configuration:', error);
    }
  }
  return null;
}

export function isValidRedirectUrl(url) {
  const serverHostname = getServerHostname();

  if (!serverHostname) {
    return false;
  }

  try {
    const redirectUrl = new URL(url);
    const serverUrl = new URL(serverHostname);
    if (
      redirectUrl.hostname === serverUrl.hostname ||
      redirectUrl.hostname === 'localhost'
    ) {
      return true;
    } else {
      return false;
    }
  } catch (err) {
    return false;
  }
}
