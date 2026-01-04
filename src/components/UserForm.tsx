import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { userFormSchema, type UserFormData } from '@/schemas/userForm'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAppStore } from '@/stores/useAppStore'

export function UserForm() {
  const setUser = useAppStore((state) => state.setUser)
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
  })

  const onSubmit = (data: UserFormData) => {
    console.log('Form submitted:', data)
    setUser(data)
    reset()
  }

  return (
    <div className="max-w-md space-y-6">
      <h2 className="text-2xl font-semibold">User Information</h2>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1">
            Name
          </label>
          <Input
            id="name"
            {...register('name')}
            placeholder="Enter your name"
          />
          {errors.name && (
            <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            Email
          </label>
          <Input
            id="email"
            type="email"
            {...register('email')}
            placeholder="Enter your email"
          />
          {errors.email && (
            <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="age" className="block text-sm font-medium mb-1">
            Age
          </label>
          <Input
            id="age"
            type="number"
            {...register('age', { valueAsNumber: true })}
            placeholder="Enter your age"
          />
          {errors.age && (
            <p className="text-sm text-destructive mt-1">{errors.age.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="bio" className="block text-sm font-medium mb-1">
            Bio (optional)
          </label>
          <Input
            id="bio"
            {...register('bio')}
            placeholder="Tell us about yourself"
          />
          {errors.bio && (
            <p className="text-sm text-destructive mt-1">{errors.bio.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full">
          Submit
        </Button>
      </form>
    </div>
  )
}
