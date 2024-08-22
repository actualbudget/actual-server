export class GenericSimplefinError extends Error {
  constructor(data = {}) {
    super('GoCardless returned error');
    this.details = data;
  }
}
