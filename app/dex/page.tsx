'use client'

import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface DexEntry {
  species: string
  breed: string | null
  count: number
  seen: number
}

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

export default function DexPage() {
  const router = useRouter()
  const [entries, setEntries] = useState<DexEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string | null>(null)
  const [user, setUser] = useState<{ id: string } | null>(null)

  useEffect(() => {
    const loadDex = async () => {
      try {
        const supabase = createClient()

        // Get current user
        const { data: userData } = await supabase.auth.getUser()
        if (!userData.user) {
          router.push('/login')
          return
        }

        setUser(userData.user as { id: string })

        // Fetch all pets grouped by species and breed
        const { data: allPets, error: petsError } = await supabase
          .from('pets')
          .select('species, breed, id')
          .neq('owner_id', userData.user.id)

        if (petsError) {
          console.error('Pets fetch error:', petsError)
          setLoading(false)
          return
        }

        // Fetch user's boops to see which pets they've interacted with
        const { data: boops, error: boopsError } = await supabase
          .from('boops')
          .select('pet_id')
          .eq('user_id', userData.user.id)

        if (boopsError) {
          console.error('Boops fetch error:', boopsError)
        }

        const boopedPetIds = new Set(boops?.map((b) => b.pet_id) || [])

        // Group pets by species and breed
        const dexMap = new Map<string, DexEntry>()

        ;(allPets || []).forEach((pet) => {
          const key = `${pet.species}-${pet.breed || 'unknown'}`
          const existing = dexMap.get(key) || {
            species: pet.species,
            breed: pet.breed,
            count: 0,
            seen: 0,
          }

          existing.count += 1
          if (boopedPetIds.has(pet.id)) {
            existing.seen += 1
          }

          dexMap.set(key, existing)
        })

        // Convert to array and sort by species name
        const dexEntries = Array.from(dexMap.values()).sort((a, b) =>
          a.species.localeCompare(b.species)
        )

        setEntries(dexEntries)
        setLoading(false)
      } catch (err) {
        console.error('Dex load error:', err)
        setLoading(false)
      }
    }

    loadDex()
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

  const filteredEntries = filter
    ? entries.filter((e) => e.species === filter)
    : entries

  const totalSpecies = new Set(entries.map((e) => e.species)).size
  const totalBreeds = entries.length
  const seenBreeds = entries.filter((e) => e.seen > 0).length

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center">
        <p className="text-gray-600">Loading Dex...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900">The Dex</h1>
          <div className="flex gap-3">
            <Link
              href="/stack"
              className="bg-white text-amber-600 font-medium px-4 py-2 rounded-lg hover:bg-amber-50 transition-colors"
            >
              🃏 Stack
            </Link>
            <Link
              href="/profile"
              className="bg-white text-amber-600 font-medium px-4 py-2 rounded-lg hover:bg-amber-50 transition-colors"
            >
              👤 Profile
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-3xl font-bold text-amber-600">{totalSpecies}</p>
              <p className="text-sm text-gray-600">Species</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-amber-600">{totalBreeds}</p>
              <p className="text-sm text-gray-600">Breed Variants</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-amber-600">{seenBreeds}</p>
              <p className="text-sm text-gray-600">Spotted</p>
            </div>
          </div>
        </div>

        {/* Species Filter */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter(null)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === null
                  ? 'bg-amber-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-amber-50'
              }`}
            >
              All Species
            </button>
            {SPECIES_LIST.map((species) => {
              const count = entries.filter((e) => e.species === species).length
              return (
                <button
                  key={species}
                  onClick={() => setFilter(species)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filter === species
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
        </div>

        {/* Breed List */}
        {filteredEntries.length > 0 ? (
          <div className="space-y-3">
            {filteredEntries.map((entry, idx) => (
              <div
                key={idx}
                className="bg-white rounded-lg shadow p-4 flex items-center justify-between hover:shadow-md transition-shadow"
              >
                <div className="flex-1">
                  <div className="flex items-baseline gap-3">
                    <h3 className="text-lg font-semibold text-gray-900">{entry.breed || `Other ${entry.species}`}</h3>
                    <span className="text-sm text-gray-500">({entry.species})</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {entry.seen} of {entry.count} spotted
                  </p>
                </div>

                {/* Progress bar */}
                <div className="flex-shrink-0 ml-4 w-32">
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 transition-all"
                      style={{ width: `${(entry.seen / entry.count) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 text-right mt-1">
                    {Math.round((entry.seen / entry.count) * 100)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">No breeds found in this species yet.</p>
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
