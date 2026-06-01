const { DEFAULT_DIDAXIS_URL } = require('../../fixtures/didaxis-url');

/** @type {Set<string>} */
const programIdsToCleanup = new Set();

function baseUrl() {
  return Cypress.env('DIDAXIS_URL') || DEFAULT_DIDAXIS_URL;
}

function apiToken() {
  return Cypress.env('DIDAXIS_API_TOKEN');
}

function requireApiToken(suiteLabel) {
  if (!apiToken()) {
    throw new Error(
      `DIDAXIS_API_TOKEN must be defined in .env to run ${suiteLabel} tests.`,
    );
  }
}

function resetProgramCleanup() {
  programIdsToCleanup.clear();
}

function trackProgram(id) {
  programIdsToCleanup.add(id);
}

/**
 * Resolve a created program's UUID via GET /api/programs and register it for teardown.
 * Call after the program is visible in the UI (or API has returned 201).
 */
function trackProgramByName(programName) {
  return cy
    .request({
      method: 'GET',
      url: `${baseUrl()}/api/programs`,
      headers: { Authorization: `Bearer ${apiToken()}` },
    })
    .then((response) => {
      expect(response.status).to.eq(200);
      const created = response.body.data?.find(
        (program) => program.name === programName,
      );
      expect(created, `Expected "${programName}" in API program list.`).to.exist;
      trackProgram(created.id);
    });
}

function cleanupTrackedPrograms() {
  if (programIdsToCleanup.size === 0) {
    return cy.wrap(null, { log: false });
  }

  const ids = [...programIdsToCleanup];
  programIdsToCleanup.clear();
  const failures = [];

  return cy.wrap(ids).each((id) => {
    cy.request({
      method: 'DELETE',
      url: `${baseUrl()}/api/programs/${id}`,
      headers: { Authorization: `Bearer ${apiToken()}` },
      failOnStatusCode: false,
    }).then((response) => {
      if (![200, 204, 404].includes(response.status)) {
        failures.push(`${id}: ${response.status} ${response.statusMessage}`);
      }
    });
  }).then(() => {
    if (failures.length > 0) {
      throw new Error(
        `Program cleanup failed for ${failures.length} item(s):\n${failures.join('\n')}`,
      );
    }
  });
}

module.exports = {
  cleanupTrackedPrograms,
  requireApiToken,
  resetProgramCleanup,
  trackProgram,
  trackProgramByName,
};
