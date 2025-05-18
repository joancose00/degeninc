import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function Navigation() {
  const pathname = usePathname()
  
  return (
    <nav className="mb-8">
      <div className="flex gap-4">
        <Link 
          href="/" 
          className={`px-4 py-2 rounded-lg transition-colors ${
            pathname === '/' 
              ? 'bg-purple-600 text-white' 
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          Subscription
        </Link>
        <Link 
          href="/admin" 
          className={`px-4 py-2 rounded-lg transition-colors ${
            pathname === '/admin' 
              ? 'bg-purple-600 text-white' 
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          Admin Dashboard
        </Link>
      </div>
    </nav>
  )
}