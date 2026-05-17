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
    <div style={{
      minHeight: '100vh',
      background: 'var(--app-bg)',
      backgroundImage: `
        radial-gradient(circle at 20% 20%, rgba(217, 119, 87, 0.08), transparent 50%),
        radial-gradient(circle at 80% 80%, rgba(90, 122, 154, 0.06), transparent 50%)
      `,
      paddingBottom: '80px',
    }}>
      <div style={{ maxWidth: '360px', margin: '0 auto', padding: '24px' }}>
        <div style={{ marginBottom: '32px' }}>
          <p className="kicker" style={{ color: 'var(--acc)', marginBottom: '8px' }}>SNOUT</p>
          <h1 className="display-lg" style={{ color: 'var(--ink)', marginBottom: '8px' }}>Create a Pet Card</h1>
          <p className="text-sm" style={{ color: 'var(--ink-2)' }}>Start with the essentials. You can add more details later.</p>
        </div>

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

        <form onSubmit={handleCreatePet} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Pet Name */}
          <div>
            <label htmlFor="name" className="label" style={{ display: 'block', color: 'var(--ink)', marginBottom: '8px' }}>
              Pet Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid var(--line)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--ink)',
                backgroundColor: 'var(--paper)',
                fontSize: '14px',
                opacity: loading ? 0.5 : 1,
              }}
              placeholder="e.g. Luna"
            />
          </div>

          {/* Species */}
          <div>
            <label htmlFor="species" className="label" style={{ display: 'block', color: 'var(--ink)', marginBottom: '8px' }}>
              Species
            </label>
            <select
              id="species"
              value={species}
              onChange={(e) => setSpecies(e.target.value)}
              disabled={loading}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid var(--line)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--ink)',
                backgroundColor: 'var(--paper)',
                fontSize: '14px',
                opacity: loading ? 0.5 : 1,
              }}
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
            <label className="label" style={{ display: 'block', color: 'var(--ink)', marginBottom: '8px' }}>
              Photo
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                disabled={loading}
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
                  cursor: loading ? 'not-allowed' : 'pointer',
                  backgroundColor: 'transparent',
                  transition: 'all 200ms',
                  opacity: loading ? 0.5 : 1,
                }}
                onMouseEnter={(e) => !loading && (e.currentTarget.style.borderColor = 'var(--acc)', e.currentTarget.style.backgroundColor = 'rgba(217, 119, 87, 0.05)')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--line)', e.currentTarget.style.backgroundColor = 'transparent')}
              >
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Preview"
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
                    <p className="display-sm" style={{ color: 'var(--ink)', margin: '0 0 6px 0' }}>📸</p>
                    <p className="button-text" style={{ color: 'var(--ink)', margin: '0 0 4px 0' }}>Click to upload</p>
                    <p className="text-xs" style={{ color: 'var(--ink-2)', margin: 0 }}>or drag and drop</p>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="button-text"
            style={{
              width: '100%',
              padding: '12px',
              marginTop: '8px',
              background: 'var(--acc)',
              color: '#fff',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition: 'opacity 200ms',
            }}
          >
            {loading ? 'Creating card...' : 'Create Pet Card'}
          </button>
        </form>

        <p className="text-xs text-center" style={{ color: 'var(--ink-2)', marginTop: '24px' }}>
          Your pet card will be live immediately. You can edit details anytime.
        </p>
      </div>
    </div>
  )
}
