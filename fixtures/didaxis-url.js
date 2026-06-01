/**
 * Default Didaxis Studio test host when DIDAXIS_URL is unset in `.env`.
 * Playwright: fixtures/auth.constants.ts
 * Cypress: cypress.config.js and Didaxis e2e specs
 */
const DEFAULT_DIDAXIS_URL = 'https://test.didaxis.studio';

module.exports = { DEFAULT_DIDAXIS_URL };
