'use client'

import { createClient } from '@/lib/supabase'
import { uploadToR2 } from '@/lib/upload'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

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

export default function CreatePetPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [species, setSpecies] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatarFile(file)
      const reader = new FileReader()
      reader.onloadend = () => setAvatarPreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleCreatePet = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (!name.trim()) {
      setError('Please enter a pet name')
      return
    }

    if (!species) {
      setError('Please select a species')
      return
    }

    if (!avatarFile) {
      setError('Please upload a photo')
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()

      // Get current user
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) {
        setError('Not authenticated')
        return
      }

      // Upload avatar to R2
      const avatarUrl = await uploadToR2(avatarFile, 'pets/avatars', userData.user.id)

      // Get next card number for this species
      const { data: speciesCount, error: countError } = await supabase
        .from('pets')
        .select('id', { count: 'exact' })
        .eq('owner_id', userData.user.id)
        .eq('species', species)

      if (countError) {
        console.error('Count error:', countError)
      }

      const cardNumber = (speciesCount?.length || 0) + 1

      // Insert pet
      const { data: newPet, error: insertError } = await supabase
        .from('pets')
        .insert({
          owner_id: userData.user.id,
          name: name.trim(),
          species,
          avatar_url: avatarUrl,
          card_number: cardNumber,
        })
        .select()
        .single()

      if (insertError) {
        setError('Failed to create pet. Please try again.')
        console.error('Insert error:', insertError)
        return
      }

      if (!newPet) {
        setError('Failed to create pet')
        return
      }

      // Redirect to pet card
      router.push(`/pets/${newPet.id}`)
    } catch (err) {
      console.error('Create pet error:', {
        error: err instanceof Error ? err.message : String(err),
        timestamp: new Date().toISOString(),
      })
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 py-8 px-4">
      <div className="max-w-md mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Your Pet's Card</h1>
        <p className="text-gray-600 mb-8">Start with the essentials. You can add more details later.</p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleCreatePet} className="space-y-6">
          {/* Pet Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Pet Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50"
              placeholder="e.g. Luna"
            />
          </div>

          {/* Species */}
          <div>
            <label htmlFor="species" className="block text-sm font-medium text-gray-700 mb-2">
              Species
            </label>
            <select
              id="species"
              value={species}
              onChange={(e) => setSpecies(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50"
            >
              <option value="">Select a species...</option>
              {SPECIES_LIST.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Avatar Photo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Photo
            </label>
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                disabled={loading}
                className="hidden"
                id="avatar-upload"
              />
              <label
                htmlFor="avatar-upload"
                className="block w-full px-4 py-8 border-2 border-dashed border-gray-300 rounded-lg text-center cursor-pointer hover:border-amber-500 hover:bg-amber-50 transition-colors disabled:opacity-50"
              >
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Preview"
                    className="h-32 w-32 object-cover rounded-lg mx-auto"
                  />
                ) : (
                  <div className="text-gray-600">
                    <p className="font-medium">📸 Click to upload a photo</p>
                    <p className="text-xs text-gray-500">or drag and drop</p>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Creating card...' : 'Create Pet Card'}
          </button>
        </form>

        <p className="text-xs text-gray-500 text-center mt-6">
          Your pet card will be live immediately. You can edit details anytime.
        </p>
      </div>
    </div>
  )
}
