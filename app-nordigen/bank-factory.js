import IngPlIngbplpw from './banks/ing-pl-ingbplpw';
import IntegrationBank from './banks/integration-bank';
import MbankRetailBrexplpw from './banks/mbank-retail-brexplpw';
import SandboxfinanceSfin0000 from './banks/sandboxfinance-sfin0000';

const banks = [MbankRetailBrexplpw, SandboxfinanceSfin0000, IngPlIngbplpw];

export default (institutionId) => banks.find((b) => b.institutionId === institutionId) || IntegrationBank;
