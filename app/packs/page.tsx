'use client'

import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { followPack, unfollowPack } from '@/lib/packs'

interface Pack {
  id: string
  name: string
  description: string | null
  owner_id: string
  owner: { username: string }
  created_at: string
  is_private: boolean
  members?: { count: number }[]
}

export default function PacksPage() {
  const router = useRouter()
  const [packs, setPacks] = useState<Pack[]>([])
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [followedPacks, setFollowedPacks] = useState<Set<string>>(new Set())

  useEffect(() => {
    const loadPacksData = async () => {
      try {
        const supabase = createClient()

        // Get current user
        const { data: userData } = await supabase.auth.getUser()
        if (userData.user) {
          setCurrentUser(userData.user as { id: string })

          // Get packs this user follows
          const { data: followData } = await supabase
            .from('pack_followers')
            .select('pack_id')
            .eq('user_id', userData.user.id)

          if (followData) {
            setFollowedPacks(new Set(followData.map((f: any) => f.pack_id)))
          }
        }

        // Fetch all public packs with owner info and member count
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
            owner:owner_id(username),
            members:pack_members(count)
          `
          )
          .eq('is_private', false)
          .order('created_at', { ascending: false })

        if (packsError) {
          console.error('Packs fetch error:', packsError)
          setError('Failed to load packs')
        } else {
          const packs = (packsData || []).map((pack: any) => ({
            ...pack,
            owner: {
              username: (Array.isArray(pack.owner) ? pack.owner[0]?.username : pack.owner?.username) || 'Unknown',
            },
          }))
          setPacks(packs)
        }

        setLoading(false)
      } catch (err) {
        console.error('Load packs error:', err)
        setError('Failed to load packs')
        setLoading(false)
      }
    }

    loadPacksData()
  }, [])

  const handleFollowPack = async (e: React.MouseEvent, packId: string) => {
    e.preventDefault()

    if (!currentUser) {
      router.push('/login')
      return
    }

    if (followedPacks.has(packId)) {
      await unfollowPack(currentUser.id, packId)
      setFollowedPacks((prev) => {
        const newSet = new Set(prev)
        newSet.delete(packId)
        return newSet
      })
    } else {
      await followPack(currentUser.id, packId)
      setFollowedPacks((prev) => new Set([...prev, packId]))
    }
  }

  const filteredPacks = packs.filter(
    (pack) =>
      pack.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (pack.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      pack.owner.username.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center">
        <p className="text-gray-600">Loading packs...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/stack" className="text-amber-600 hover:text-amber-700 font-medium mb-6 inline-block">
            ← Back
          </Link>

          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Discover Packs</h1>
              <p className="text-gray-600">
                Follow pet collections and connect with other enthusiasts
              </p>
            </div>
            {currentUser && (
              <Link href="/my-packs">
                <button className="bg-amber-600 hover:bg-amber-700 text-white font-medium py-2 px-6 rounded-lg transition-colors">
                  My Packs
                </button>
              </Link>
            )}
          </div>

          {/* Search */}
          <div className="mb-6">
            <input
              type="text"
              placeholder="Search packs by name, description, or creator..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900"
            />
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Packs List */}
        {filteredPacks.length > 0 ? (
          <div className="space-y-4">
            {filteredPacks.map((pack) => {
              const memberCount = pack.members?.[0]?.count || 0
              const isFollowing = followedPacks.has(pack.id)

              return (
                <Link key={pack.id} href={`/packs/${pack.id}`}>
                  <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h2 className="text-2xl font-bold text-gray-900 mb-1">{pack.name}</h2>
                        {pack.description && (
                          <p className="text-gray-600 mb-3">{pack.description}</p>
                        )}
                      </div>
                      {currentUser && (
                        <button
                          onClick={(e) => handleFollowPack(e, pack.id)}
                          className={`ml-4 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                            isFollowing
                              ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                              : 'bg-amber-600 text-white hover:bg-amber-700'
                          }`}
                        >
                          {isFollowing ? '✓ Following' : '+ Follow'}
                        </button>
                      )}
                    </div>

                    {/* Pack info */}
                    <div className="flex items-center gap-6 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Creator</span>
                        <p className="text-amber-600 hover:text-amber-700">
                          @{pack.owner.username}
                        </p>
                      </div>
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
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <p className="text-gray-600 text-lg mb-4">
              {searchTerm ? 'No packs found matching your search.' : 'No public packs yet.'}
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="text-amber-600 hover:text-amber-700 font-medium"
              >
                Clear search
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
