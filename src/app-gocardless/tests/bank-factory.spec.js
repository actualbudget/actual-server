import BankFactory from '../bank-factory.js';
import { banks } from '../bank-factory.js';
import IntegrationBank from '../banks/integration-bank.js';

describe('BankFactory', () => {
  for (const bank of banks) {
    for (const institutionId of bank.institutionIds) {
      it(`should return institutionId ${institutionId}`, () => {
        const result = BankFactory(institutionId);

        expect(result.institutionIds).toContain(institutionId);
      });
    }
  }

  it('should return IntegrationBank when institutionId is not found', () => {
    const institutionId = IntegrationBank.institutionIds[0];
    const result = BankFactory('fake-id-not-found');

    expect(result.institutionIds).toContain(institutionId);
  });
});
