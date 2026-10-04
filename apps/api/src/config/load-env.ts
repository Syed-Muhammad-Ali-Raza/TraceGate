import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { config } from 'dotenv';

/**
 * Side-effect module: load monorepo `.env` before any Zod-validated env module runs.
 * Must be imported first from the process entrypoint.
 */
const startDir = dirname(fileURLToPath(import.meta.url));
let dir = startDir;

for (let i = 0; i < 8; i += 1) {
  const workspaceMarker = resolve(dir, 'pnpm-workspace.yaml');
  const envPath = resolve(dir, '.env');
  if (existsSync(workspaceMarker) && existsSync(envPath)) {
    config({ path: envPath });
    break;
  }
  const parent = resolve(dir, '..');
  if (parent === dir) {
    config();
    break;
  }
  dir = parent;
}
