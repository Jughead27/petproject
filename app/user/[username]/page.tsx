'use client'

import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface Pet {
  id: string
  name: string
  species: string
  avatar_url: string | null
  card_number: number | null
}

interface User {
  id: string
  username: string | null
}

export default function UserProfilePage() {
  const params = useParams()
  const router = useRouter()
  const username = params.username as string

  const [user, setUser] = useState<User | null>(null)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [pets, setPets] = useState<Pet[]>([])
  const [followers, setFollowers] = useState(0)
  const [following, setFollowing] = useState(0)
  const [isFollowing, setIsFollowing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState(false)

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const supabase = createClient()

        // Get current user
        const { data: authData } = await supabase.auth.getUser()
        if (authData.user) {
          setCurrentUser({ id: authData.user.id } as User)
        }

        // Fetch user by username
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id, username')
          .eq('username', username)
          .single()

        if (userError || !userData) {
          setLoading(false)
          return
        }

        setUser(userData)

        // Fetch user's pets
        const { data: petsData } = await supabase
          .from('pets')
          .select('id, name, species, avatar_url, card_number')
          .eq('owner_id', userData.id)
          .order('created_at', { ascending: false })

        setPets(petsData || [])

        // Fetch follower count
        const { data: followersData, error: followersError } = await supabase
          .from('follows')
          .select('id', { count: 'exact' })
          .eq('following_id', userData.id)

        if (!followersError && followersData) {
          setFollowers(followersData.length)
        }

        // Fetch following count
        const { data: followingData, error: followingError } = await supabase
          .from('follows')
          .select('id', { count: 'exact' })
          .eq('follower_id', userData.id)

        if (!followingError && followingData) {
          setFollowing(followingData.length)
        }

        // Check if current user follows this user
        if (authData.user) {
          const { data: followData } = await supabase
            .from('follows')
            .select('id')
            .eq('follower_id', authData.user.id)
            .eq('following_id', userData.id)
            .single()

          setIsFollowing(!!followData)
        }

        setLoading(false)
      } catch (err) {
        console.error('Profile load error:', err)
        setLoading(false)
      }
    }

    if (username) {
      loadProfile()
    }
  }, [username])

  const handleToggleFollow = async () => {
    if (!user || !currentUser) return

    setToggling(true)

    try {
      const supabase = createClient()

      if (isFollowing) {
        // Unfollow
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', currentUser.id)
          .eq('following_id', user.id)

        setIsFollowing(false)
        setFollowers((prev) => Math.max(0, prev - 1))
      } else {
        // Follow
        await supabase.from('follows').insert({
          follower_id: currentUser.id,
          following_id: user.id,
        })

        setIsFollowing(true)
        setFollowers((prev) => prev + 1)
      }
    } catch (err) {
      console.error('Toggle follow error:', err)
    } finally {
      setToggling(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-gray-600 mb-4">User not found</p>
          <Link href="/explore" className="text-amber-600 hover:text-amber-700 font-medium">
            Back to Explore
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Back button */}
        <Link href="/explore" className="text-amber-600 hover:text-amber-700 font-medium mb-6 inline-block">
          ← Back
        </Link>

        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">@{user.username}</h1>
              <p className="text-gray-600">Pet Collection</p>
            </div>

            {currentUser && currentUser.id !== user.id && (
              <button
                onClick={handleToggleFollow}
                disabled={toggling}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  isFollowing
                    ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    : 'bg-amber-600 text-white hover:bg-amber-700'
                } disabled:opacity-50`}
              >
                {toggling ? 'Loading...' : isFollowing ? 'Following' : 'Follow'}
              </button>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-amber-600">{pets.length}</p>
              <p className="text-sm text-gray-600">Pets</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-600">{followers}</p>
              <p className="text-sm text-gray-600">Followers</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-600">{following}</p>
              <p className="text-sm text-gray-600">Following</p>
            </div>
          </div>
        </div>

        {/* Pets Grid */}
        {pets.length > 0 ? (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Their Pets ({pets.length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {pets.map((pet) => (
                <Link key={pet.id} href={`/pets/${pet.id}`}>
                  <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow cursor-pointer h-full">
                    {/* Avatar */}
                    <div className="h-40 bg-gradient-to-br from-amber-200 to-orange-300 flex items-center justify-center overflow-hidden">
                      {pet.avatar_url ? (
                        <img
                          src={pet.avatar_url}
                          alt={pet.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-5xl">🐾</span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-4">
                      <h3 className="text-lg font-bold text-gray-900">{pet.name}</h3>
                      <div className="flex items-baseline gap-2 mt-1">
                        <p className="text-gray-600">{pet.species}</p>
                        {pet.card_number && (
                          <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                            #{pet.card_number}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <p className="text-gray-600 text-lg">No pets yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}
