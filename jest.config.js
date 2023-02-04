module.exports = {
  roots: ['<rootDir>'],
  testMatch: ['<rootDir>/**/*.spec.js'],
  testPathIgnorePatterns: ['dist'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  testEnvironment: 'node',
  collectCoverage: true,
  collectCoverageFrom: ['<rootDir>/src/**/*.{js,ts,tsx}'],
  coveragePathIgnorePatterns: ['/node_modules/'],
  coverageReporters: ['html', 'lcov', 'text', 'text-summary'],
  resetMocks: true,
  restoreMocks: true
};
