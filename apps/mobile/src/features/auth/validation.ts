import { z } from 'zod';

import { supportedCurrencies } from '@/src/constants/currencies';

const passwordSchema = z
  .string()
  .min(8, 'validation.password')
  .regex(/[A-Z]/, 'validation.password')
  .regex(/[0-9]/, 'validation.password');

export const loginSchema = z.object({
  email: z.string().email('validation.email'),
  password: z.string().min(1, 'validation.required'),
});

export const registerSchema = z.object({
  firstName: z.string().min(1, 'validation.required'),
  lastName: z.string().min(1, 'validation.required'),
  businessName: z.string().min(1, 'validation.required').max(200, 'validation.maxBusinessName'),
  email: z.string().email('validation.email'),
  password: passwordSchema,
  currency: z.enum(supportedCurrencies),
  taxPercent: z.number().min(0, 'validation.taxPercent').max(100, 'validation.taxPercent'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('validation.email'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
