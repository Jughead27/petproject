'use client'

import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

interface UserProfile {
  id: string
  username: string | null
  display_name: string | null
  bio: string | null
  avatar_url: string | null
}

export default function EditProfilePage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [user, setUser] = useState<{ id: string } | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isDarkNav, setIsDarkNav] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('nav-theme')
    if (saved) {
      setIsDarkNav(saved === 'dark')
    }
  }, [])

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const supabase = createClient()
        const { data: userData } = await supabase.auth.getUser()
        if (!userData.user) {
          router.push('/login')
          return
        }

        setUser(userData.user as { id: string })

        const { data: profileData } = await supabase
          .from('users')
          .select('*')
          .eq('id', userData.user.id)
          .single()

        if (profileData) {
          setProfile(profileData)
          setDisplayName(profileData.display_name || '')
          setBio(profileData.bio || '')
        }
        setLoading(false)
      } catch (err) {
        console.error('Profile load error:', err)
        setLoading(false)
      }
    }

    loadProfile()
  }, [router])

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setSelectedImage(event.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const triggerImageInput = () => {
    fileInputRef.current?.click()
  }

  const handleSave = async () => {
    if (!user || !profile) return

    setSaving(true)
    try {
      const supabase = createClient()
      let avatarUrl = profile.avatar_url

      // Upload new avatar if selected
      if (selectedImage) {
        const response = await fetch(selectedImage)
        const blob = await response.blob()
        const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' })

        const formData = new FormData()
        formData.append('file', file)
        formData.append('userId', user.id)
        formData.append('folder', 'users/avatars')

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        if (!uploadRes.ok) throw new Error('Upload failed')
        const uploadData = await uploadRes.json()
        avatarUrl = uploadData.url
      }

      // Update profile
      const { error } = await supabase
        .from('users')
        .update({
          display_name: displayName.trim() || null,
          bio: bio.trim() || null,
          avatar_url: avatarUrl,
        })
        .eq('id', user.id)

      if (error) throw error

      router.push('/profile')
    } catch (err) {
      console.error('Save error:', err)
      alert('Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'var(--app-bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <p style={{ color: 'var(--ink-2)' }}>Loading...</p>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--app-bg)',
      paddingBottom: '100px',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '24px',
        paddingTop: '18px',
        borderBottom: '1px solid var(--line)',
      }}>
        <button
          onClick={() => router.back()}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '16px',
            cursor: 'pointer',
            color: 'var(--ink)',
            fontWeight: 500,
            padding: '0',
          }}
        >
          ← Back
        </button>
        <h1 style={{
          fontFamily: '"Instrument Serif", Georgia, serif',
          fontSize: '20px',
          fontWeight: 400,
          fontStyle: 'italic',
          margin: '0',
          color: 'var(--ink)',
        }}>
          Edit Profile
        </h1>
        <div style={{ width: '40px' }} />
      </div>

      {/* Form */}
      <div style={{
        padding: '24px',
        maxWidth: '500px',
        margin: '0 auto',
      }}>
        {/* Avatar Section */}
        <div style={{ marginBottom: '32px' }}>
          <label style={{
            display: 'block',
            fontSize: '11px',
            fontWeight: 600,
            color: 'var(--ink-2)',
            textTransform: 'uppercase',
            marginBottom: '12px',
            letterSpacing: '0.5px',
          }}>
            Avatar
          </label>
          <div
            onClick={triggerImageInput}
            style={{
              width: '120px',
              height: '120px',
              backgroundColor: '#e5e1d7',
              backgroundImage: selectedImage || profile?.avatar_url ? `url(${selectedImage || profile?.avatar_url})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              border: '2px dashed var(--ink-2)',
              borderRadius: '0px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 200ms ease',
              fontSize: '40px',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--ink)')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--ink-2)')}
          >
            {!selectedImage && !profile?.avatar_url && '🐾'}
          </div>
          <p style={{
            fontSize: '12px',
            color: 'var(--ink-2)',
            margin: '8px 0 0 0',
          }}>
            Click to change avatar
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            style={{ display: 'none' }}
          />
        </div>

        {/* Display Name */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            fontSize: '11px',
            fontWeight: 600,
            color: 'var(--ink-2)',
            textTransform: 'uppercase',
            marginBottom: '8px',
            letterSpacing: '0.5px',
          }}>
            Display Name
          </label>
          <input
            type="text"
            placeholder="Your display name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value.slice(0, 50))}
            maxLength={50}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid var(--line)',
              borderRadius: '0px',
              fontSize: '13px',
              fontFamily: 'inherit',
              color: 'var(--ink)',
              boxSizing: 'border-box',
            }}
          />
          <p style={{
            fontSize: '10px',
            color: 'var(--ink-2)',
            margin: '4px 0 0 0',
            textAlign: 'right',
          }}>
            {displayName.length}/50
          </p>
        </div>

        {/* Bio */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            fontSize: '11px',
            fontWeight: 600,
            color: 'var(--ink-2)',
            textTransform: 'uppercase',
            marginBottom: '8px',
            letterSpacing: '0.5px',
          }}>
            Bio
          </label>
          <textarea
            placeholder="Tell us about yourself..."
            value={bio}
            onChange={(e) => setBio(e.target.value.slice(0, 150))}
            maxLength={150}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid var(--line)',
              borderRadius: '0px',
              fontSize: '13px',
              fontFamily: 'inherit',
              color: 'var(--ink)',
              boxSizing: 'border-box',
              resize: 'vertical',
              minHeight: '80px',
            }}
          />
          <p style={{
            fontSize: '10px',
            color: 'var(--ink-2)',
            margin: '4px 0 0 0',
            textAlign: 'right',
          }}>
            {bio.length}/150
          </p>
        </div>

        {/* Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '32px' }}>
          <button
            onClick={() => router.back()}
            disabled={saving}
            style={{
              padding: '12px',
              background: 'var(--paper)',
              border: '1px solid var(--line)',
              borderRadius: '0px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.5 : 1,
              color: 'var(--ink)',
              transition: 'all 160ms ease',
            }}
            onMouseEnter={(e) => !saving && (e.currentTarget.style.background = 'rgba(0, 0, 0, 0.05)')}
            onMouseLeave={(e) => !saving && (e.currentTarget.style.background = 'var(--paper)')}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '12px',
              background: 'var(--acc)',
              color: '#fff',
              border: 'none',
              borderRadius: '0px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.7 : 1,
              transition: 'all 160ms ease',
              boxShadow: '0 4px 12px rgba(8, 145, 178, 0.2)',
            }}
            onMouseEnter={(e) => !saving && (e.currentTarget.style.transform = 'translateY(-2px)', e.currentTarget.style.boxShadow = '0 6px 16px rgba(8, 145, 178, 0.3)')}
            onMouseLeave={(e) => !saving && (e.currentTarget.style.transform = 'translateY(0)', e.currentTarget.style.boxShadow = '0 4px 12px rgba(8, 145, 178, 0.2)')}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '82px',
        paddingTop: '8px',
        paddingBottom: '14px',
        background: isDarkNav ? 'rgba(30, 30, 30, 0.96)' : 'rgba(239, 236, 229, 0.96)',
        backdropFilter: 'blur(20px)',
        borderTop: isDarkNav ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid var(--line)',
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'flex-start',
      }} />
    </div>
  )
}
