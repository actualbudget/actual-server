const IngPlIngbplpw = require('./banks/ing-pl-ingbplpw');
const IntegrationBank = require('./banks/integration-bank');
const MbankRetailBrexplpw = require('./banks/mbank-retail-brexplpw');
const SandboxfinanceSfin0000 = require('./banks/sandboxfinance-sfin0000');

const BankFactory = (institutionId) => {
  switch (institutionId) {
    case MbankRetailBrexplpw.institutionId:
      return new MbankRetailBrexplpw();
    case SandboxfinanceSfin0000.institutionId:
      return new SandboxfinanceSfin0000();
    case IngPlIngbplpw.institutionId:
      return new IngPlIngbplpw();
    default:
      return new IntegrationBank();
  }
};

module.exports = BankFactory;
