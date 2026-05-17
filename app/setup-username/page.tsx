'use client'

import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function SetupUsernamePage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const checkExisting = async () => {
      try {
        const supabase = createClient()
        const { data: userData } = await supabase.auth.getUser()

        if (!userData.user) {
          router.push('/login')
          return
        }

        // Check if user already has a username
        const { data: existingUser } = await supabase
          .from('users')
          .select('username')
          .eq('id', userData.user.id)
          .single()

        if (existingUser?.username) {
          // User already has username, redirect to onboarding
          router.push('/onboarding')
          return
        }

        setChecking(false)
      } catch (err) {
        console.error('Setup check error:', { timestamp: new Date().toISOString() })
        setChecking(false)
      }
    }

    checkExisting()
  }, [router])

  const handleSetUsername = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (!username.trim()) {
      setError('Please enter a username')
      return
    }

    const cleanUsername = username.trim().toLowerCase()

    // Username format: lowercase letters, numbers, underscores, 3-20 chars
    const usernameRegex = /^[a-z0-9_]{3,20}$/
    if (!usernameRegex.test(cleanUsername)) {
      setError(
        'Username must be 3-20 characters (letters, numbers, underscores only)'
      )
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()
      const { data: authUser } = await supabase.auth.getUser()

      if (!authUser.user) {
        setError('Not authenticated')
        return
      }

      // Try to insert username into users table
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: authUser.user.id,
          username: cleanUsername,
        })

      if (insertError) {
        if (insertError.message.includes('duplicate') || insertError.code === '23505') {
          setError('This username is already taken')
        } else {
          setError('Could not set username. Please try again.')
        }
        return
      }

      // Success, redirect to onboarding
      router.push('/onboarding')
    } catch (err) {
      console.error('Username setup error:', { timestamp: new Date().toISOString() })
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-lg shadow-sm border border-amber-100 p-8">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-sm border border-amber-100 p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Choose your username</h1>
        <p className="text-sm text-gray-600 mb-6">
          This is how other pet owners will find you on PetProject.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSetUsername} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500 text-sm">@</span>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50"
                placeholder="yourname"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              3-20 characters, letters/numbers/underscores
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Setting username...' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  )
}
