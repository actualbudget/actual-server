const BankFactory = require('../bank-factory');
const MbankRetailBrexplpw = require('../banks/mbank-retail-brexplpw');
const SandboxfinanceSfin0000 = require('../banks/sandboxfinance-sfin0000');
const IngPlIngbplpw = require('../banks/ing-pl-ingbplpw');
const IntegrationBank = require('../banks/integration-bank');

describe('BankFactory', () => {
  it('should return MbankRetailBrexplpw instance when institutionId is MbankRetailBrexplpw.institutionId', () => {
    const bank = BankFactory(MbankRetailBrexplpw.institutionId);
    expect(bank instanceof MbankRetailBrexplpw).toBe(true);
  });

  it('should return SandboxfinanceSfin0000 instance when institutionId is SandboxfinanceSfin0000.institutionId', () => {
    const bank = BankFactory(SandboxfinanceSfin0000.institutionId);
    expect(bank instanceof SandboxfinanceSfin0000).toBe(true);
  });

  it('should return IngPlIngbplpw instance when institutionId is IngPlIngbplpw.institutionId', () => {
    const bank = BankFactory(IngPlIngbplpw.institutionId);
    expect(bank instanceof IngPlIngbplpw).toBe(true);
  });

  it('should return IntegrationBank instance when institutionId does not match any of the specified ids', () => {
    const bank = BankFactory('random-institution-id');
    expect(bank instanceof IntegrationBank).toBe(true);
  });
});
