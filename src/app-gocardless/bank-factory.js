import AbancaCaglesmm from './banks/abanca-caglesmm.js';
import AmericanExpressAesudef1 from './banks/american-express-aesudef1.js';
import BancsabadellBsabesbb from './banks/bancsabadell-bsabesbbb.js';
import BankinterBkbkesmm from './banks/bankinter-bkbkesmm.js';
import Boursorama from './banks/BOURSORAMA_BOUSFRPP.js';
import Belfius from './banks/belfius_gkccbebb.js';
import Berliner_Sparkasse_beladebexxx from './banks/berliner_sparkasse_beladebexxx.js';
import BnpBeGebabebb from './banks/bnp-be-gebabebb.js';
import CBCcregbebb from './banks/cbc_cregbebb.js';
import DanskeBankDabNO22 from './banks/danskebank-dabno22.js';
import EasybankBawaatww from './banks/easybank-bawaatww.js';
import Fortuneo from './banks/FORTUNEO_FTNOFRP1XXX.js';
import IngIngbrobu from './banks/ing-ingbrobu.js';
import IngIngddeff from './banks/ing-ingddeff.js';
import IngPlIngbplpw from './banks/ing-pl-ingbplpw.js';
import IntegrationBank from './banks/integration-bank.js';
import KBCkredbebb from './banks/kbc_kredbebb.js';
import MbankRetailBrexplpw from './banks/mbank-retail-brexplpw.js';
import NationwideNaiaGB21 from './banks/nationwide-naiagb21.js';
import NorwegianXxNorwnok1 from './banks/norwegian-xx-norwnok1.js';
import SEBKortBankAB from './banks/seb-kort-bank-ab.js';
import SEBPrivat from './banks/seb-privat.js';
import SandboxfinanceSfin0000 from './banks/sandboxfinance-sfin0000.js';
import SparNordSpNoDK22 from './banks/sparnord-spnodk22.js';
import SpkKarlsruhekarsde66 from './banks/spk-karlsruhe-karsde66.js';
import SpkMarburgBiedenkopfHeladef1mar from './banks/spk-marburg-biedenkopf-heladef1mar.js';
import VirginNrnbgb22 from './banks/virgin_nrnbgb22.js';
import NbgEthngraaxxx from './banks/nbg_ethngraaxxx.js';

export const banks = [
  AbancaCaglesmm,
  AmericanExpressAesudef1,
  BancsabadellBsabesbb,
  BankinterBkbkesmm,
  Belfius,
  Berliner_Sparkasse_beladebexxx,
  BnpBeGebabebb,
  Boursorama,
  CBCcregbebb,
  DanskeBankDabNO22,
  EasybankBawaatww,
  Fortuneo,
  IngIngbrobu,
  IngIngddeff,
  IngPlIngbplpw,
  KBCkredbebb,
  MbankRetailBrexplpw,
  NationwideNaiaGB21,
  NorwegianXxNorwnok1,
  SEBKortBankAB,
  SEBPrivat,
  SandboxfinanceSfin0000,
  SparNordSpNoDK22,
  SpkKarlsruhekarsde66,
  SpkMarburgBiedenkopfHeladef1mar,
  VirginNrnbgb22,
  NbgEthngraaxxx,
];

export default (institutionId) =>
  banks.find((b) => b.institutionIds.includes(institutionId)) ||
  IntegrationBank;

export const BANKS_WITH_LIMITED_HISTORY = [
  'BRED_BREDFRPPXXX',
  'INDUSTRA_MULTLV2X',
  'MEDICINOSBANK_MDBALT22XXX',
  'CESKA_SPORITELNA_LONG_GIBACZPX',
  'LHV_LHVBEE22',
  'LUMINOR_NDEALT2X',
  'LUMINOR_RIKOEE22',
  'LUMINOR_AGBLLT2X',
  'LUMINOR_NDEALV2X',
  'LUMINOR_NDEAEE2X',
  'LUMINOR_RIKOLV2X',
  'SWEDBANK_HABAEE2X',
  'SWEDBANK_HABALT22',
  'SWEDBANK_HABALV22',
  'SWEDBANK_SWEDSESS',
  'SEB_CBVILT2X',
  'SEB_UNLALV2X',
  'SEB_EEUHEE2X',
  'LABORALKUTXA_CLPEES2M',
  'BANKINTER_BKBKESMM',
  'CAIXABANK_CAIXESBB',
  'JEKYLL_JEYKLL002',
  'SANTANDER_DE_SCFBDE33',
  'BBVA_BBVAESMM',
  'COOP_EKRDEE22',
  'BANCA_AIDEXA_AIDXITMM',
  'BANCA_PATRIMONI_SENVITT1',
  'BANCA_SELLA_SELBIT2B',
  'CARTALIS_CIMTITR1',
  'DOTS_HYEEIT22',
  'HYPE_BUSINESS_HYEEIT22',
  'HYPE_HYEEIT2',
  'ILLIMITY_ITTPIT2M',
  'SMARTIKA_SELBIT22',
  'TIM_HYEEIT22',
  'TOT_SELBIT2B',
  'OPYN_BITAITRRB2B',
  'PAYTIPPER_PAYTITM1',
  'SELLA_PERSONAL_CREDIT_SELBIT22',
  'SANTANDER_BSCHESMM',
  'NORDEA_NDEADKKK',
  'VUB_BANKA_SUBASKBX',
  'REVOLUT_REVOLT21',
];
