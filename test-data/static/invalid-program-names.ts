/** Curated invalid Program Name inputs for negative / validation cases. */
export const INVALID_PROGRAM_NAMES = {
  empty: '',
  whitespaceOnly: '   ',
  tooLong: 'A'.repeat(256),
} as const;
