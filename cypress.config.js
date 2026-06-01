const { defineConfig } = require('cypress');
const { DEFAULT_DIDAXIS_URL } = require('./fixtures/didaxis-url.js');

require('dotenv').config();

module.exports = defineConfig({
  e2e: {
    baseUrl: process.env.BASE_URL || 'https://demo.playwright.dev/todomvc',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/e2e.js',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: false,
    screenshotOnRunFailure: true,
    retries: { runMode: 1, openMode: 0 },
    env: {
      ...process.env,
      DIDAXIS_URL: process.env.DIDAXIS_URL || DEFAULT_DIDAXIS_URL,
    },
  },
});
