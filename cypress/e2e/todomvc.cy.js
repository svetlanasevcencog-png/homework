/// <reference types="cypress" />

const APP_PATH = '/#/';

const ITEMS_4 = ['Buy milk', 'Walk the dog', 'Write test plan', 'Submit homework'];

const addTodos = (items) => items.forEach((t) => cy.addTodo(t));

const expectCounter = (text) => cy.get('.todo-count').should('have.text', text);

const expectLabels = (labels) => {
  cy.get('.todo-list li label').should('have.length', labels.length);
  cy.get('.todo-list li label').each(($el, i) => {
    expect($el.text()).to.equal(labels[i]);
  });
};

beforeEach(() => {
  cy.visit(APP_PATH);
});

/* ------------------------------------------------------------------ */
/* Positive flows                                                      */
/* ------------------------------------------------------------------ */
describe('Positive flows', () => {
  it('TC-001 New list shows empty state with no main/footer sections', () => {
    cy.get('h1').should('have.text', 'todos');
    cy.get('.new-todo')
      .should('be.visible')
      .and('have.attr', 'placeholder', 'What needs to be done?')
      .and('be.focused');

    cy.get('.main').should('not.exist');
    cy.get('.footer').should('not.exist');
  });

  it('TC-002 User can create a list by adding four items', () => {
    addTodos(ITEMS_4);

    cy.get('.todo-list li').should('have.length', 4);
    expectLabels(ITEMS_4);

    ITEMS_4.forEach((item) => {
      cy.todoRowByText(item).find('.toggle').should('not.be.checked');
    });

    expectCounter('4 items left');
  });

  it('TC-003 Input is cleared after each submission', () => {
    cy.addTodo('Task A');
    cy.get('.new-todo').should('have.value', '').and('be.focused');
  });

  it('TC-004 Marking an item as completed updates its state', () => {
    addTodos(ITEMS_4);

    cy.todoRowByText('Walk the dog').as('row');
    cy.get('@row').find('.toggle').check();

    cy.get('@row').should('have.class', 'completed');
    cy.get('@row').find('.toggle').should('be.checked');
    expectCounter('3 items left');
    cy.get('.clear-completed').should('be.visible');
  });

  it('TC-005 Unchecking a completed item returns it to active state', () => {
    addTodos(ITEMS_4);
    cy.todoRowByText('Walk the dog').find('.toggle').check();
    cy.todoRowByText('Walk the dog').should('have.class', 'completed');

    cy.todoRowByText('Walk the dog').find('.toggle').uncheck();

    cy.todoRowByText('Walk the dog').should('not.have.class', 'completed');
    expectCounter('4 items left');
    cy.get('.clear-completed').should('not.exist');
  });

  it('TC-006 Removing an item via the destroy button removes only that item', () => {
    addTodos(ITEMS_4);

    cy.todoRowByText('Write test plan').find('.destroy').click({ force: true });

    cy.get('.todo-list li').should('have.length', 3);
    expectLabels(['Buy milk', 'Walk the dog', 'Submit homework']);
    expectCounter('3 items left');
  });

  it('TC-007 Removing the last remaining item hides main and footer', () => {
    cy.addTodo('Solo task');
    cy.todoRowByText('Solo task').find('.destroy').click({ force: true });

    cy.get('.todo-list li').should('have.length', 0);
    cy.get('.main').should('not.exist');
    cy.get('.footer').should('not.exist');
  });

  it('TC-008 Items persist across page reloads', () => {
    addTodos(ITEMS_4);
    cy.todoRowByText('Walk the dog').find('.toggle').check();

    cy.reload();

    cy.get('.todo-list li').should('have.length', 4);
    expectLabels(ITEMS_4);
    cy.todoRowByText('Walk the dog').should('have.class', 'completed');
    expectCounter('3 items left');
  });

  it('TC-009 Filtering shows only matching items', () => {
    addTodos(ITEMS_4);
    cy.todoRowByText('Walk the dog').find('.toggle').check();
    cy.todoRowByText('Submit homework').find('.toggle').check();

    cy.contains('.filters a', 'Active').click();
    cy.hash().should('eq', '#/active');
    expectLabels(['Buy milk', 'Write test plan']);

    cy.contains('.filters a', 'Completed').click();
    cy.hash().should('eq', '#/completed');
    expectLabels(['Walk the dog', 'Submit homework']);

    cy.contains('.filters a', 'All').click();
    cy.hash().should('eq', '#/');
    expectLabels(ITEMS_4);
  });

  it('TC-010 Clear completed removes only completed items', () => {
    addTodos(ITEMS_4);
    cy.todoRowByText('Walk the dog').find('.toggle').check();
    cy.todoRowByText('Submit homework').find('.toggle').check();

    cy.get('.clear-completed').click();

    cy.get('.todo-list li').should('have.length', 2);
    expectLabels(['Buy milk', 'Write test plan']);
    expectCounter('2 items left');
    cy.get('.clear-completed').should('not.exist');
  });

  it('TC-011 Toggle-all marks every item as completed; toggling again clears them', () => {
    addTodos(ITEMS_4);

    cy.get('.toggle-all').check({ force: true });
    ITEMS_4.forEach((item) => {
      cy.todoRowByText(item).should('have.class', 'completed');
    });
    expectCounter('0 items left');
    cy.get('.clear-completed').should('be.visible');

    cy.get('.toggle-all').uncheck({ force: true });
    ITEMS_4.forEach((item) => {
      cy.todoRowByText(item).should('not.have.class', 'completed');
    });
    expectCounter('4 items left');
  });

  it('TC-012 Double-click enables inline editing and Enter saves changes', () => {
    cy.addTodo('Buy milk');

    cy.get('.todo-list li').first().as('row');
    cy.get('@row').find('label').dblclick();
    cy.get('@row').should('have.class', 'editing');

    cy.get('@row').find('.edit').should('be.focused').clear().type('Buy oat milk{enter}');

    cy.get('@row').should('not.have.class', 'editing');
    cy.get('@row').find('label').should('have.text', 'Buy oat milk');
    cy.get('.todo-list li').should('have.length', 1);
  });
});

/* ------------------------------------------------------------------ */
/* Negative flows                                                      */
/* ------------------------------------------------------------------ */
describe('Negative flows', () => {
  it('TC-N-001 Empty submission is rejected', () => {
    cy.get('.new-todo').focus().type('{enter}');

    cy.get('.todo-list li').should('have.length', 0);
    cy.get('.main').should('not.exist');
    cy.get('.footer').should('not.exist');
  });

  it('TC-N-002 Whitespace-only submission is rejected', () => {
    cy.get('.new-todo').type('   {enter}');

    cy.get('.todo-list li').should('have.length', 0);
    cy.get('.main').should('not.exist');
    cy.get('.footer').should('not.exist');
  });

  it('TC-N-003 Leading/trailing whitespace is trimmed on add', () => {
    cy.addTodo('   Buy milk   ');

    cy.get('.todo-list li').should('have.length', 1);
    cy.get('.todo-list li label').should('have.text', 'Buy milk');
  });

  it('TC-N-004 Editing to an empty value deletes the item', () => {
    cy.addTodo('Buy milk');
    cy.get('.todo-list li').first().as('row');

    cy.get('@row').find('label').dblclick();
    cy.get('@row').find('.edit').clear().type('{enter}');

    cy.get('.todo-list li').should('have.length', 0);
  });

  it('TC-N-005 Escape during edit cancels changes', () => {
    cy.addTodo('Buy milk');
    cy.get('.todo-list li').first().as('row');

    cy.get('@row').find('label').dblclick();
    cy.get('@row').find('.edit').clear().type('XYZ{esc}');

    cy.get('@row').should('not.have.class', 'editing');
    cy.get('@row').find('label').should('have.text', 'Buy milk');
  });

  it('TC-N-006 Destroy button is not visible without hover/focus', () => {
    cy.addTodo('Buy milk');
    cy.todoRowByText('Buy milk').find('.destroy').should('not.be.visible');
  });

  it('TC-N-007 Counter never goes negative or shows when list is empty', () => {
    cy.addTodo('Solo task');
    cy.todoRowByText('Solo task').find('.toggle').check();
    cy.get('.clear-completed').click();

    cy.get('.footer').should('not.exist');
    cy.get('.todo-count').should('not.exist');
  });

  it('TC-N-008 Clear completed is not rendered when no items are completed', () => {
    addTodos(ITEMS_4);
    cy.get('.clear-completed').should('not.exist');
  });
});

/* ------------------------------------------------------------------ */
/* Edge cases                                                          */
/* ------------------------------------------------------------------ */
describe('Edge cases', () => {
  it('TC-E-001 Special characters and emojis are accepted verbatim', () => {
    const items = [
      '<script>alert(1)</script>',
      `O'Brien & "Co."`,
      '任务一 / مهمة / задача',
      '🚀🔥✅ celebrate',
    ];

    cy.on('window:alert', () => {
      throw new Error('Unexpected alert – possible XSS execution');
    });

    items.forEach((text) => {
      cy.get('.new-todo').type(text, { parseSpecialCharSequences: false }).type('{enter}');
    });

    cy.get('.todo-list li').should('have.length', 4);
    expectLabels(items);
    expectCounter('4 items left');
    cy.get('.todo-list script').should('not.exist');
  });

  it('TC-E-002 Duplicate titles are allowed and treated as distinct items', () => {
    cy.addTodo('Buy milk');
    cy.addTodo('Buy milk');

    cy.get('.todo-list li').should('have.length', 2);

    cy.get('.todo-list li').eq(0).find('.toggle').check();
    cy.get('.todo-list li').eq(0).should('have.class', 'completed');
    cy.get('.todo-list li').eq(1).should('not.have.class', 'completed');
    expectCounter('1 item left');
  });

  it('TC-E-003 Long title (500 characters) is accepted and rendered', () => {
    const longText = 'a'.repeat(500);
    cy.get('.new-todo').invoke('val', longText).trigger('input').type('{enter}');

    cy.get('.todo-list li').should('have.length', 1);
    cy.get('.todo-list li label').should('have.text', longText);
  });

  it('TC-E-004 Singular/plural in counter', () => {
    cy.addTodo('One');
    expectCounter('1 item left');

    cy.addTodo('Two');
    expectCounter('2 items left');
  });

  it('TC-E-005 Filter selection persists during adds within the same session', () => {
    addTodos(['Active 1', 'Active 2']);
    cy.addTodo('Completed 1');
    cy.todoRowByText('Completed 1').find('.toggle').check();

    cy.contains('.filters a', 'Active').click();
    cy.hash().should('eq', '#/active');

    cy.addTodo('New task');

    cy.hash().should('eq', '#/active');
    cy.contains('.filters a', 'Active').should('have.class', 'selected');
    expectLabels(['Active 1', 'Active 2', 'New task']);
  });

  it('TC-E-006 Reload preserves selected filter via URL hash', () => {
    cy.addTodo('Task A');
    cy.todoRowByText('Task A').find('.toggle').check();

    cy.contains('.filters a', 'Completed').click();
    cy.hash().should('eq', '#/completed');

    cy.reload();

    cy.hash().should('eq', '#/completed');
    cy.contains('.filters a', 'Completed').should('have.class', 'selected');
    expectLabels(['Task A']);
  });

  it('TC-E-007 Toggle-all chevron reflects mixed state correctly', () => {
    addTodos(ITEMS_4);
    cy.todoRowByText('Buy milk').find('.toggle').check();
    cy.todoRowByText('Walk the dog').find('.toggle').check();

    cy.get('.toggle-all').should('not.be.checked');

    cy.get('.toggle-all').check({ force: true });
    ITEMS_4.forEach((item) => {
      cy.todoRowByText(item).should('have.class', 'completed');
    });
    cy.get('.toggle-all').should('be.checked');

    cy.get('.toggle-all').uncheck({ force: true });
    ITEMS_4.forEach((item) => {
      cy.todoRowByText(item).should('not.have.class', 'completed');
    });
    cy.get('.toggle-all').should('not.be.checked');
  });

  it('TC-E-008 Editing trims whitespace; pure-whitespace edit deletes item', () => {
    cy.addTodo('Buy milk');
    cy.get('.todo-list li').first().as('row');

    cy.get('@row').find('label').dblclick();
    cy.get('@row').find('.edit').clear().type('   Buy bread   {enter}');
    cy.get('.todo-list li label').should('have.text', 'Buy bread');

    cy.get('.todo-list li').first().as('renamed');
    cy.get('@renamed').find('label').dblclick();
    cy.get('@renamed').find('.edit').clear().type('   {enter}');

    cy.get('.todo-list li').should('have.length', 0);
  });

  it('TC-E-009 Blur commits edit (same semantics as Enter)', () => {
    cy.addTodo('Buy milk');
    cy.get('.todo-list li').first().as('row');

    cy.get('@row').find('label').dblclick();
    cy.get('@row').find('.edit').clear().type('Buy oat milk');
    cy.get('h1').click();

    cy.get('@row').should('not.have.class', 'editing');
    cy.get('@row').find('label').should('have.text', 'Buy oat milk');
    cy.get('.todo-list li').should('have.length', 1);
  });
});
