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
    if (ageYears === null && ageMonths === null) {
      setError('Please enter age (years or months)')
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
      <div style={{
        minHeight: '100vh',
        background: 'var(--app-bg)',
        backgroundImage: `
          radial-gradient(circle at 20% 20%, rgba(217, 119, 87, 0.08), transparent 50%),
          radial-gradient(circle at 80% 80%, rgba(90, 122, 154, 0.06), transparent 50%)
        `,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <p style={{ color: 'var(--ink-2)' }}>Loading...</p>
      </div>
    )
  }

  if (error && !isOwner) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'var(--app-bg)',
        backgroundImage: `
          radial-gradient(circle at 20% 20%, rgba(217, 119, 87, 0.08), transparent 50%),
          radial-gradient(circle at 80% 80%, rgba(90, 122, 154, 0.06), transparent 50%)
        `,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#dc2626', marginBottom: '16px' }}>{error}</p>
          <Link href="/stack" style={{
            color: 'var(--acc)',
            fontSize: '11.5px',
            fontWeight: 500,
            textDecoration: 'none',
          }}>
            Back to Stack
          </Link>
        </div>
      </div>
    )
  }

  if (!pet) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'var(--app-bg)',
        backgroundImage: `
          radial-gradient(circle at 20% 20%, rgba(217, 119, 87, 0.08), transparent 50%),
          radial-gradient(circle at 80% 80%, rgba(90, 122, 154, 0.06), transparent 50%)
        `,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#dc2626', marginBottom: '16px' }}>Pet not found</p>
          <Link href="/profile" style={{
            color: 'var(--acc)',
            fontSize: '11.5px',
            fontWeight: 500,
            textDecoration: 'none',
          }}>
            Back to Profile
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--app-bg)',
      backgroundImage: `
        radial-gradient(circle at 20% 20%, rgba(217, 119, 87, 0.08), transparent 50%),
        radial-gradient(circle at 80% 80%, rgba(90, 122, 154, 0.06), transparent 50%)
      `,
      paddingTop: '32px',
      paddingBottom: '32px',
      paddingLeft: '24px',
      paddingRight: '24px',
    }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <Link href={`/pets/${pet.id}`} style={{
          color: 'var(--acc)',
          fontSize: '11.5px',
          fontWeight: 500,
          textDecoration: 'none',
          marginBottom: '24px',
          display: 'inline-block',
        }}>
          ← Back
        </Link>

        <div style={{
          background: 'var(--paper)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--line)',
          boxShadow: 'var(--shadow-sm)',
          padding: '32px',
        }}>
          <h1 style={{
            fontFamily: '"Instrument Serif", Georgia, serif',
            fontSize: '28px',
            fontWeight: 400,
            fontStyle: 'italic',
            color: 'var(--ink)',
            marginBottom: '8px',
            lineHeight: 1,
          }}>
            Complete {pet.name}'s Profile
          </h1>
          <p style={{
            fontSize: '11.5px',
            color: 'var(--ink-2)',
            marginBottom: '24px',
            lineHeight: 1.3,
          }}>
            Add more details to make their card shine.
          </p>

          {error && (
            <div style={{
              marginBottom: '24px',
              padding: '12px 14px',
              backgroundColor: 'rgba(220, 38, 38, 0.1)',
              border: '1px solid rgba(220, 38, 38, 0.3)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '11.5px',
              color: '#7f1d1d',
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Breed */}
            <div>
              <label htmlFor="breed" style={{
                display: 'block',
                fontSize: '10.5px',
                fontWeight: 600,
                color: 'var(--ink)',
                marginBottom: '8px',
              }}>
                Breed
              </label>
              <input
                id="breed"
                type="text"
                value={breed}
                onChange={(e) => setBreed(e.target.value)}
                disabled={saving}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid var(--line)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--ink)',
                  backgroundColor: 'var(--paper)',
                  fontSize: '14px',
                  opacity: saving ? 0.5 : 1,
                }}
                placeholder="e.g. Golden Retriever"
              />
            </div>

            {/* Age */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label htmlFor="age-years" style={{
                  display: 'block',
                  fontSize: '10.5px',
                  fontWeight: 600,
                  color: 'var(--ink)',
                  marginBottom: '8px',
                }}>
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
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid var(--line)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--ink)',
                    backgroundColor: 'var(--paper)',
                    fontSize: '14px',
                    opacity: saving ? 0.5 : 1,
                  }}
                  placeholder="0"
                />
              </div>
              <div>
                <label htmlFor="age-months" style={{
                  display: 'block',
                  fontSize: '10.5px',
                  fontWeight: 600,
                  color: 'var(--ink)',
                  marginBottom: '8px',
                }}>
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
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid var(--line)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--ink)',
                    backgroundColor: 'var(--paper)',
                    fontSize: '14px',
                    opacity: saving ? 0.5 : 1,
                  }}
                  placeholder="0"
                />
              </div>
            </div>

            {/* Bio */}
            <div>
              <label htmlFor="bio" style={{
                display: 'block',
                fontSize: '10.5px',
                fontWeight: 600,
                color: 'var(--ink)',
                marginBottom: '8px',
              }}>
                Bio
              </label>
              <textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                disabled={saving}
                rows={4}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid var(--line)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--ink)',
                  backgroundColor: 'var(--paper)',
                  fontSize: '14px',
                  fontFamily: 'Inter, system-ui, sans-serif',
                  opacity: saving ? 0.5 : 1,
                }}
                placeholder="Tell us about your pet in their voice..."
              />
              <p style={{
                fontSize: '10.5px',
                color: 'var(--ink-2)',
                marginTop: '6px',
              }}>
                Write as if your pet is speaking
              </p>
            </div>

            {/* Cover Photo */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '10.5px',
                fontWeight: 600,
                color: 'var(--ink)',
                marginBottom: '8px',
              }}>
                Cover Photo
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverChange}
                  disabled={saving}
                  style={{ display: 'none' }}
                  id="cover-upload"
                />
                <label
                  htmlFor="cover-upload"
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '32px 16px',
                    border: '2px dashed var(--line)',
                    borderRadius: 'var(--radius-md)',
                    textAlign: 'center',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    backgroundColor: 'transparent',
                    transition: 'all 200ms',
                    opacity: saving ? 0.5 : 1,
                  }}
                  onMouseEnter={(e) => !saving && (e.currentTarget.style.borderColor = 'var(--acc)', e.currentTarget.style.backgroundColor = 'rgba(217, 119, 87, 0.05)')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--line)', e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  {coverPreview ? (
                    <img
                      src={coverPreview}
                      alt="Cover Preview"
                      style={{
                        height: '128px',
                        width: '100%',
                        objectFit: 'cover',
                        borderRadius: 'var(--radius-sm)',
                        display: 'block',
                      }}
                    />
                  ) : (
                    <div>
                      <p style={{ color: 'var(--ink)', margin: '0 0 6px 0' }}>📸</p>
                      <p style={{ color: 'var(--ink)', margin: '0 0 4px 0', fontSize: '12.5px', fontWeight: 600 }}>Click to upload</p>
                      <p style={{ color: 'var(--ink-2)', margin: 0, fontSize: '10.5px' }}>or drag and drop</p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Avatar Photo */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '10.5px',
                fontWeight: 600,
                color: 'var(--ink)',
                marginBottom: '8px',
              }}>
                Avatar Photo
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  disabled={saving}
                  style={{ display: 'none' }}
                  id="avatar-upload"
                />
                <label
                  htmlFor="avatar-upload"
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '32px 16px',
                    border: '2px dashed var(--line)',
                    borderRadius: 'var(--radius-md)',
                    textAlign: 'center',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    backgroundColor: 'transparent',
                    transition: 'all 200ms',
                    opacity: saving ? 0.5 : 1,
                  }}
                  onMouseEnter={(e) => !saving && (e.currentTarget.style.borderColor = 'var(--acc)', e.currentTarget.style.backgroundColor = 'rgba(217, 119, 87, 0.05)')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--line)', e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Avatar Preview"
                      style={{
                        height: '128px',
                        width: '128px',
                        objectFit: 'cover',
                        borderRadius: 'var(--radius-sm)',
                        margin: '0 auto',
                        display: 'block',
                      }}
                    />
                  ) : (
                    <div>
                      <p style={{ color: 'var(--ink)', margin: '0 0 6px 0' }}>📸</p>
                      <p style={{ color: 'var(--ink)', margin: '0 0 4px 0', fontSize: '12.5px', fontWeight: 600 }}>Click to upload</p>
                      <p style={{ color: 'var(--ink-2)', margin: 0, fontSize: '10.5px' }}>or drag and drop</p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Submit */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <button
                type="submit"
                disabled={saving || deleting}
                style={{
                  padding: '12px',
                  background: 'var(--acc)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  cursor: saving || deleting ? 'not-allowed' : 'pointer',
                  opacity: saving || deleting ? 0.7 : 1,
                  transition: 'opacity 200ms',
                  fontSize: '12.5px',
                  fontWeight: 600,
                }}
              >
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={saving || deleting}
                style={{
                  padding: '12px',
                  background: '#dc2626',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  cursor: saving || deleting ? 'not-allowed' : 'pointer',
                  opacity: saving || deleting ? 0.7 : 1,
                  transition: 'opacity 200ms',
                  fontSize: '12.5px',
                  fontWeight: 600,
                }}
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
