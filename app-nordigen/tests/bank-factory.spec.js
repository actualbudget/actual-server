const BankFactory = require('../bank-factory');
const MbankRetailBrexplpw = require('../banks/mbank-retail-brexplpw');
const SandboxfinanceSfin0000 = require('../banks/sandboxfinance-sfin0000');
const IngPlIngbplpw = require('../banks/ing-pl-ingbplpw');
const IntegrationBank = require('../banks/integration-bank');

describe('BankFactory', () => {
  it('should return MbankRetailBrexplpw when institutionId is mbank-retail-brexplpw', () => {
    const institutionId = MbankRetailBrexplpw.institutionId;
    const result = BankFactory(institutionId);

    expect(result.institutionId).toBe(institutionId);
  });

  it('should return SandboxfinanceSfin0000 when institutionId is sandboxfinance-sfin0000', () => {
    const institutionId = SandboxfinanceSfin0000.institutionId;
    const result = BankFactory(institutionId);

    expect(result.institutionId).toBe(institutionId);
  });

  it('should return IngPlIngbplpw when institutionId is ing-pl-ingbplpw', () => {
    const institutionId = IngPlIngbplpw.institutionId;
    const result = BankFactory(institutionId);

    expect(result.institutionId).toBe(institutionId);
  });

  it('should return IntegrationBank when institutionId is not found', () => {
    const institutionId = IntegrationBank.institutionId;
    const result = BankFactory(institutionId);

    expect(result.institutionId).toBe(institutionId);
  });
});
