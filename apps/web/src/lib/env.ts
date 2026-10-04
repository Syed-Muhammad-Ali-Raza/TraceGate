import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_API_URL: z
    .string()
    .optional()
    .transform((value) => (value && value.length > 0 ? value : 'http://localhost:4010'))
    .pipe(z.string().url()),
});

export type WebEnv = z.infer<typeof envSchema>;

/**
 * Validates public web env at module load so misconfig fails early in boots.
 */
function loadEnv(): WebEnv {
  const parsed = envSchema.safeParse({
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  });
  if (!parsed.success) {
    throw new Error(`Invalid web environment: ${JSON.stringify(parsed.error.flatten())}`);
  }
  return parsed.data;
}

export const env = loadEnv();
