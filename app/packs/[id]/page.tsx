'use client'

import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getPack, getPackPets, followPack, unfollowPack, removePetFromPack, deletePack } from '@/lib/packs'

interface Pet {
  id: string
  name: string
  species: string
  breed: string | null
  avatar_url: string | null
  card_number: number | null
  owner_id: string
}

interface Pack {
  id: string
  name: string
  description: string | null
  is_private: boolean
  owner_id: string
  owner: { username: string }
  created_at: string
  members?: { count: number }[]
}

export default function PackPage() {
  const params = useParams()
  const router = useRouter()
  const packId = params.id as string

  const [pack, setPack] = useState<Pack | null>(null)
  const [pets, setPets] = useState<Pet[]>([])
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null)
  const [isFollowing, setIsFollowing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadPack = async () => {
      try {
        const supabase = createClient()
        const { data: userData } = await supabase.auth.getUser()

        if (userData.user) {
          setCurrentUser(userData.user as { id: string })
        }

        const packData = await getPack(packId)
        if (!packData) {
          setError('Pack not found')
          setLoading(false)
          return
        }

        setPack(packData)

        const petsData = await getPackPets(packId)
        setPets(petsData)

        // Check if user is following
        if (userData.user) {
          const following = await isFollowingPack(userData.user.id, packId)
          setIsFollowing(following)
        }

        setLoading(false)
      } catch (err) {
        console.error('Load pack error:', err)
        setError('Failed to load pack')
        setLoading(false)
      }
    }

    if (packId) {
      loadPack()
    }
  }, [packId])

  const handleFollow = async () => {
    if (!currentUser) {
      router.push('/login')
      return
    }

    if (isFollowing) {
      await unfollowPack(currentUser.id, packId)
      setIsFollowing(false)
    } else {
      await followPack(currentUser.id, packId)
      setIsFollowing(true)
    }
  }

  const handleRemovePet = async (petId: string) => {
    if (!window.confirm('Remove this pet from the pack?')) return

    const success = await removePetFromPack(packId, petId)
    if (success) {
      setPets((prev) => prev.filter((p) => p.id !== petId))
    }
  }

  const handleDeletePack = async () => {
    if (!pack || !currentUser) return
    if (!window.confirm(`Delete pack "${pack.name}"? This cannot be undone.`)) return

    const success = await deletePack(packId, currentUser.id)
    if (success) {
      router.push('/packs')
    }
  }

  const isOwner = currentUser && pack && currentUser.id === pack.owner_id

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center">
        <p className="text-gray-600">Loading pack...</p>
      </div>
    )
  }

  if (error || !pack) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Link href="/packs" className="text-amber-600 hover:text-amber-700 font-medium">
            Back to Packs
          </Link>
        </div>
      </div>
    )
  }

  const memberCount = pack.members?.[0]?.count || pets.length

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Back button */}
        <Link href="/packs" className="text-amber-600 hover:text-amber-700 font-medium mb-6 inline-block">
          ← Back
        </Link>

        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">{pack.name}</h1>
              {pack.description && (
                <p className="text-gray-600 mt-2 max-w-2xl">{pack.description}</p>
              )}
            </div>
            {!isOwner && currentUser && (
              <button
                onClick={handleFollow}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
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
          <div className="flex items-center gap-4 text-gray-600">
            <div>
              <p className="text-sm">Pack Owner</p>
              <Link
                href={`/user/${pack.owner.username}`}
                className="font-medium text-amber-600 hover:text-amber-700"
              >
                @{pack.owner.username}
              </Link>
            </div>
            <div>
              <p className="text-sm">Members</p>
              <p className="text-lg font-bold text-gray-900">{memberCount}</p>
            </div>
            {!pack.is_private && (
              <div>
                <span className="inline-block bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full">
                  Public
                </span>
              </div>
            )}
            {isOwner && (
              <div className="ml-auto flex gap-2">
                <button
                  onClick={handleDeletePack}
                  className="text-red-600 hover:text-red-700 font-medium text-sm"
                >
                  Delete Pack
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Pets Grid */}
        {pets.length > 0 ? (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Pets in this Pack ({pets.length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
              {pets.map((pet) => (
                <Link key={pet.id} href={`/pets/${pet.id}`}>
                  <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow cursor-pointer h-full group">
                    {/* Avatar */}
                    <div className="h-48 bg-gradient-to-br from-amber-200 to-orange-300 flex items-center justify-center overflow-hidden">
                      {pet.avatar_url ? (
                        <img src={pet.avatar_url} alt={pet.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-6xl">🐾</span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-4">
                      <h3 className="text-lg font-bold text-gray-900">{pet.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">{pet.species}</p>
                      {pet.breed && <p className="text-xs text-gray-500 mb-2">{pet.breed}</p>}
                      {pet.card_number && (
                        <span className="inline-block text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                          #{pet.card_number}
                        </span>
                      )}

                      {/* Remove button for owner */}
                      {isOwner && (
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            handleRemovePet(pet.id)
                          }}
                          className="mt-3 w-full text-xs text-red-600 hover:text-red-700 font-medium bg-red-50 hover:bg-red-100 py-1 rounded transition-colors"
                        >
                          Remove from Pack
                        </button>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <p className="text-gray-600 text-lg mb-4">No pets in this pack yet</p>
            {!isOwner && (
              <p className="text-sm text-gray-500">
                Be the first to add your pet to this pack!
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

async function isFollowingPack(userId: string, packId: string): Promise<boolean> {
  try {
    const supabase = createClient()
    const { data } = await supabase
      .from('pack_followers')
      .select('id')
      .eq('user_id', userId)
      .eq('pack_id', packId)
      .single()
    return !!data
  } catch {
    return false
  }
}
