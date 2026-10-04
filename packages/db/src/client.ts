import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as schema from './schema/index';

export type Database = ReturnType<typeof createDb>;

/**
 * Creates a typed Drizzle client. Callers own the connection lifecycle.
 */
export function createDb(connectionString: string) {
  const client = postgres(connectionString, {
    max: 10,
    prepare: false,
  });
  const db = drizzle(client, { schema });
  return { db, client };
}
