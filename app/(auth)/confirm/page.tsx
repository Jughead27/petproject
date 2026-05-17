'use client'

import { createClient } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'

function ConfirmContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState('')

  useEffect(() => {
    const confirmEmail = async () => {
      const code = searchParams.get('code')

      if (!code) {
        setError('No confirmation code provided')
        setTimeout(() => router.push('/login'), 3000)
        return
      }

      try {
        const supabase = createClient()
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

        if (exchangeError) {
          setError(exchangeError.message || 'Confirmation failed')
          setTimeout(() => router.push('/login'), 3000)
          return
        }

        // Check if user has username
        const { data: userData } = await supabase.auth.getUser()
        if (!userData.user) {
          router.push('/login')
          return
        }

        const { data: userProfile } = await supabase
          .from('users')
          .select('username')
          .eq('id', userData.user.id)
          .single()

        if (!userProfile?.username) {
          router.push('/setup-username')
        } else {
          router.push('/stack')
        }
      } catch (err) {
        console.error('Confirmation error:', err)
        setError('An error occurred. Redirecting to login...')
        setTimeout(() => router.push('/login'), 3000)
      }
    }

    confirmEmail()
  }, [searchParams, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-sm border border-amber-100 p-8 text-center">
        {error ? (
          <>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h1>
            <p className="text-gray-600 mb-4">{error}</p>
            <p className="text-sm text-gray-500">Redirecting to login...</p>
          </>
        ) : (
          <>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Confirming your email...</h1>
            <p className="text-gray-600">Please wait while we set up your account.</p>
          </>
        )}
      </div>
    </div>
  )
}

export default function ConfirmPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-lg shadow-sm border border-amber-100 p-8 text-center">
            <h1 className="text-xl font-bold text-gray-900 mb-2">Confirming your email...</h1>
            <p className="text-gray-600">Please wait while we set up your account.</p>
          </div>
        </div>
      }
    >
      <ConfirmContent />
    </Suspense>
  )
}
