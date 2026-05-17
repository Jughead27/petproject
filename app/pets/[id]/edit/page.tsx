'use client'

import { createClient } from '@/lib/supabase'
import { uploadToR2 } from '@/lib/upload'
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
  owner_id: string
}

export default function EditPetPage() {
  const params = useParams()
  const router = useRouter()
  const petId = params.id as string

  const [pet, setPet] = useState<Pet | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [isOwner, setIsOwner] = useState(false)

  const [breed, setBreed] = useState('')
  const [ageYears, setAgeYears] = useState<number | null>(null)
  const [ageMonths, setAgeMonths] = useState<number | null>(null)
  const [bio, setBio] = useState('')
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState('')

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
        } else {
          setError('You do not have permission to edit this pet')
          setLoading(false)
          return
        }

        // Populate form with existing data
        setBreed(petData.breed || '')
        setAgeYears(petData.age_years)
        setAgeMonths(petData.age_months)
        setBio(petData.bio || '')
        if (petData.cover_url) {
          setCoverPreview(petData.cover_url)
        }
        if (petData.avatar_url) {
          setAvatarPreview(petData.avatar_url)
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

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setCoverFile(file)
      const reader = new FileReader()
      reader.onloadend = () => setCoverPreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatarFile(file)
      const reader = new FileReader()
      reader.onloadend = () => setAvatarPreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!pet) return

    // Validation
    if (!breed.trim()) {
      setError('Please enter a breed')
      return
    }

    if (ageYears === null && ageMonths === null) {
      setError('Please enter age (years or months)')
      return
    }

    if (!bio.trim()) {
      setError('Please enter a bio')
      return
    }

    setSaving(true)

    try {
      const supabase = createClient()
      const { data: userData } = await supabase.auth.getUser()

      if (!userData.user) {
        setError('Not authenticated')
        return
      }

      let newCoverUrl = pet.cover_url
      let newAvatarUrl = pet.avatar_url

      // Upload cover if changed
      if (coverFile) {
        newCoverUrl = await uploadToR2(coverFile, 'pets/covers', userData.user.id)
      }

      // Upload avatar if changed
      if (avatarFile) {
        newAvatarUrl = await uploadToR2(avatarFile, 'pets/avatars', userData.user.id)
      }

      // Determine nursery status (simplified logic)
      let isNursery = false
      if (ageYears !== null && ageYears === 0 && ageMonths !== null) {
        // Dog: under 12 months
        if (pet.species === 'Dog') {
          isNursery = ageMonths < 12
        }
        // Cat and others: under 6 months
        else {
          isNursery = ageMonths < 6
        }
      } else if (ageYears === 0) {
        // If only months provided or age is 0
        isNursery = true
      }

      // Update pet
      const { error: updateError } = await supabase
        .from('pets')
        .update({
          breed: breed.trim(),
          age_years: ageYears,
          age_months: ageMonths,
          bio: bio.trim(),
          cover_url: newCoverUrl,
          avatar_url: newAvatarUrl,
          is_nursery: isNursery,
        })
        .eq('id', pet.id)

      if (updateError) {
        setError('Failed to save changes. Please try again.')
        console.error('Update error:', updateError)
        return
      }

      // Redirect back to pet card
      router.push(`/pets/${pet.id}`)
    } catch (err) {
      console.error('Save error:', {
        error: err instanceof Error ? err.message : String(err),
        timestamp: new Date().toISOString(),
      })
      setError('An unexpected error occurred')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!pet || !window.confirm(`Are you sure you want to delete ${pet.name}? This cannot be undone.`)) {
      return
    }

    setDeleting(true)

    try {
      const supabase = createClient()

      const { error: deleteError } = await supabase
        .from('pets')
        .delete()
        .eq('id', pet.id)

      if (deleteError) {
        setError('Failed to delete pet. Please try again.')
        console.error('Delete error:', deleteError)
        setDeleting(false)
        return
      }

      // Redirect to profile
      router.push('/profile')
    } catch (err) {
      console.error('Delete error:', {
        error: err instanceof Error ? err.message : String(err),
        timestamp: new Date().toISOString(),
      })
      setError('An unexpected error occurred')
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    )
  }

  if (error && !isOwner) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Link href="/stack" className="text-amber-600 hover:text-amber-700 font-medium">
            Back to Stack
          </Link>
        </div>
      </div>
    )
  }

  if (!pet) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-red-600 mb-4">Pet not found</p>
          <Link href="/profile" className="text-amber-600 hover:text-amber-700 font-medium">
            Back to Profile
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Link href={`/pets/${pet.id}`} className="text-amber-600 hover:text-amber-700 font-medium mb-6 inline-block">
          ← Back
        </Link>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete {pet.name}'s Profile</h1>
          <p className="text-gray-600 mb-8">Add more details to make their card shine.</p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-6">
            {/* Breed */}
            <div>
              <label htmlFor="breed" className="block text-sm font-medium text-gray-700 mb-2">
                Breed *
              </label>
              <input
                id="breed"
                type="text"
                value={breed}
                onChange={(e) => setBreed(e.target.value)}
                disabled={saving}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50"
                placeholder="e.g. Golden Retriever"
              />
            </div>

            {/* Age */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="age-years" className="block text-sm font-medium text-gray-700 mb-2">
                  Age (Years)
                </label>
                <input
                  id="age-years"
                  type="number"
                  min="0"
                  max="50"
                  value={ageYears ?? ''}
                  onChange={(e) => setAgeYears(e.target.value ? parseInt(e.target.value) : null)}
                  disabled={saving}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50"
                  placeholder="0"
                />
              </div>
              <div>
                <label htmlFor="age-months" className="block text-sm font-medium text-gray-700 mb-2">
                  Age (Months)
                </label>
                <input
                  id="age-months"
                  type="number"
                  min="0"
                  max="11"
                  value={ageMonths ?? ''}
                  onChange={(e) => setAgeMonths(e.target.value ? parseInt(e.target.value) : null)}
                  disabled={saving}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Bio */}
            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
                Bio *
              </label>
              <textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                disabled={saving}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50"
                placeholder="Tell us about your pet in their voice..."
              />
              <p className="text-xs text-gray-500 mt-1">Write as if your pet is speaking</p>
            </div>

            {/* Cover Photo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cover Photo
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverChange}
                  disabled={saving}
                  className="hidden"
                  id="cover-upload"
                />
                <label
                  htmlFor="cover-upload"
                  className="block w-full px-4 py-8 border-2 border-dashed border-gray-300 rounded-lg text-center cursor-pointer hover:border-amber-500 hover:bg-amber-50 transition-colors disabled:opacity-50"
                >
                  {coverPreview ? (
                    <img
                      src={coverPreview}
                      alt="Cover Preview"
                      className="h-40 w-full object-cover rounded-lg"
                    />
                  ) : (
                    <div className="text-gray-600">
                      <p className="font-medium">📸 Click to upload cover photo</p>
                      <p className="text-xs text-gray-500">or drag and drop</p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Avatar Photo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Avatar Photo
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  disabled={saving}
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
                      alt="Avatar Preview"
                      className="h-40 w-40 object-cover rounded-full mx-auto"
                    />
                  ) : (
                    <div className="text-gray-600">
                      <p className="font-medium">📸 Click to upload avatar photo</p>
                      <p className="text-xs text-gray-500">or drag and drop</p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Submit */}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving || deleting}
                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={saving || deleting}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
              >
                {deleting ? 'Deleting...' : '🗑️ Delete'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
