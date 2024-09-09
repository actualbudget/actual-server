import AmericanExpressAesudef1 from './banks/american-express-aesudef1.js';
import IngPlIngbplpw from './banks/ing-pl-ingbplpw.js';
import IntegrationBank from './banks/integration-bank.js';
import MbankRetailBrexplpw from './banks/mbank-retail-brexplpw.js';
import NorwegianXxNorwnok1 from './banks/norwegian-xx-norwnok1.js';
import SandboxfinanceSfin0000 from './banks/sandboxfinance-sfin0000.js';
import FintroBeGebabebb from './banks/fintro-be-gebabebb.js';
import DanskeBankDabNO22 from './banks/danskebank-dabno22.js';
import SparNordSpNoDK22 from './banks/sparnord-spnodk22.js';

const banks = [
  AmericanExpressAesudef1,
  IngPlIngbplpw,
  MbankRetailBrexplpw,
  SandboxfinanceSfin0000,
  NorwegianXxNorwnok1,
  FintroBeGebabebb,
  DanskeBankDabNO22,
  SparNordSpNoDK22,
];

export default (institutionId) =>
  banks.find((b) => b.institutionIds.includes(institutionId)) ||
  IntegrationBank;
