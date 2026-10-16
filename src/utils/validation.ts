// src/utils/validation.ts
import { z } from 'zod';

// Zod schema for login form
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

// TypeScript type inferred from schema
export type LoginFormInputs = z.infer<typeof loginSchema>;


// 📝 Register
export const registerSchema = z
  .object({
    firstName: z.string().min(2, 'First name required'),
    lastName: z.string().min(2, 'Last name required'),
    email: z.string().email('Invalid email'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(8),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type RegisterFormInputs = z.infer<typeof registerSchema>;