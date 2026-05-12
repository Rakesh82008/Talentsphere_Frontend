// Unauthorized Page (403)
//
// Shown when ProtectedRoute determines that the logged-in user does
// not have the role needed for the requested page. Pure presentation.

import { useNavigate } from 'react-router-dom'
import {
  ShieldExclamationIcon,
  ArrowLeftIcon,
  HomeIcon,
} from '@heroicons/react/24/outline'

import Button from '../components/common/Button'

export default function UnauthorizedPage() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0f1e] flex flex-col items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-rose-100 dark:bg-rose-900/30 mb-6 shadow-sm">
          <ShieldExclamationIcon className="h-10 w-10 text-rose-600 dark:text-rose-400" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Access Denied</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-8">
          You don't have permission to access this page. Contact your administrator if you believe
          this is a mistake.
        </p>
        <div className="flex gap-3 justify-center">
          <Button variant="secondary" leftIcon={<ArrowLeftIcon className="h-4 w-4" />} onClick={() => navigate(-1)}>
            Go Back
          </Button>
          <Button leftIcon={<HomeIcon className="h-4 w-4" />} onClick={() => navigate('/')}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}
