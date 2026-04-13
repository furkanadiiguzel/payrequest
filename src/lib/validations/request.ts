import { z } from 'zod';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const E164_RE  = /^\+\d{7,15}$/;

export const createRequestSchema = z.object({
  recipient: z
    .string()
    .min(1, 'Recipient is required')
    .refine(
      (v) => EMAIL_RE.test(v) || E164_RE.test(v),
      { message: 'Enter a valid email address or phone number' }
    ),
  amount: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, 'Amount can have at most 2 decimal places')
    .refine((v) => parseFloat(v) >= 0.01, {
      message: 'Amount must be greater than $0.00',
    })
    .refine((v) => parseFloat(v) <= 10000, {
      message: 'Amount cannot exceed $10,000.00',
    }),
  note: z.string().max(280, 'Note cannot exceed 280 characters').optional(),
});

export type CreateRequestInput = z.input<typeof createRequestSchema>;
