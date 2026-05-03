import { useNavigate } from 'react-router-dom'
import Button from '../components/common/Button'

export default function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="text-center max-w-md">
        <p className="text-9xl font-black text-gray-200 select-none">404</p>
        <h1 className="text-2xl font-bold text-gray-900 mt-2 mb-2">Page Not Found</h1>
        <p className="text-gray-500 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Button onClick={() => navigate('/')}>Return Home</Button>
      </div>
    </div>
  )
}
