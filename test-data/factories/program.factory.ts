import { faker } from '@faker-js/faker';

export type ProgramInput = {
  name: string;
  description: string;
};

/**
 * Happy-path program payload for create/edit flows.
 * Always unique enough for parallel workers; pair with `trackProgram` teardown.
 */
export function buildProgram(
  overrides: Partial<ProgramInput> = {},
): ProgramInput {
  return {
    name: `${faker.company.buzzNoun()} ${faker.number.int({ min: 2026, max: 2030 })} ${faker.string.alphanumeric(6)}`,
    description: faker.lorem.sentence(),
    ...overrides,
  };
}
