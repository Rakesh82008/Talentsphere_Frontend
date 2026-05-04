import { useNavigate } from 'react-router-dom'
import Button from '../components/common/Button'
import { HomeIcon } from '@heroicons/react/24/outline'

export default function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0f1e] flex flex-col items-center justify-center p-6">
      <div className="text-center max-w-md">
        {/* Large number */}
        <div className="relative mb-8">
          <p className="text-[160px] font-black text-slate-100 dark:text-gray-800/80 select-none leading-none">404</p>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-2xl">!</span>
            </div>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Page Not Found</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-8">
          The page you're looking for doesn't exist or has been moved.
          Let's get you back on track.
        </p>
        <Button leftIcon={<HomeIcon className="h-4 w-4" />} onClick={() => navigate('/')}>
          Return Home
        </Button>
      </div>
    </div>
  )
}
