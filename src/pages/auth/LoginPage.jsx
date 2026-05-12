// Login Page
//
// Public page where users sign in. On success the user is redirected
// either to the page they were trying to reach before being sent here,
// or to the dashboard ("/") if they came in directly.

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useLocation } from 'react-router-dom'

import { useAppDispatch } from '../../store'
import { login, clearError } from '../../store/slices/authSlice'
import { useAuth } from '../../hooks/useAuth'

import Input from '../../components/common/Input'
import Button from '../../components/common/Button'

export default function LoginPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, isLoading, error } = useAuth()

  // If the user landed here from a protected route, that route is
  // stored in location.state.from. Otherwise default to the dashboard.
  const redirectTo = location.state?.from?.pathname ?? '/'

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm()

  // -----------------------------------------------------------------
  // useEffect: once the user is authenticated, redirect them away.
  // Also clear any leftover error message when leaving the page.
  // -----------------------------------------------------------------
  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectTo, { replace: true })
    }
    return () => {
      dispatch(clearError())
    }
  }, [isAuthenticated, navigate, redirectTo, dispatch])

  // -----------------------------------------------------------------
  // Handler: submit the login form. The login thunk handles success
  // (token storage) and failure (error state) for us.
  // -----------------------------------------------------------------
  const handleLogin = (formData) => {
    dispatch(login(formData))
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel — decorative */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 flex-col justify-between p-12 overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 rounded-full bg-white blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-purple-400 blur-3xl translate-x-1/2 translate-y-1/2" />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 rounded-full bg-indigo-400 blur-3xl -translate-x-1/2 -translate-y-1/2" />
        </div>

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `radial-gradient(circle, white 1px, transparent 1px)`,
            backgroundSize: '32px 32px',
          }}
        />

        {/* Brand */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <span className="text-white font-bold text-sm">TS</span>
            </div>
            <span className="text-white font-bold text-xl">TalentSphere</span>
          </div>
        </div>

        {/* Center content */}
        <div className="relative z-10">
          <h2 className="text-3xl font-bold text-white leading-tight mb-4">
            Everything you need<br />to manage your team
          </h2>
          <p className="text-indigo-200 text-base leading-relaxed max-w-sm">
            Streamline hiring, onboarding, performance reviews, and more — all in one unified platform.
          </p>

          {/* Feature chips */}
          <div className="flex flex-wrap gap-2 mt-8">
            {['Recruitment', 'Performance', 'Training', 'Analytics', 'Compliance'].map((f) => (
              <span key={f} className="px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-white text-xs font-medium border border-white/20">
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom tagline */}
        <div className="relative z-10">
          <p className="text-indigo-300 text-sm">
            Trusted by HR teams worldwide
          </p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-slate-50 dark:bg-[#0a0f1e]">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">TS</span>
            </div>
            <span className="text-slate-900 dark:text-white font-bold text-lg">TalentSphere</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-2">Welcome back</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Sign in to your account to continue</p>
          </div>

          {/* Error alert */}
          {error && (
            <div className="mb-5 flex items-center gap-3 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 px-4 py-3.5">
              <div className="h-2 w-2 rounded-full bg-rose-500 flex-shrink-0" />
              <p className="text-sm text-rose-700 dark:text-rose-400">{error}</p>
            </div>
          )}

          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-slate-100 dark:border-gray-800 shadow-card p-6 sm:p-8">
            <form onSubmit={handleSubmit(handleLogin)} className="space-y-5">
              <Input
                label="Email Address"
                type="email"
                placeholder="you@company.com"
                autoComplete="email"
                required
                error={errors.email?.message}
                {...register('email', {
                  required: 'Email is required',
                  pattern: { value: /^\S+@\S+$/i, message: 'Invalid email address' },
                })}
              />

              <div>
                <Input
                  label="Password"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  error={errors.password?.message}
                  {...register('password', { required: 'Password is required' })}
                />
              </div>

              <Button
                type="submit"
                loading={isLoading}
                className="w-full py-2.5"
              >
                Sign In
              </Button>
            </form>
          </div>

          <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
              Register as Candidate
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
