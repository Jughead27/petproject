'use client'

import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function DexPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleLogout = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push('/login')
    } catch (err) {
      console.error('Logout error:', { timestamp: new Date().toISOString() })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">The Dex</h1>
        <p className="text-xl text-gray-600 mb-8">Coming soon...</p>
        <p className="text-gray-600 mb-8">
          Browse by species and breed. Track which ones you've spotted.
        </p>

        <div className="space-x-4">
          <Link
            href="/stack"
            className="inline-block bg-amber-600 hover:bg-amber-700 text-white font-medium px-4 py-2 rounded-md"
          >
            Back to Stack
          </Link>

          <button
            onClick={handleLogout}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-2 rounded-md disabled:opacity-50"
          >
            {loading ? 'Logging out...' : 'Log out'}
          </button>
        </div>
      </div>
    </div>
  )
}
