const IngPlIngbplpw = require('./banks/ing-pl-ingbplpw');
const IntegrationBank = require('./banks/integration-bank');
const MbankRetailBrexplpw = require('./banks/mbank-retail-brexplpw');
const SandboxfinanceSfin0000 = require('./banks/sandboxfinance-sfin0000');

const banks = [MbankRetailBrexplpw, SandboxfinanceSfin0000, IngPlIngbplpw];

const BankFactory = (institutionId) => banks.find((b) => b.institutionId === institutionId) || IntegrationBank;

module.exports = BankFactory;
