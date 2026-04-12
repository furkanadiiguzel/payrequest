import { z } from 'zod';

export const createRequestSchema = z.object({
  recipient: z.string().min(1, 'Recipient is required'),
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

// Input type for the form (before transform)
export type CreateRequestInput = z.input<typeof createRequestSchema>;
