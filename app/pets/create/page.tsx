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

    if (!name.trim()) {
      setError('Pet name required')
      return
    }

    if (!species) {
      setError('Species required')
      return
    }

    if (!avatarFile) {
      setError('Photo required')
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()

      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) {
        setError('Not authenticated')
        return
      }

      const avatarUrl = await uploadToR2(avatarFile, 'pets/avatars', userData.user.id)

      const { data: speciesCount } = await supabase
        .from('pets')
        .select('id', { count: 'exact' })
        .eq('owner_id', userData.user.id)
        .eq('species', species)

      const cardNumber = (speciesCount?.length || 0) + 1

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
        setError('Failed to create. Try again.')
        return
      }

      if (!newPet) {
        setError('Failed to create')
        return
      }

      router.push(`/pets/${newPet.id}`)
    } catch (err) {
      console.error('Create pet error:', err)
      setError('Something went wrong')
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
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      paddingBottom: '80px',
    }}>
      <div style={{ maxWidth: '400px', width: '100%' }}>
        {/* Header */}
        <div style={{ marginBottom: '40px', textAlign: 'center' }}>
          <p style={{
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '2.5px',
            textTransform: 'uppercase',
            color: 'var(--acc)',
            margin: '0 0 12px 0',
          }}>
            Create
          </p>
          <h1 style={{
            fontFamily: '"Instrument Serif", Georgia, serif',
            fontSize: '32px',
            fontWeight: 400,
            fontStyle: 'italic',
            color: 'var(--ink)',
            margin: '0 0 12px 0',
            lineHeight: 1,
          }}>
            Your Pet
          </h1>
          <p style={{
            fontSize: '13px',
            color: 'var(--ink-2)',
            margin: 0,
          }}>
            Name, species, photo. That's it.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            marginBottom: '24px',
            padding: '14px 16px',
            backgroundColor: 'rgba(220, 38, 38, 0.1)',
            border: '1px solid rgba(220, 38, 38, 0.3)',
            borderRadius: '0px',
            fontSize: '12px',
            color: '#7f1d1d',
          }}>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleCreatePet} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Name */}
          <div>
            <label htmlFor="name" style={{
              display: 'block',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.6px',
              textTransform: 'uppercase',
              color: 'var(--ink)',
              marginBottom: '8px',
            }}>
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
                padding: '14px 16px',
                border: '2px solid var(--line)',
                borderRadius: '0px',
                color: 'var(--ink)',
                backgroundColor: 'var(--paper)',
                fontSize: '14px',
                fontWeight: 500,
                opacity: loading ? 0.5 : 1,
              }}
              placeholder="Luna"
            />
          </div>

          {/* Species */}
          <div>
            <label htmlFor="species" style={{
              display: 'block',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.6px',
              textTransform: 'uppercase',
              color: 'var(--ink)',
              marginBottom: '8px',
            }}>
              Species
            </label>
            <select
              id="species"
              value={species}
              onChange={(e) => setSpecies(e.target.value)}
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px 16px',
                border: '2px solid var(--line)',
                borderRadius: '0px',
                color: 'var(--ink)',
                backgroundColor: 'var(--paper)',
                fontSize: '14px',
                fontWeight: 500,
                opacity: loading ? 0.5 : 1,
              }}
            >
              <option value="">Choose...</option>
              {SPECIES_LIST.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Photo */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.6px',
              textTransform: 'uppercase',
              color: 'var(--ink)',
              marginBottom: '8px',
            }}>
              Photo
            </label>
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
                padding: '32px 20px',
                border: '2px dashed var(--line)',
                borderRadius: '0px',
                textAlign: 'center',
                cursor: loading ? 'not-allowed' : 'pointer',
                backgroundColor: 'var(--paper)',
                transition: 'all 180ms',
                opacity: loading ? 0.5 : 1,
              }}
              onMouseEnter={(e) => !loading && (e.currentTarget.style.borderColor = 'var(--acc)', e.currentTarget.style.backgroundColor = 'rgba(217, 119, 87, 0.05)')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--line)', e.currentTarget.style.backgroundColor = 'var(--paper)')}
            >
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Preview"
                  style={{
                    height: '140px',
                    width: '140px',
                    objectFit: 'cover',
                    borderRadius: '0px',
                    margin: '0 auto',
                    display: 'block',
                    border: '2px solid var(--line)',
                  }}
                />
              ) : (
                <div>
                  <p style={{ fontSize: '32px', margin: '0 0 8px 0' }}>📸</p>
                  <p style={{ color: 'var(--ink)', margin: '0 0 4px 0', fontWeight: 600, fontSize: '13px' }}>Upload photo</p>
                  <p style={{ color: 'var(--ink-2)', margin: 0, fontSize: '12px' }}>JPG, PNG</p>
                </div>
              )}
            </label>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '18px 20px',
              marginTop: '12px',
              background: 'var(--acc)',
              color: '#fff',
              border: 'none',
              borderRadius: '0px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition: 'all 180ms ease',
              fontSize: '14px',
              fontWeight: 700,
              letterSpacing: '0.5px',
              boxShadow: '0 8px 24px rgba(217, 119, 87, 0.3)',
            }}
            onMouseEnter={(e) => !loading && (e.currentTarget.style.transform = 'translateY(-2px)', e.currentTarget.style.boxShadow = '0 12px 32px rgba(217, 119, 87, 0.4)')}
            onMouseLeave={(e) => !loading && (e.currentTarget.style.transform = 'translateY(0)', e.currentTarget.style.boxShadow = '0 8px 24px rgba(217, 119, 87, 0.3)')}
          >
            {loading ? 'Creating...' : 'Create'}
          </button>
        </form>
      </div>
    </div>
  )
}
