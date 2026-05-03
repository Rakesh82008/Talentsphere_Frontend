import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAppDispatch } from '../../store'
import { login, clearError } from '../../store/slices/authSlice'
import { useAuth } from '../../hooks/useAuth'
import Input from '../../components/common/Input'
import Button from '../../components/common/Button'
import type { LoginDTO } from '../../types'

export default function LoginPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, isLoading, error } = useAuth()

  const from = (location.state as { from?: { pathname?: string } })?.from?.pathname ?? '/'

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginDTO>()

  useEffect(() => {
    if (isAuthenticated) navigate(from, { replace: true })
    return () => { dispatch(clearError()) }
  }, [isAuthenticated, navigate, from, dispatch])

  const onSubmit = (data: LoginDTO) => {
    dispatch(login(data))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 shadow-lg mb-4">
            <span className="text-2xl font-bold text-white">TS</span>
          </div>
          <h1 className="text-3xl font-bold text-white">TalentSphere</h1>
          <p className="text-gray-400 mt-1">Sign in to your account</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              label="Email Address"
              type="email"
              placeholder="you@company.com"
              autoComplete="email"
              required
              error={errors.email?.message}
              {...register('email', {
                required: 'Email is required',
                pattern: { value: /^\S+@\S+$/i, message: 'Invalid email' },
              })}
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              required
              error={errors.password?.message}
              {...register('password', { required: 'Password is required' })}
            />

            <Button
              type="submit"
              loading={isLoading}
              className="w-full"
            >
              Sign In
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-600 hover:underline font-medium">
              Register as Candidate
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
