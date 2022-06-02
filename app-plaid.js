const express = require('express');
const uuid = require('uuid');
const fetch = require('node-fetch');
const plaid = require('plaid');
const { openDatabase: connectDb } = require('./db');
const { handleError } = require('./util/handle-error');
const { validateSubscribedUser } = require('./util/validate-user');
const config = require('./load-config');
const { getPlaidDb } = require('./plaid-db');
const { access } = require('fs');

const app = express();

let plaidClient;
let plaidDb;

async function init() {
  plaidDb = getPlaidDb();
  // let rows = plaidDb.all('SELECT * FROM plaid_config');

  // if (rows.length !== 0) {
    plaidClient = new plaid.Client({
      clientID: $PLAID_CLIENT_ID,
      secret: $PLAID_SECRET,
      env: plaid.environments[$PLAID_ENV],
      options: { version: '2019-05-29' }
    });
  // }
}

async function validateToken(req, res) {
  var token;
  if (req.body.token.webToken === undefined) {
    token = req.body.token;
  } else {
    token = req.body.token.webToken;
  }
  const rows = await plaidDb.all('SELECT * FROM webTokens WHERE token_id = ?', [token]);
  if (rows.length === 0) {
    res.send(JSON.stringify({ status: 'error', reason: 'not-found' }));
    return null;
  }

  // Tokens are only valid for 10 minutes
  let validTime = 1000 * 60 * 10;
  let row = rows[0];
  let timeCreated = new Date(row.time_created);

  if (Date.now() - timeCreated.getTime() >= validTime) {
    res.send(JSON.stringify({ status: 'error', reason: 'expired' }));
    return null;
  }

  return row;
}

app.post('/add-plaid-client-id', handleError(async (req, res) => {
  await plaidDb.mutate('UPDATE plaid_config SET plaid_client_id = ?', [req.body.clientID]);
})
);

app.post('/add-plaid-secret', handleError(async (req, res) => {
  await plaidDb.mutate('UPDATE plaid_config SET plaid_secret = ?', [req.body.secret]);
})
);

app.post('/create-web-token', handleError(async (req, res) => {
  let user = await validateSubscribedUser(req, res);
  if (!user) {
    return;
  }

  let token = uuid.v4();
  await plaidDb.mutate('DELETE FROM webTokens WHERE user_id = ?', [user.id]);
  await plaidDb.mutate('INSERT INTO webTokens (user_id, token_id, time_created) VALUES (?, ?, ?)', [user.id, token, Date.now()]);
  res.send(
    JSON.stringify({
      status: 'ok',
      data: token
    })
  );
})
);

app.post('/validate-web-token', handleError(async (req, res) => {
  let token = await validateToken(req, res);
  if (!token) {
    return;
  }

  res.send(JSON.stringify({ status: 'ok' }));
})
);

app.post('/put-web-token-contents', handleError(async (req, res) => {
  let token = await validateToken(req, res);
  if (!token) {
    return;
  }

  let { data } = req.body;
  await plaidDb.mutate('UPDATE webTokens SET contents = ? WHERE user_id = ?', [JSON.stringify(data), '0']);
  res.send(
    JSON.stringify({
      status: 'ok',
      data: null
    })
  );
})
);

app.post('/get-web-token-contents', handleError(async (req, res) => {
  let user = await validateSubscribedUser(req, res);
  if (!user) {
    return;
  }

  let token = await validateToken(req, res);
  if (!token) {
    return;
  }

  let rows = await plaidDb.all('SELECT * FROM webTokens WHERE user_id = ?', ['0']);

  if (rows.length === 0) {
    res.send(
      JSON.stringify({
        status: 'error',
        reason: 'not-found'
      })
    );
  }

  res.send(
    JSON.stringify({
      status: 'ok',
      data: JSON.parse(rows[0].contents)
    })
  );
})
);

app.post('/make_link_token', handleError(async (req, res) => {
  let token = await validateToken(req, res);
  if (!token) {
    return;
  }

  let result = await plaidClient.createLinkToken({
    user: {
      client_user_id: '0'
    },
    client_name: 'Actual',
    products: ['transactions'],
    country_codes: ['US'],
    language: 'en'
  });
  res.send(JSON.stringify({ status: 'ok', data: result.link_token }));
})
);

app.post('/handoff_public_token', handleError(async (req, res) => {
  let user = await validateSubscribedUser(req, res);
  if (!user) {
    return;
  }
  let { item_id, public_token } = req.body;

  plaidClient.exchangePublicToken(public_token, async function (error, tokenResponse) {
    if (error != null) {
      console.error(error);
      process.exit(1);
    }
    await plaidDb.mutate('INSERT INTO access_tokens (item_id, user_id, access_token, deleted) VALUES (?, ?, ?, ?)', [item_id, user.id, tokenResponse.access_token, 'FALSE']);

    res.send(JSON.stringify({ status: 'ok' }));
  });
})
);

app.post('/remove-access-token', handleError(async (req, res) => {
  let user = await validateSubscribedUser(req, res);
  if (!user) {
    return;
  }
  let item_id = req.body.item_id;

  const rows = await plaidDb.all('SELECT * FROM access_tokens WHERE item_id = ?', [item_id]);

  if (rows.length === 0) {
    throw new Error('access token not found');
  }

  const access_token = rows[0].access_token;

  let response = await plaidClient.removeItem(access_token);

  if (response.removed !== true) {
    console.log('[Error] Item not removed: ' + access_token.slice(0, 3));
  }

  await plaidDb.mutate('UPDATE access_tokens SET deleted = ? WHERE access_token = ?', ['TRUE', access_token]);

  res.send(
    JSON.stringify({
      status: 'ok',
      data: response
    })
  );
})
);

app.post('/accounts', handleError(async (req, res) => {
  let user = await validateSubscribedUser(req, res);
  if (!user) {
    return;
  }
  const { item_id } = req.body;

  const rows = await plaidDb.all('SELECT * FROM access_tokens WHERE item_id = ?', [item_id]);

  if (rows.length === 0) {
    throw new Error('access token not found');
  }
  const access_token = rows[0].access_token;

  plaidClient.getAccounts(access_token, async (error, { accounts, item }) => {
    res.send(
      JSON.stringify({
        status: 'ok',
        data: accounts
      })
    );
  });
})
);

app.post('/transactions', handleError(async (req, res) => {
  let user = await validateSubscribedUser(req, res);
  if (!user) {
    return;
  }
  let { item_id, start_date, end_date, account_id, count, offset } = req.body;

  const rows = await plaidDb.all('SELECT * FROM access_tokens WHERE item_id = ? AND deleted = ?', [item_id, 'FALSE']);

  if (rows.length === 0) {
    res.status(400);
    res.send('access-token-not-found');
    return;
  }

  const access_token = rows[0].access_token;

  let transactions = await plaidClient.getTransactions(access_token, start_date, end_date);

  res.send(
    JSON.stringify({
      status: 'ok',
      data: transactions
    })
  );
})
);

app.post('/make-public-token', handleError(async (req, res) => {
  let user = await validateSubscribedUser(req, res);
  if (!user) {
    return;
  }
  let { item_id } = req.body;

  const rows = await plaidDb.mutate('SELECT * FROM access_tokens WHERE user_id = ? AND item_id = ?', [user.id, item_id]);

  if (rows.length === 0) {
    throw new Error('access token not found');
  }
  const { access_token } = rows[0];

  let result = await plaidClient.createLinkToken({
    user: {
      client_user_id: user.id
    },
    client_name: 'Actual',
    country_codes: ['US'],
    language: 'en',
    access_token: access_token
  });

  res.send(
    JSON.stringify({
      status: 'ok',
      data: result
    })
  );
})
);

module.exports.handlers = app;
module.exports.init = init;
