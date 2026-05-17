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
  avatar_url: string | null
  owner_id: string
}

interface User {
  id: string
}

interface UserProfile {
  username: string | null
}

export default function ExplorePage() {
  const router = useRouter()
  const [pets, setPets] = useState<Pet[]>([])
  const [userProfiles, setUserProfiles] = useState<Record<string, UserProfile>>({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterSpecies, setFilterSpecies] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)

  const SPECIES_LIST = [
    'Dog',
    'Cat',
    'Rabbit',
    'Bird',
    'Fish',
    'Reptile',
    'Hamster',
    'Guinea Pig',
    'Horse',
    'Other',
  ]

  useEffect(() => {
    const loadExplore = async () => {
      try {
        const supabase = createClient()

        // Get current user
        const { data: userData } = await supabase.auth.getUser()
        if (!userData.user) {
          router.push('/login')
          return
        }

        setUser(userData.user as User)

        // Fetch all pets
        const { data: allPets, error: petsError } = await supabase
          .from('pets')
          .select('id, name, species, breed, avatar_url, owner_id')
          .order('created_at', { ascending: false })

        if (petsError) {
          console.error('Pets fetch error:', petsError)
        }

        setPets(allPets || [])

        // Fetch all unique owner usernames
        const ownerIds = new Set((allPets || []).map((p) => p.owner_id))
        const profiles: Record<string, UserProfile> = {}

        for (const ownerId of ownerIds) {
          const { data: profile } = await supabase
            .from('users')
            .select('username')
            .eq('id', ownerId)
            .single()

          if (profile) {
            profiles[ownerId] = profile
          }
        }

        setUserProfiles(profiles)
        setLoading(false)
      } catch (err) {
        console.error('Explore load error:', err)
        setLoading(false)
      }
    }

    loadExplore()
  }, [router])

  const handleLogout = async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push('/login')
    } catch (err) {
      console.error('Logout error:', err)
    }
  }

  // Filter pets based on search and species
  const filteredPets = pets.filter((pet) => {
    const matchesSearch = pet.name.toLowerCase().includes(search.toLowerCase())
    const matchesSpecies = !filterSpecies || pet.species === filterSpecies

    return matchesSearch && matchesSpecies
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center">
        <p className="text-gray-600">Loading pets...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Explore</h1>
          <div className="flex gap-3">
            <Link
              href="/stack"
              className="bg-white text-amber-600 font-medium px-4 py-2 rounded-lg hover:bg-amber-50 transition-colors"
            >
              🃏 Stack
            </Link>
            <Link
              href="/dex"
              className="bg-white text-amber-600 font-medium px-4 py-2 rounded-lg hover:bg-amber-50 transition-colors"
            >
              📚 Dex
            </Link>
            <Link
              href="/profile"
              className="bg-white text-amber-600 font-medium px-4 py-2 rounded-lg hover:bg-amber-50 transition-colors"
            >
              👤 Profile
            </Link>
          </div>
        </div>

        {/* Search */}
        <div className="mb-8">
          <input
            type="text"
            placeholder="Search pet names..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-6 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        {/* Species Filter */}
        <div className="mb-8 flex flex-wrap gap-2">
          <button
            onClick={() => setFilterSpecies(null)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterSpecies === null
                ? 'bg-amber-600 text-white'
                : 'bg-white text-gray-700 hover:bg-amber-50'
            }`}
          >
            All Species
          </button>
          {SPECIES_LIST.map((species) => {
            const count = pets.filter((p) => p.species === species).length
            return (
              <button
                key={species}
                onClick={() => setFilterSpecies(species)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterSpecies === species
                    ? 'bg-amber-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-amber-50'
                } ${count === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={count === 0}
              >
                {species} ({count})
              </button>
            )
          })}
        </div>

        {/* Pet Grid */}
        {filteredPets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
            {filteredPets.map((pet) => (
              <Link key={pet.id} href={`/pets/${pet.id}`}>
                <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow cursor-pointer h-full">
                  {/* Avatar */}
                  <div className="h-48 bg-gradient-to-br from-amber-200 to-orange-300 flex items-center justify-center overflow-hidden">
                    {pet.avatar_url ? (
                      <img
                        src={pet.avatar_url}
                        alt={pet.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-6xl">🐾</span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">{pet.name}</h3>
                    <p className="text-sm text-gray-600 mb-3">{pet.species}</p>

                    {pet.breed && (
                      <p className="text-xs text-gray-500 mb-3">{pet.breed}</p>
                    )}

                    {userProfiles[pet.owner_id] && (
                      <p className="text-xs text-gray-500">
                        by <span className="font-medium">@{userProfiles[pet.owner_id].username}</span>
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg mb-4">
              {search ? 'No pets found matching your search.' : 'No pets found.'}
            </p>
            {search && (
              <button
                onClick={() => setSearch('')}
                className="text-amber-600 hover:text-amber-700 font-medium"
              >
                Clear search
              </button>
            )}
          </div>
        )}

        {/* Results count */}
        {filteredPets.length > 0 && (
          <div className="text-center text-gray-600 text-sm mb-8">
            Showing {filteredPets.length} of {pets.length} pets
          </div>
        )}

        {/* Bottom nav */}
        <div className="fixed bottom-6 left-0 right-0 text-center">
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
