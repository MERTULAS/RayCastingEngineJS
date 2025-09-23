module.exports = {
  testEnvironment: 'node',
  
  testMatch: [
    '**/lib/__test__/**/*.test.js',
    '**/lib/__test__/**/*.spec.js'
  ],
  
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/lib/$1',
  },
  
  collectCoverageFrom: [
    'lib/**/*.js',
    '!lib/__test__/**',
    '!lib/index.js'
  ],
  
  coverageReporters: [
    'text',
    'lcov',
    'html'
  ],
  
  
  setupFilesAfterEnv: [],
  
  verbose: true
};
