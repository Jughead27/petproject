'use client'

import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface Pet {
  id: string
  name: string
  species: string
  breed: string | null
  age_years: number | null
  age_months: number | null
  bio: string | null
  avatar_url: string | null
  cover_url: string | null
  card_number: number | null
  is_nursery: boolean
  owner_id: string
}

interface User {
  id: string
}

interface UserProfile {
  username: string | null
}

export default function StackPage() {
  const router = useRouter()
  const [pets, setPets] = useState<Pet[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [actioning, setActioning] = useState(false)
  const [owner, setOwner] = useState<UserProfile | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [noMore, setNoMore] = useState(false)

  useEffect(() => {
    const loadStack = async () => {
      try {
        const supabase = createClient()

        // Get current user
        const { data: userData } = await supabase.auth.getUser()
        if (!userData.user) {
          router.push('/login')
          return
        }

        setUser(userData.user as User)

        // Fetch all pets except user's own
        const { data: allPets, error: petsError } = await supabase
          .from('pets')
          .select('*')
          .neq('owner_id', userData.user.id)
          .order('created_at', { ascending: false })

        if (petsError) {
          console.error('Pets fetch error:', petsError)
        }

        setPets(allPets || [])
        if (!allPets || allPets.length === 0) {
          setNoMore(true)
        }

        setLoading(false)
      } catch (err) {
        console.error('Stack load error:', err)
        setLoading(false)
      }
    }

    loadStack()
  }, [router])

  // Fetch owner of current pet
  useEffect(() => {
    const loadOwner = async () => {
      if (currentIndex < pets.length) {
        const currentPet = pets[currentIndex]
        try {
          const supabase = createClient()
          const { data: ownerData } = await supabase
            .from('users')
            .select('username')
            .eq('id', currentPet.owner_id)
            .single()

          setOwner(ownerData)
        } catch (err) {
          console.error('Owner fetch error:', err)
        }
      }
    }

    loadOwner()
  }, [currentIndex, pets])

  const handleAction = async (action: 'boop' | 'stash' | 'follow' | 'pass') => {
    if (currentIndex >= pets.length || !user) return

    setActioning(true)
    const currentPet = pets[currentIndex]

    try {
      const supabase = createClient()

      // Record the interaction based on action type
      if (action === 'boop') {
        await supabase.from('boops').insert({
          pet_id: currentPet.id,
          user_id: user.id,
        })
      } else if (action === 'stash') {
        await supabase.from('stashes').insert({
          pet_id: currentPet.id,
          user_id: user.id,
        })
      } else if (action === 'follow') {
        await supabase.from('follows').insert({
          follower_id: user.id,
          following_id: currentPet.owner_id,
        })
      }
      // 'pass' doesn't record anything

      // Move to next card
      setCurrentIndex((prev) => {
        const next = prev + 1
        if (next >= pets.length) {
          setNoMore(true)
        }
        return next
      })
    } catch (err) {
      console.error(`${action} error:`, err)
    } finally {
      setActioning(false)
    }
  }

  const handleLogout = async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push('/login')
    } catch (err) {
      console.error('Logout error:', err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center">
        <p className="text-gray-600">Loading pets...</p>
      </div>
    )
  }

  if (noMore || pets.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-4xl mb-4">🥺</p>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">You've seen them all!</h1>
          <p className="text-gray-600 mb-8 max-w-sm">
            Come back later for more pets to discover. Or check out The Dex to see what you've spotted.
          </p>

          <div className="space-x-4">
            <button
              onClick={() => {
                setCurrentIndex(0)
                setNoMore(false)
              }}
              className="inline-block bg-amber-600 hover:bg-amber-700 text-white font-medium px-6 py-2 rounded-lg"
            >
              Start over
            </button>

            <Link
              href="/dex"
              className="inline-block bg-gray-600 hover:bg-gray-700 text-white font-medium px-6 py-2 rounded-lg"
            >
              The Dex
            </Link>
          </div>

          <div className="mt-8">
            <button
              onClick={handleLogout}
              className="text-red-600 hover:text-red-700 font-medium text-sm"
            >
              Log out
            </button>
          </div>
        </div>
      </div>
    )
  }

  const currentPet = pets[currentIndex]

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex flex-col items-center justify-center p-4">
      {/* Header */}
      <div className="absolute top-6 left-6 right-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">The Stack</h1>
        <div className="flex gap-3">
          <Link
            href="/profile"
            className="bg-white text-amber-600 font-medium px-4 py-2 rounded-lg hover:bg-amber-50 transition-colors"
          >
            👤 Profile
          </Link>
          <Link
            href="/dex"
            className="bg-white text-amber-600 font-medium px-4 py-2 rounded-lg hover:bg-amber-50 transition-colors"
          >
            📚 Dex
          </Link>
        </div>
      </div>

      {/* Card */}
      <div className="w-full max-w-lg mt-20 mb-6">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Cover photo */}
          <div className="h-56 bg-gradient-to-br from-amber-200 to-orange-300 relative overflow-hidden">
            {currentPet.cover_url ? (
              <img src={currentPet.cover_url} alt="Cover" className="w-full h-full object-cover" />
            ) : null}
          </div>

          {/* Content */}
          <div className="relative px-6 pb-6">
            {/* Avatar */}
            <div className="flex justify-between items-start -mt-12 mb-4 relative z-10">
              <div className="relative">
                {currentPet.avatar_url ? (
                  <img
                    src={currentPet.avatar_url}
                    alt={currentPet.name}
                    className="w-24 h-24 rounded-full border-4 border-white object-cover shadow-lg"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full border-4 border-white bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center shadow-lg">
                    <span className="text-3xl">🐾</span>
                  </div>
                )}
                {currentPet.is_nursery && (
                  <span className="absolute bottom-0 right-0 bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    🍼
                  </span>
                )}
              </div>
              <Link href={`/pets/${currentPet.id}`} className="text-amber-600 hover:text-amber-700 font-medium text-sm">
                View card →
              </Link>
            </div>

            {/* Pet info */}
            <div className="mb-4">
              <div className="flex items-baseline gap-2 mb-2">
                <h2 className="text-2xl font-bold text-gray-900">{currentPet.name}</h2>
                {currentPet.card_number && (
                  <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                    {currentPet.species} #{currentPet.card_number}
                  </span>
                )}
              </div>

              {currentPet.breed && <p className="text-gray-600 mb-2">{currentPet.breed}</p>}

              {(currentPet.age_years !== null || currentPet.age_months !== null) && (
                <p className="text-sm text-gray-500 mb-2">
                  {currentPet.age_years && `${currentPet.age_years}y `}
                  {currentPet.age_months && `${currentPet.age_months}m`}
                </p>
              )}
            </div>

            {/* Bio */}
            {currentPet.bio && <p className="text-gray-700 mb-4 italic text-sm">{currentPet.bio}</p>}

            {/* Owner */}
            {owner?.username && (
              <p className="text-xs text-gray-500 mb-6">
                Pet owner: <span className="font-medium">@{owner.username}</span>
              </p>
            )}

            {/* Card counter */}
            <p className="text-xs text-gray-400 text-center mb-6">
              {currentIndex + 1} of {pets.length}
            </p>

            {/* Actions */}
            <div className="grid grid-cols-4 gap-3">
              <button
                onClick={() => handleAction('pass')}
                disabled={actioning}
                className="py-2 px-2 bg-gray-100 hover:bg-gray-200 text-gray-600 font-medium rounded-lg transition-colors disabled:opacity-50 text-sm flex flex-col items-center gap-1"
              >
                <span className="text-lg">👋</span>
                <span className="hidden sm:inline">Pass</span>
              </button>
              <button
                onClick={() => handleAction('stash')}
                disabled={actioning}
                className="py-2 px-2 bg-blue-50 hover:bg-blue-100 text-blue-600 font-medium rounded-lg transition-colors disabled:opacity-50 text-sm flex flex-col items-center gap-1"
              >
                <span className="text-lg">🔖</span>
                <span className="hidden sm:inline">Stash</span>
              </button>
              <button
                onClick={() => handleAction('boop')}
                disabled={actioning}
                className="py-2 px-2 bg-pink-50 hover:bg-pink-100 text-pink-600 font-medium rounded-lg transition-colors disabled:opacity-50 text-sm flex flex-col items-center gap-1"
              >
                <span className="text-lg">❤️</span>
                <span className="hidden sm:inline">Boop</span>
              </button>
              <button
                onClick={() => handleAction('follow')}
                disabled={actioning}
                className="py-2 px-2 bg-green-50 hover:bg-green-100 text-green-600 font-medium rounded-lg transition-colors disabled:opacity-50 text-sm flex flex-col items-center gap-1"
              >
                <span className="text-lg">👁️</span>
                <span className="hidden sm:inline">Follow</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom nav */}
      <div className="fixed bottom-6 text-center">
        <button
          onClick={handleLogout}
          className="text-red-600 hover:text-red-700 font-medium text-sm"
        >
          Log out
        </button>
      </div>
    </div>
  )
}
