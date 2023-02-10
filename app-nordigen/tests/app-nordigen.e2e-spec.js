import request from 'supertest';
import nordigenApp from '../app-nordigen';
import puppeteer from 'puppeteer';

const institutionId = 'SANDBOXFINANCE_SFIN0000';
let server, accountId, nordigenLink, requisitionId;

const approveBankConnection = async (link) => {
  const browser = await puppeteer.launch({
    headless: true,
    slowMo: 30
  });
  const page = await browser.newPage();
  const acceptBeforeUnload = (dialog) => dialog.type() === 'beforeunload' && dialog.accept();

  await page.setExtraHTTPHeaders({
    'x-actual-token': 'valid-token',
    'x-actual-file-id': 'file-id'
  });

  page.on('dialog', acceptBeforeUnload);

  await page.goto(link);

  let selector =
    'body > div > div.container > div.content > div.btn-container > form > input.btn.btn-success.custom_theme_button_clr.custom_theme_button_txt_clr';
  await page.waitForSelector(selector);
  await page.click(selector);
  await page.waitForNavigation();

  selector = 'body > div > div.form-container > form > input.btn.btn-primary';
  await page.waitForSelector(selector);
  await page.click(selector);
  await page.waitForNavigation();

  selector = 'body > div.wrapper > a';
  await page.waitForSelector(selector);
  await page.click(selector);

  await browser.close();
};

if (process.env.SECRET_ID === undefined || process.env.SECRET_KEY === undefined) {
  console.log('Env variables SECRET_ID and SECRET_KEY are missing which are required to execute e2e Nordigen tests');
  process.exit(1);
}

describe('Nordigen', () => {
  beforeAll(async () => {
    server = nordigenApp.handlers.listen(4000);
  });

  afterAll(async () => {
    await server.close();
  });

  it('generate requisition and approve it in bank', async () => {
    const origin = 'http://localhost:3001';
    const res = await request(server).post('/create-web-token').set('Origin', origin).send({
      institutionId
    });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({
      status: 'ok',
      data: {
        link: expect.any(String),
        requisitionId: expect.any(String)
      }
    });

    requisitionId = res.body.data.requisitionId;
    nordigenLink = res.body.data.link;

    await approveBankConnection(nordigenLink);
  }, 60_000);

  it('get accounts details', async () => {
    const res = await request(server).post('/get-accounts').send({
      requisitionId
    });

    accountId = res.body.data.accounts[0].account_id;

    expect(res.body).toMatchSnapshot({
      data: {
        account_selection: false,
        accounts: expect.arrayContaining([
          expect.objectContaining({
            account_id: expect.any(String),
            institution: {
              bic: 'SFIN0000',
              countries: ['XX'],
              id: 'SANDBOXFINANCE_SFIN0000',
              logo: 'https://cdn.nordigen.com/ais/SANDBOXFINANCE_SFIN0000.png',
              name: 'Sandbox Finance',
              supported_features: [],
              supported_payments: {},
              transaction_total_days: '90'
            },
            mask: expect.stringMatching(/\d{4}/),
            name: expect.stringMatching(/Main Account \(XXX \d{4}\)/),
            official_name: expect.any(String),
            type: 'checking'
          })
        ]),
        agreement: expect.any(String),
        created: expect.any(String),
        id: expect.any(String),
        institution_id: 'SANDBOXFINANCE_SFIN0000',
        link: expect.any(String),
        redirect: 'http://localhost:3001/nordigen/link',
        redirect_immediate: false,
        reference: expect.any(String),
        ssn: null,
        status: 'LN'
      },
      status: 'ok'
    });
  }, 20_000);

  it('get transactions', async () => {
    const res = await request(server).post('/transactions').send({
      requisitionId,
      accountId
    });

    expect(res.body).toMatchSnapshot({
      data: {
        balances: [
          {
            balanceAmount: {
              amount: expect.any(String),
              currency: 'EUR'
            },
            balanceType: 'expected',
            referenceDate: expect.any(String)
          },
          {
            balanceAmount: {
              amount: expect.any(String),
              currency: 'EUR'
            },
            balanceType: 'interimAvailable',
            referenceDate: expect.any(String)
          }
        ],
        startingBalance: expect.any(Number),
        transactions: {
          booked: expect.arrayContaining([
            expect.objectContaining({
              bookingDate: expect.any(String),
              remittanceInformationUnstructured: expect.any(String),
              transactionAmount: {
                amount: expect.any(String),
                currency: 'EUR'
              },
              transactionId: expect.any(String),
              valueDate: expect.any(String)
            })
          ]),
          pending: expect.arrayContaining([
            expect.objectContaining({
              remittanceInformationUnstructured: expect.any(String),
              transactionAmount: {
                amount: expect.any(String),
                currency: 'EUR'
              },
              valueDate: expect.any(String)
            })
          ])
        }
      },
      status: 'ok'
    });
  }, 30_000);

  it('remove requisition', async () => {
    const response = await request(server).post('/remove-account').send({
      requisitionId
    });

    expect(response.body).toMatchSnapshot({
      data: {
        detail: expect.any(String),
        summary: 'Requisition deleted'
      },
      status: 'ok'
    });
  }, 10_000);
});
