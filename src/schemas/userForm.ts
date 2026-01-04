import { z } from 'zod'

export const userFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  age: z.number().min(18, 'Must be at least 18 years old').max(120, 'Must be less than 120 years old'),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
})

export type UserFormData = z.infer<typeof userFormSchema>
