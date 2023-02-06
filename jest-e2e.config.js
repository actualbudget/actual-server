const base = require('./jest.config');
module.exports = {
  ...base,
  coverageDirectory: '<rootDir>/coverage-e2e',
  testMatch: ['<rootDir>/**/*.e2e-spec.js']
};
