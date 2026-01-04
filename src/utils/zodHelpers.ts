import { z } from 'zod'
import { userFormSchema } from '@/schemas/userForm'

// Utility for creating runtime type guards
export const createTypeGuard = <T extends z.ZodType>(schema: T) => {
  return (data: unknown): data is z.infer<T> => {
    return schema.safeParse(data).success
  }
}

// Example type guard for user form
export const isUserFormData = createTypeGuard(userFormSchema)
