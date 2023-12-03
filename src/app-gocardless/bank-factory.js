import AmericanExpressAesudef1 from './banks/american-express-aesudef1.js';
import Belfius from './banks/belfius_gkccbebb.js';
import BnpBeGebabebb from './banks/bnp-be-gebabebb.js';
import CaixaGeralDepositorsCgdPtPl from './banks/caixa-geral-depositos-cgdiptpl.js';
import DanskeBankDabNO22 from './banks/danskebank-dabno22.js';
import IngPlIngbplpw from './banks/ing-pl-ingbplpw.js';
import IntegrationBank from './banks/integration-bank.js';
import MbankRetailBrexplpw from './banks/mbank-retail-brexplpw.js';
import MonzoMonzGb21 from './banks/monzo-monzgb2l.js';
import NorwegianXxNorwnok1 from './banks/norwegian-xx-norwnok1.js';
import RevolutRevoGb21 from './banks/revolut-revogb21.js';
import SandboxfinanceSfin0000 from './banks/sandboxfinance-sfin0000.js';
import SantanderGbAbbyGb21 from './banks/santander-gb-abbygb2l.js';
import SparNordSpNoDK22 from './banks/sparnord-spnodk22.js';

const banks = [
  AmericanExpressAesudef1,
  Belfius,
  BnpBeGebabebb,
  CaixaGeralDepositorsCgdPtPl,
  DanskeBankDabNO22,
  IngPlIngbplpw,
  MbankRetailBrexplpw,
  MonzoMonzGb21,
  NorwegianXxNorwnok1,
  RevolutRevoGb21,
  SandboxfinanceSfin0000,
  SantanderGbAbbyGb21,
  SparNordSpNoDK22,
];

export default (institutionId) =>
  banks.find((b) => b.institutionIds.includes(institutionId)) ||
  IntegrationBank;
