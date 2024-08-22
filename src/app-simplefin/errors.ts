export class GenericSimplefinError extends Error {
  details: object;
  constructor(data = {}) {
    super('GoCardless returned error');
    this.details = data;
  }
}
