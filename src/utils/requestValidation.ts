import { z } from 'zod';

export const submitRequestSchema = z.object({
  carBrand: z.string().min(1, 'Car brand is required'),
  carModel: z.string().min(1, 'Car model is required'),
  carYear: z
    .string()
    .regex(/^\d{4}$/, 'Enter valid year (YYYY)'),
  vin: z.string().optional(),
  numberPlate: z.string().min(2, 'Number plate is required'),
  transmission: z.enum(['Automatic', 'Manual']),
  preferredContactMethod: z.enum(['Email', 'Phone', 'SMS']),
  description: z.string().min(20, 'Description must be at least 20 characters'),
});

export type SubmitRequestInputs = z.infer<typeof submitRequestSchema>;
