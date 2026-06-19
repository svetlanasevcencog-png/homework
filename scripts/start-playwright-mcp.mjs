#!/usr/bin/env node
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const authPath = path.join(root, 'playwright', '.auth', 'user.json');
const configPath = path.join(root, 'playwright-mcp.config.json');
const port = process.env.PLAYWRIGHT_MCP_PORT || '8931';

if (!existsSync(authPath)) {
  console.warn(
    `Warning: ${authPath} not found. Run "npx playwright test --project=setup" first so MCP can browse Didaxis authenticated.`,
  );
}

console.log(`Starting Playwright MCP on http://localhost:${port}/mcp`);
console.log('Keep this terminal open while using Playwright MCP in Cursor.');
console.log('Restart Cursor after changing .cursor/mcp.json if tools do not appear.\n');

const child = spawn(
  'npx',
  ['-y', '@playwright/mcp@latest', '--config', configPath, '--port', port],
  { cwd: root, stdio: 'inherit', shell: process.platform === 'win32' },
);

child.on('exit', (code) => process.exit(code ?? 1));

process.on('SIGINT', () => child.kill('SIGINT'));
process.on('SIGTERM', () => child.kill('SIGTERM'));
