import { z } from 'zod';

// E.164: + followed by 7–15 digits
const e164 = /^\+\d{7,15}$/;

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const signupSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z
    .string()
    .min(1, 'Phone number is required')
    .regex(e164, 'Enter a valid phone number with country code'),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
