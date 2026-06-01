import path from 'path';
import { DEFAULT_DIDAXIS_URL } from './didaxis-url.js';

/** Persisted browser session written by `tests/auth.setup.ts`. */
export const AUTH_STORAGE_PATH = path.join(
  __dirname,
  '..',
  'playwright',
  '.auth',
  'user.json',
);

export const DIDAXIS_URL = process.env.DIDAXIS_URL || DEFAULT_DIDAXIS_URL;

export const DIDAXIS_LOGIN_URL = `${DIDAXIS_URL}/login`;
