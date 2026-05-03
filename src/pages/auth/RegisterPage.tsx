import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { authApi } from '../../api/auth'
import Input from '../../components/common/Input'
import Button from '../../components/common/Button'
import type { RegisterDTO } from '../../types'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterDTO & { confirmPassword: string }>()

  const onSubmit = async (data: RegisterDTO & { confirmPassword: string }) => {
    setLoading(true)
    try {
      await authApi.register({ name: data.name, email: data.email, password: data.password, phone: data.phone })
      toast.success('Account created! Please sign in.')
      navigate('/login')
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } }
      const data = error.response?.data
      if (data?.errors) {
        const first = Object.values(data.errors).flat()[0]
        toast.error(first ?? 'Registration failed')
      } else {
        toast.error(data?.message ?? 'Registration failed')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 shadow-lg mb-4">
            <span className="text-2xl font-bold text-white">TS</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Create Account</h1>
          <p className="text-gray-400 mt-1">Register as a candidate</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Full Name"
              placeholder="John Smith"
              required
              error={errors.name?.message}
              {...register('name', { required: 'Name is required' })}
            />

            <Input
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              required
              error={errors.email?.message}
              {...register('email', {
                required: 'Email is required',
                pattern: { value: /^\S+@\S+$/i, message: 'Invalid email' },
              })}
            />

            <Input
              label="Phone"
              type="tel"
              placeholder="+1 555 000 0000"
              error={errors.phone?.message}
              {...register('phone')}
            />

            <Input
              label="Password"
              type="password"
              placeholder="Min 8 chars, 1 uppercase, 1 number"
              required
              error={errors.password?.message}
              {...register('password', {
                required: 'Password is required',
                minLength: { value: 8, message: 'Password must be at least 8 characters' },
                validate: {
                  hasUppercase: (v) => /[A-Z]/.test(v) || 'Password must contain at least one uppercase letter',
                  hasNumber: (v) => /[0-9]/.test(v) || 'Password must contain at least one number',
                },
              })}
            />

            <Input
              label="Confirm Password"
              type="password"
              placeholder="Repeat your password"
              required
              error={errors.confirmPassword?.message}
              {...register('confirmPassword', {
                required: 'Please confirm your password',
                validate: (v) => v === watch('password') || 'Passwords do not match',
              })}
            />

            <Button type="submit" loading={loading} className="w-full mt-2">
              Create Account
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 hover:underline font-medium">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
