import { useNavigate } from 'react-router-dom'
import { ShieldExclamationIcon } from '@heroicons/react/24/outline'
import Button from '../components/common/Button'

export default function UnauthorizedPage() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-100 mb-6">
          <ShieldExclamationIcon className="h-10 w-10 text-red-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Access Denied</h1>
        <p className="text-gray-500 mb-8">
          You don't have permission to access this page. Contact your administrator if you believe
          this is a mistake.
        </p>
        <div className="flex gap-3 justify-center">
          <Button variant="secondary" onClick={() => navigate(-1)}>
            Go Back
          </Button>
          <Button onClick={() => navigate('/')}>Go to Dashboard</Button>
        </div>
      </div>
    </div>
  )
}
