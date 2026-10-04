import { config } from 'dotenv';
import { createHash, randomBytes } from 'node:crypto';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

import { hash } from 'argon2';
import { eq } from 'drizzle-orm';

import { apiKeys, createDb, orgMembers, organizations, projects, users } from '../src/index';

const rootEnv = resolve(process.cwd(), '../../.env');
if (existsSync(rootEnv)) {
  config({ path: rootEnv });
} else {
  config();
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

/**
 * Seeds a demo user, org, project, and API key for local development.
 */
async function seed(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required');
  }

  const { db, client } = createDb(databaseUrl);

  try {
    const email = 'demo@llmgateway.local';
    const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existing[0]) {
      console.log(`Seed skipped — user ${email} already exists`);
      return;
    }

    const passwordHash = await hash('DemoPass123!', { type: 2 });
    const [user] = await db
      .insert(users)
      .values({ email, passwordHash, role: 'admin' })
      .returning();

    if (!user) {
      throw new Error('Failed to insert demo user');
    }

    const [org] = await db
      .insert(organizations)
      .values({ name: 'Demo Org', plan: 'pro' })
      .returning();

    if (!org) {
      throw new Error('Failed to insert demo org');
    }

    await db.insert(orgMembers).values({
      orgId: org.id,
      userId: user.id,
      role: 'owner',
    });

    const [project] = await db
      .insert(projects)
      .values({ orgId: org.id, name: 'Default Project' })
      .returning();

    if (!project) {
      throw new Error('Failed to insert demo project');
    }

    const rawKey = `lgw_live_${randomBytes(32).toString('hex')}`;
    const keyPrefix = rawKey.slice(0, 16);

    await db.insert(apiKeys).values({
      projectId: project.id,
      name: 'Demo key',
      keyHash: sha256(rawKey),
      keyPrefix,
      scopes: ['proxy:invoke'],
      rateLimit: 120,
    });

    console.log('Seed complete');
    console.log(`  email:    ${email}`);
    console.log('  password: DemoPass123!');
    console.log(`  api key:  ${rawKey}`);
    console.log('  (API key shown once — store it now)');
  } finally {
    await client.end({ timeout: 5 });
  }
}

seed().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
