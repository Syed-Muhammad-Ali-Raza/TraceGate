import { z } from 'zod';

export const registerSchema = z
  .object({
    email: z.string().email().max(255),
    password: z.string().min(10).max(128),
    name: z.string().min(1).max(120).optional(),
  })
  .strict();

export const loginSchema = z
  .object({
    email: z.string().email().max(255),
    password: z.string().min(1).max(128),
  })
  .strict();

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
