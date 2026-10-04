import { createDb } from '@llm-gateway/db';

import { env } from '../config/env.js';

const { db, client } = createDb(env.DATABASE_URL);

export { db, client };
