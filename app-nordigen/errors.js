class RequisitionNotLinked extends Error {
  constructor(params = {}) {
    super('Requisition not linked yet');
    this.details = params;
  }
}

class AccountNotLinedToRequisition extends Error {
  constructor(accountId, requisitionId) {
    super('Provided account id is not linked to given requisition');
    this.details = {
      accountId,
      requisitionId
    };
  }
}

class GenericNordigenError extends Error {
  constructor(data = {}) {
    super('Nordigen returned error');
    this.details = data;
  }
}

class NordigenClientError extends Error {
  constructor(message, details) {
    super(message);
    this.details = details;
  }
}

class InvalidInputDataError extends NordigenClientError {
  constructor(response) {
    super('Invalid provided parameters', response);
  }
}

class InvalidNordigenTokenError extends NordigenClientError {
  constructor(response) {
    super('Token is invalid or expired', response);
  }
}

class AccessDeniedError extends NordigenClientError {
  constructor(response) {
    super('IP address access denied', response);
  }
}

class NotFoundError extends NordigenClientError {
  constructor(response) {
    super('Resource not found', response);
  }
}

class ResourceSuspended extends NordigenClientError {
  constructor(response) {
    super(
      'Resource was suspended due to numerous errors that occurred while accessing it',
      response
    );
  }
}

class RateLimitError extends NordigenClientError {
  constructor(response) {
    super(
      'Daily request limit set by the Institution has been exceeded',
      response
    );
  }
}

class UnknownError extends NordigenClientError {
  constructor(response) {
    super('Request to Institution returned an error', response);
  }
}

class ServiceError extends NordigenClientError {
  constructor(response) {
    super('Institution service unavailable', response);
  }
}

module.exports = {
  RequisitionNotLinked,
  AccountNotLinedToRequisition,
  GenericNordigenError,
  InvalidInputDataError,
  InvalidNordigenTokenError,
  AccessDeniedError,
  NotFoundError,
  ResourceSuspended,
  RateLimitError,
  UnknownError,
  ServiceError
};
