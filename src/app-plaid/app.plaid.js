import express from 'express';
import path from 'path';

import { handleError } from '../util/handle-error.js';
import validateUser from '../util/validate-user.js';

import { Configuration, CountryCode, PlaidApi, PlaidEnvironments, Products } from 'plaid';
import { config } from 'process';

const configuration = new Configuration({
    basePath: PlaidEnvironments.sandbox,
    baseOptions: {
        headers: {
            'PLAID-CLIENT-ID': '',
            'PLAID-SECRET': '',
        },
    },
});
const client = new PlaidApi(configuration);

const app = express();
app.get('/link', function (req, res) {
    res.sendFile('link.html', { root: path.resolve('./src/app-plaid') });
});

export { app as handlers };
app.use(express.json());
app.use(async (req, res, next) => {
    let user = await validateUser(req, res);
    if (!user) {
        return;
    }
    next();
});

app.post(
    '/create-web-token',
    handleError(async (req, res) => {
        const { origin } = req.headers;

        const link = origin + '/plaid/link';

        res.send({
            status: 'ok',
            data: {
                link
            },
        });
    }),
);

app.post(
    '/create-link-token',
    handleError(async (req, res) => {
        const response = await client.linkTokenCreate({
            user: {
                client_user_id: 'userID',
            },
            client_name: 'Test',
            products: [Products.Transactions],
            country_codes: [CountryCode.Us],
            language: 'en',
        });

        res.send(JSON.stringify({ status: 'ok', data: response.data.link_token }));
    }),
);

app.post(
    '/accounts',
    handleError(async (req, res) => {

    }),
);