'use client'

import { createClient } from '@/lib/supabase'
import { PackCreator } from '@/app/components/PackCreator'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface Pack {
  id: string
  name: string
  description: string | null
  owner_id: string
  is_private: boolean
  created_at: string
  members?: { count: number }[]
}

export default function MyPacksPage() {
  const router = useRouter()
  const [packs, setPacks] = useState<Pack[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [user, setUser] = useState<{ id: string } | null>(null)

  useEffect(() => {
    const loadPacks = async () => {
      try {
        const supabase = createClient()

        const { data: userData } = await supabase.auth.getUser()

        if (!userData.user) {
          router.push('/login')
          return
        }

        setUser(userData.user as { id: string })

        // Fetch user's owned packs
        const { data: packsData, error: packsError } = await supabase
          .from('packs')
          .select(
            `
            id,
            name,
            description,
            owner_id,
            is_private,
            created_at,
            members:pack_members(count)
          `
          )
          .eq('owner_id', userData.user.id)
          .order('created_at', { ascending: false })

        if (packsError) {
          console.error('Packs fetch error:', packsError)
          setError('Failed to load packs')
        } else {
          setPacks(packsData || [])
        }

        setLoading(false)
      } catch (err) {
        console.error('Load packs error:', err)
        setError('Failed to load packs')
        setLoading(false)
      }
    }

    loadPacks()
  }, [router])

  const handlePackCreated = async () => {
    // Reload packs after creation
    try {
      const supabase = createClient()
      const { data: userData } = await supabase.auth.getUser()

      if (userData.user) {
        const { data: packsData } = await supabase
          .from('packs')
          .select(
            `
            id,
            name,
            description,
            owner_id,
            is_private,
            created_at,
            members:pack_members(count)
          `
          )
          .eq('owner_id', userData.user.id)
          .order('created_at', { ascending: false })

        setPacks(packsData || [])
      }
    } catch (err) {
      console.error('Reload packs error:', err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <Link href="/profile" className="text-amber-600 hover:text-amber-700 font-medium mb-6 inline-block">
          ← Back to Profile
        </Link>

        <h1 className="text-4xl font-bold text-gray-900 mb-8">My Packs</h1>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Create Pack Form */}
        <div className="mb-12">
          <PackCreator onPackCreated={handlePackCreated} />
        </div>

        {/* Packs List */}
        {packs.length > 0 ? (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Packs ({packs.length})</h2>
            <div className="space-y-4">
              {packs.map((pack) => {
                const memberCount = pack.members?.[0]?.count || 0

                return (
                  <Link key={pack.id} href={`/packs/${pack.id}`}>
                    <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-2xl font-bold text-gray-900 mb-1">{pack.name}</h3>
                          {pack.description && (
                            <p className="text-gray-600 mb-3">{pack.description}</p>
                          )}
                          <div className="flex items-center gap-6 text-sm text-gray-600">
                            <div>
                              <span className="font-medium">Members</span>
                              <p className="text-gray-900 font-bold">{memberCount}</p>
                            </div>
                            <div>
                              <span className="font-medium">Created</span>
                              <p className="text-gray-900">
                                {new Date(pack.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                        {pack.is_private && (
                          <span className="ml-4 text-xs font-medium text-gray-600 bg-gray-100 px-3 py-1 rounded-full whitespace-nowrap">
                            Private
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <p className="text-gray-600 text-lg mb-4">You haven't created any packs yet.</p>
            <p className="text-gray-500 text-sm">
              Use the form above to create your first pack!
            </p>
          </div>
        )}

        {/* Browse Packs */}
        <div className="mt-12 bg-white rounded-xl shadow-lg p-8 text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-2">Discover More Packs</h3>
          <p className="text-gray-600 mb-6">Follow packs created by other users and grow your collection</p>
          <Link href="/packs">
            <button className="inline-block bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-8 rounded-lg transition-colors">
              Browse All Packs
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}
