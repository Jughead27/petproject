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
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      paddingBottom: '80px',
    }}>
      <div style={{ maxWidth: '420px', width: '100%' }}>
        {/* Header */}
        <div style={{ marginBottom: '36px', textAlign: 'center' }}>
          <p style={{
            fontSize: '10px',
            fontWeight: 700,
            letterSpacing: '2px',
            textTransform: 'uppercase',
            color: 'var(--acc)',
            margin: '0 0 10px 0',
          }}>
            Create
          </p>
          <h1 style={{
            fontFamily: '"Instrument Serif", Georgia, serif',
            fontSize: '36px',
            fontWeight: 400,
            fontStyle: 'italic',
            color: 'var(--ink)',
            margin: '0 0 8px 0',
            lineHeight: 1.1,
          }}>
            Your Pet Card
          </h1>
          <p style={{
            fontSize: '12px',
            color: 'var(--ink-2)',
            margin: 0,
          }}>
            Name, species, and a photo
          </p>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            marginBottom: '22px',
            padding: '12px 14px',
            backgroundColor: 'rgba(220, 38, 38, 0.08)',
            border: '1px solid rgba(220, 38, 38, 0.25)',
            borderRadius: '0px',
            fontSize: '12px',
            color: '#7f1d1d',
          }}>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleCreatePet} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Name */}
          <div>
            <label htmlFor="name" style={{
              display: 'block',
              fontSize: '10px',
              fontWeight: 600,
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              color: 'var(--ink)',
              marginBottom: '6px',
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
                padding: '11px 14px',
                border: '1px solid var(--line)',
                borderRadius: '0px',
                color: 'var(--ink)',
                backgroundColor: 'var(--paper)',
                fontSize: '13px',
                fontWeight: 500,
                opacity: loading ? 0.5 : 1,
                transition: 'all 160ms ease',
                boxSizing: 'border-box',
              }}
              placeholder="Luna"
            />
          </div>

          {/* Species */}
          <div>
            <label htmlFor="species" style={{
              display: 'block',
              fontSize: '10px',
              fontWeight: 600,
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              color: 'var(--ink)',
              marginBottom: '6px',
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
                padding: '11px 14px',
                border: '1px solid var(--line)',
                borderRadius: '0px',
                color: 'var(--ink)',
                backgroundColor: 'var(--paper)',
                fontSize: '13px',
                fontWeight: 500,
                opacity: loading ? 0.5 : 1,
                boxSizing: 'border-box',
              }}
            >
              <option value="">Choose one...</option>
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
              fontSize: '10px',
              fontWeight: 600,
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              color: 'var(--ink)',
              marginBottom: '6px',
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
                padding: '28px 20px',
                border: '1.5px dashed var(--line)',
                borderRadius: '0px',
                textAlign: 'center',
                cursor: loading ? 'not-allowed' : 'pointer',
                backgroundColor: 'var(--paper)',
                transition: 'all 160ms',
                opacity: loading ? 0.5 : 1,
              }}
              onMouseEnter={(e) => !loading && (e.currentTarget.style.borderColor = 'var(--acc)', e.currentTarget.style.backgroundColor = 'rgba(217, 119, 87, 0.03)')}
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
                    border: '1px solid var(--line)',
                    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.08)',
                  }}
                />
              ) : (
                <div>
                  <p style={{ fontSize: '28px', margin: '0 0 8px 0' }}>📸</p>
                  <p style={{ color: 'var(--ink)', margin: '0 0 3px 0', fontWeight: 500, fontSize: '12px' }}>Upload a photo</p>
                  <p style={{ color: 'var(--ink-2)', margin: 0, fontSize: '11px' }}>JPG, PNG, or similar</p>
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
              padding: '14px 20px',
              marginTop: '8px',
              background: 'var(--acc)',
              color: '#fff',
              border: 'none',
              borderRadius: '0px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition: 'all 160ms ease',
              fontSize: '13px',
              fontWeight: 600,
              letterSpacing: '0.5px',
              boxShadow: '0 4px 12px rgba(217, 119, 87, 0.25)',
            }}
            onMouseEnter={(e) => !loading && (e.currentTarget.style.transform = 'translateY(-2px)', e.currentTarget.style.boxShadow = '0 6px 16px rgba(217, 119, 87, 0.35)')}
            onMouseLeave={(e) => !loading && (e.currentTarget.style.transform = 'translateY(0)', e.currentTarget.style.boxShadow = '0 4px 12px rgba(217, 119, 87, 0.25)')}
          >
            {loading ? 'Creating...' : 'Create Pet Card'}
          </button>
        </form>
      </div>
    </div>
  )
}
