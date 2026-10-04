import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const rootEnv = resolve(process.cwd(), '../../.env');
if (existsSync(rootEnv)) {
  config({ path: rootEnv });
} else {
  config();
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is required for drizzle-kit');
}

export default defineConfig({
  schema: './src/schema/index.ts',
  out: './migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: databaseUrl,
  },
  strict: true,
  verbose: true,
});
