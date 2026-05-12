// Register Page
//
// Public sign-up form for candidates. After a successful POST to the
// register endpoint, the user is redirected to /login to sign in.
// Server-side validation errors (under err.response.data.errors) are
// surfaced to the user via toast.

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

import { authApi } from '../../api/auth'
import Input from '../../components/common/Input'
import Button from '../../components/common/Button'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm()

  // -----------------------------------------------------------------
  // Handler: submit the registration form.
  //
  // The API can respond with either:
  //   { message: '...' }                — simple error
  //   { errors: { field: ['msg'] } }    — ASP.NET model validation
  // We display the first message we find from either shape.
  // -----------------------------------------------------------------
  const handleRegister = async (formData) => {
    setIsSubmitting(true)
    try {
      await authApi.register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
      })
      toast.success('Account created! Please sign in.')
      navigate('/login')
    } catch (error) {
      const errorData = error?.response?.data

      if (errorData?.errors) {
        // ASP.NET ModelState validation shape — pick the first message.
        const firstMessage = Object.values(errorData.errors).flat()[0]
        toast.error(firstMessage ?? 'Registration failed')
      } else {
        toast.error(errorData?.message ?? 'Registration failed')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-slate-50 dark:bg-[#0a0f1e]">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-sm">TS</span>
          </div>
          <span className="text-slate-900 dark:text-white font-bold text-lg">
            TalentSphere
          </span>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-slate-100 dark:border-gray-800 shadow-card p-6 sm:p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
              Create your account
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Register as a candidate to start your application journey
            </p>
          </div>

          <form onSubmit={handleSubmit(handleRegister)} className="space-y-4">
            <Input
              label="Full Name"
              placeholder="John Smith"
              required
              error={errors.name?.message}
              {...register('name', { required: 'Name is required' })}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            </div>

            <Input
              label="Password"
              type="password"
              placeholder="Min 8 chars, 1 uppercase, 1 number"
              required
              error={errors.password?.message}
              hint="Must be at least 8 characters with one uppercase letter and one number"
              {...register('password', {
                required: 'Password is required',
                minLength: {
                  value: 8,
                  message: 'Password must be at least 8 characters',
                },
                validate: {
                  hasUppercase: (value) =>
                    /[A-Z]/.test(value) ||
                    'Password must contain at least one uppercase letter',
                  hasNumber: (value) =>
                    /[0-9]/.test(value) ||
                    'Password must contain at least one number',
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
                validate: (value) =>
                  value === watch('password') || 'Passwords do not match',
              })}
            />

            <Button
              type="submit"
              loading={isSubmitting}
              className="w-full py-2.5 mt-2"
            >
              Create Account
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-5">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
          >
            Sign In
          </Link>
        </p>
      </div>
    </div>
  )
}
