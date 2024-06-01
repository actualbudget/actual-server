import AmericanExpressAesudef1 from '../banks/american-express-aesudef1.js';
import BankFactory from '../bank-factory.js';
import BankinterBkbkesmm from '../banks/bankinter-bkbkesmm.js';
import Belfius from '../banks/belfius_gkccbebb.js';
import BnpBeGebabebb from '../banks/bnp-be-gebabebb.js';
import DanskeBankDabNO22 from '../banks/danskebank-dabno22.js';
import IngIngddeff from '../banks/ing-ingddeff.js';
import IngPlIngbplpw from '../banks/ing-pl-ingbplpw.js';
import IntegrationBank from '../banks/integration-bank.js';
import MbankRetailBrexplpw from '../banks/mbank-retail-brexplpw.js';
import NorwegianXxNorwnok1 from '../banks/norwegian-xx-norwnok1.js';
import SandboxfinanceSfin0000 from '../banks/sandboxfinance-sfin0000.js';
import SEBKortBankAB from '../banks/seb-kort-bank-ab.js';
import SEBPrivat from '../banks/seb-privat.js';
import SparNordSpNoDK22 from '../banks/sparnord-spnodk22.js';
import SpkKarlsruhekarsde66 from '../banks/spk-karlsruhe-karsde66.js';
import SpkMarburgBiedenkopfHeladef1mar from '../banks/spk-marburg-biedenkopf-heladef1mar.js';

describe('BankFactory', () => {
  it('should return AmericanExpressAesudef1 when institutionId is AMERICAN_EXPRESS_AESUDEF1', () => {
    const institutionId = AmericanExpressAesudef1.institutionIds[0];
    const result = BankFactory(institutionId);

    expect(result.institutionIds).toContain(institutionId);
  });

  it('should return BankinterBkbkesmm when institutionId is BANKINTER_BKBKESMM', () => {
    const institutionId = BankinterBkbkesmm.institutionIds[0];
    const result = BankFactory(institutionId);

    expect(result.institutionIds).toContain(institutionId);
  });

  it('should return Belfius when institutionId is BELFIUS_GKCCBEBB', () => {
    const institutionId = Belfius.institutionIds[0];
    const result = BankFactory(institutionId);

    expect(result.institutionIds).toContain(institutionId);
  });

  it('should return BnpBeGebabebb when institutionId is FINTRO_BE_GEBABEBB', () => {
    const institutionId = BnpBeGebabebb.institutionIds[0];
    const result = BankFactory(institutionId);

    expect(result.institutionIds).toContain(institutionId);
  });

  it('should return DanskeBankDabNO22 when institutionId is DANSKEBANK_DABANO22', () => {
    const institutionId = DanskeBankDabNO22.institutionIds[0];
    const result = BankFactory(institutionId);

    expect(result.institutionIds).toContain(institutionId);
  });

  it('should return IngIngddeff when institutionId is ING_INGDDEFF', () => {
    const institutionId = IngIngddeff.institutionIds[0];
    const result = BankFactory(institutionId);

    expect(result.institutionIds).toContain(institutionId);
  });

  it('should return IngPlIngbplpw when institutionId is ING_PL_INGBPLPW', () => {
    const institutionId = IngPlIngbplpw.institutionIds[0];
    const result = BankFactory(institutionId);

    expect(result.institutionIds).toContain(institutionId);
  });

  it('should return IntegrationBank when institutionId is not found', () => {
    const institutionId = IntegrationBank.institutionIds[0];
    const result = BankFactory('fake-id-not-found');

    expect(result.institutionIds).toContain(institutionId);
  });

  it('should return MbankRetailBrexplpw when institutionId is MBANK_RETAIL_BREXPLPW', () => {
    const institutionId = MbankRetailBrexplpw.institutionIds[0];
    const result = BankFactory(institutionId);

    expect(result.institutionIds).toContain(institutionId);
  });

  it('should return NorwegianXxNorwnok1when institutionId is NORWEGIAN_NO_NORWNOK1', () => {
    const institutionId = NorwegianXxNorwnok1.institutionIds[0];
    const result = BankFactory(institutionId);

    expect(result.institutionIds).toContain(institutionId);
  });

  it('should return SandboxfinanceSfin0000 when institutionId is SANDBOXFINANCE_SFIN0000', () => {
    const institutionId = SandboxfinanceSfin0000.institutionIds[0];
    const result = BankFactory(institutionId);

    expect(result.institutionIds).toContain(institutionId);
  });

  it('should return SEBKortBankAB when institutionId is SEB_KORT_AB_NO_SKHSFI21', () => {
    const institutionId = SEBKortBankAB.institutionIds[0];
    const result = BankFactory(institutionId);

    expect(result.institutionIds).toContain(institutionId);
  });

  it('should return SEBPrivat when institutionId is SEB_ESSESESS_PRIVATE', () => {
    const institutionId = SEBPrivat.institutionIds[0];
    const result = BankFactory(institutionId);

    expect(result.institutionIds).toContain(institutionId);
  });

  it('should return SparNordSpNoDK22 when institutionId is SPARNORD_SPNODK22', () => {
    const institutionId = SparNordSpNoDK22.institutionIds[0];
    const result = BankFactory(institutionId);

    expect(result.institutionIds).toContain(institutionId);
  });

  it('should return SpkKarlsruhekarsde66 when institutionId is SPK_KARLSRUHE_KARSDE66XXX', () => {
    const institutionId = SpkKarlsruhekarsde66.institutionIds[0];
    const result = BankFactory(institutionId);

    expect(result.institutionIds).toContain(institutionId);
  });

  it('should return SpkMarburgBiedenkopfHeladef1mar when institutionId is SPK_MARBURG_BIEDENKOPF_HELADEF1MAR', () => {
    const institutionId = SpkMarburgBiedenkopfHeladef1mar.institutionIds[0];
    const result = BankFactory(institutionId);

    expect(result.institutionIds).toContain(institutionId);
  });
});
