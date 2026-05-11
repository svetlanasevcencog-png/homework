Cypress.Commands.add('addTodo', (text) => {
  cy.get('.new-todo').type(`${text}{enter}`);
});

Cypress.Commands.add('todoRowByText', (text) => {
  return cy.contains('.todo-list li', text);
});
