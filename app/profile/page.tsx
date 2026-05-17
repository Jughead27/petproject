'use client'

import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [pets, setPets] = useState<Pet[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const supabase = createClient()

        // Get current user
        const { data: userData } = await supabase.auth.getUser()

        if (!userData.user) {
          router.push('/login')
          return
        }

        // Fetch user profile
        const { data: profileData } = await supabase
          .from('users')
          .select('id, username')
          .eq('id', userData.user.id)
          .single()

        if (profileData) {
          setUser(profileData)
        }

        // Fetch user's pets
        const { data: petsData, error: petsError } = await supabase
          .from('pets')
          .select('id, name, species, avatar_url, card_number')
          .eq('owner_id', userData.user.id)
          .order('created_at', { ascending: false })

        if (petsError) {
          console.error('Pets fetch error:', petsError)
        } else {
          setPets(petsData || [])
        }

        setLoading(false)
      } catch (err) {
        console.error('Profile fetch error:', err)
        setError('Failed to load profile')
        setLoading(false)
      }
    }

    fetchProfile()
  }, [router])

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
        <div className="mb-12">
          <Link href="/stack" className="text-amber-600 hover:text-amber-700 font-medium mb-6 inline-block">
            ← Back
          </Link>

          <div className="bg-white rounded-xl shadow-lg p-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              {user?.username ? `@${user.username}` : 'Your Profile'}
            </h1>
            <p className="text-gray-600">Pet Collection</p>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Pets Grid */}
        {pets.length > 0 ? (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Pets ({pets.length})</h2>
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
                      <h3 className="text-xl font-bold text-gray-900">{pet.name}</h3>
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

            {/* Add Another Pet */}
            <Link href="/pets/create">
              <button className="block w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-4 rounded-lg transition-colors text-lg mb-8">
                🐾 Add Another Pet
              </button>
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <p className="text-gray-600 text-lg mb-6">You haven't added any pets yet.</p>
            <Link href="/pets/create">
              <button className="inline-block bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-8 rounded-lg transition-colors">
                🐾 Add Your First Pet
              </button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
