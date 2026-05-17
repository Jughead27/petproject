'use client'

import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
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
  username: string | null
}

export default function PetCardPage() {
  const params = useParams()
  const router = useRouter()
  const petId = params.id as string

  const [pet, setPet] = useState<Pet | null>(null)
  const [owner, setOwner] = useState<User | null>(null)
  const [isOwner, setIsOwner] = useState(false)
  const [boopCount, setBoopCount] = useState(0)
  const [stashCount, setStashCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchPet = async () => {
      try {
        const supabase = createClient()

        // Get current user
        const { data: userData } = await supabase.auth.getUser()

        // Fetch pet
        const { data: petData, error: petError } = await supabase
          .from('pets')
          .select('*')
          .eq('id', petId)
          .single()

        if (petError || !petData) {
          setError('Pet not found')
          setLoading(false)
          return
        }

        setPet(petData)

        // Check if current user is owner
        if (userData.user && userData.user.id === petData.owner_id) {
          setIsOwner(true)
        }

        // Fetch owner info
        const { data: ownerData } = await supabase
          .from('users')
          .select('username')
          .eq('id', petData.owner_id)
          .single()

        setOwner(ownerData)

        // Fetch boop count
        const { data: boopsData, error: boopsError } = await supabase
          .from('boops')
          .select('id', { count: 'exact' })
          .eq('pet_id', petId)

        if (!boopsError && boopsData) {
          setBoopCount(boopsData.length)
        }

        // Fetch stash count
        const { data: stashesData, error: stashesError } = await supabase
          .from('stashes')
          .select('id', { count: 'exact' })
          .eq('pet_id', petId)

        if (!stashesError && stashesData) {
          setStashCount(stashesData.length)
        }

        setLoading(false)
      } catch (err) {
        console.error('Fetch error:', err)
        setError('Failed to load pet')
        setLoading(false)
      }
    }

    if (petId) {
      fetchPet()
    }
  }, [petId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    )
  }

  if (error || !pet) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Link href="/stack" className="text-amber-600 hover:text-amber-700 font-medium">
            Back to Stack
          </Link>
        </div>
      </div>
    )
  }

  const profileIncomplete = !pet.breed || pet.age_years === null || !pet.bio

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Back button */}
        <Link href="/stack" className="text-amber-600 hover:text-amber-700 font-medium mb-6 inline-block">
          ← Back
        </Link>

        {/* Card */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Cover photo */}
          <div className="h-48 bg-gradient-to-br from-amber-200 to-orange-300 relative overflow-hidden">
            {pet.cover_url ? (
              <img src={pet.cover_url} alt="Cover" className="w-full h-full object-cover" />
            ) : null}
          </div>

          {/* Content */}
          <div className="relative px-6 pb-6">
            {/* Avatar */}
            <div className="flex justify-between items-start -mt-16 mb-4 relative z-10">
              <div className="relative">
                {pet.avatar_url ? (
                  <img
                    src={pet.avatar_url}
                    alt={pet.name}
                    className="w-32 h-32 rounded-full border-4 border-white object-cover shadow-lg"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full border-4 border-white bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center shadow-lg">
                    <span className="text-4xl">🐾</span>
                  </div>
                )}
                {pet.is_nursery && (
                  <span className="absolute bottom-2 right-2 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    🍼 Baby
                  </span>
                )}
              </div>

              {isOwner && (
                <Link
                  href={`/pets/${pet.id}/edit`}
                  className="text-amber-600 hover:text-amber-700 font-medium text-sm"
                >
                  ✏️ Edit
                </Link>
              )}
            </div>

            {/* Pet info */}
            <div className="mb-6">
              <div className="flex items-baseline gap-2 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{pet.name}</h1>
                {pet.card_number && (
                  <span className="text-sm font-medium text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
                    {pet.species} #{pet.card_number}
                  </span>
                )}
              </div>

              {pet.breed && <p className="text-gray-600 text-lg mb-2">{pet.breed}</p>}

              {(pet.age_years !== null || pet.age_months !== null) && (
                <p className="text-sm text-gray-500 mb-2">
                  {pet.age_years && `${pet.age_years}y `}
                  {pet.age_months && `${pet.age_months}m`}
                </p>
              )}
            </div>

            {/* Bio */}
            {pet.bio && <p className="text-gray-700 mb-6 italic">{pet.bio}</p>}

            {/* Owner */}
            {owner?.username && (
              <p className="text-sm text-gray-600 mb-6">
                Pet owner:{' '}
                <Link href={`/user/${owner.username}`} className="font-medium text-amber-600 hover:text-amber-700">
                  @{owner.username}
                </Link>
              </p>
            )}

            {/* Complete profile banner */}
            {isOwner && profileIncomplete && (
              <Link
                href={`/pets/${pet.id}/edit`}
                className="block w-full bg-blue-50 border border-blue-200 text-blue-900 px-4 py-3 rounded-lg text-center font-medium hover:bg-blue-100 transition-colors mb-6"
              >
                📝 Complete {pet.name}'s profile
              </Link>
            )}

            {/* Interaction stats */}
            <div className="border-t pt-6">
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-pink-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-pink-600">{boopCount}</p>
                  <p className="text-sm text-pink-700 font-medium">Boops</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-blue-600">{stashCount}</p>
                  <p className="text-sm text-blue-700 font-medium">Stashes</p>
                </div>
              </div>
              <button disabled className="w-full bg-gray-100 text-gray-500 font-medium py-2 rounded-lg text-sm cursor-not-allowed">
                👁️ Follow (coming soon)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
