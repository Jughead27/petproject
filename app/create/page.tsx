'use client'

import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

interface Pet {
  id: string
  name: string
  species: string
  avatar_url: string | null
}

export default function CreatePage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [user, setUser] = useState<{ id: string } | null>(null)
  const [pets, setPets] = useState<Pet[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null)
  const [showNewPetForm, setShowNewPetForm] = useState(false)
  const [newPetName, setNewPetName] = useState('')
  const [newPetSpecies, setNewPetSpecies] = useState('')
  const [caption, setCaption] = useState('')
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    const loadPets = async () => {
      try {
        const supabase = createClient()
        const { data: userData } = await supabase.auth.getUser()
        if (!userData.user) {
          router.push('/login')
          return
        }
        setUser(userData.user as { id: string })

        const { data: petsData } = await supabase
          .from('pets')
          .select('id, name, species, avatar_url')
          .eq('owner_id', userData.user.id)
          .order('created_at', { ascending: false })

        setPets(petsData || [])
        if (petsData && petsData.length > 0) {
          setSelectedPetId(petsData[0].id)
        }
        setLoading(false)
      } catch (err) {
        console.error('Pet load error:', err)
        setLoading(false)
      }
    }

    loadPets()
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

  const handlePost = async () => {
    if (!selectedImage || !user) return

    const isNewPet = showNewPetForm
    if (isNewPet && (!newPetName.trim() || !newPetSpecies.trim())) {
      alert('Please enter pet name and species')
      return
    }
    if (!isNewPet && !selectedPetId) {
      alert('Please select a pet')
      return
    }

    setUploading(true)
    try {
      const supabase = createClient()

      // Convert data URL to blob
      const response = await fetch(selectedImage)
      const blob = await response.blob()
      const file = new File([blob], 'image.jpg', { type: 'image/jpeg' })

      // Upload to R2
      const formData = new FormData()
      formData.append('file', file)
      formData.append('userId', user.id)

      let imageUrl: string
      let petId: string

      if (isNewPet) {
        // Upload as avatar
        formData.append('folder', 'pets/avatars')
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })
        if (!uploadRes.ok) throw new Error('Upload failed')
        const uploadData = await uploadRes.json()
        imageUrl = uploadData.url

        // Create new pet
        const { data: petData, error: petError } = await supabase
          .from('pets')
          .insert({
            name: newPetName.trim(),
            species: newPetSpecies,
            owner_id: user.id,
            avatar_url: imageUrl,
            caption: caption.trim() || null,
          })
          .select()
          .single()

        if (petError) throw petError
        petId = petData.id
      } else {
        // Upload as cover photo
        formData.append('folder', 'pets/covers')
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })
        if (!uploadRes.ok) throw new Error('Upload failed')
        const uploadData = await uploadRes.json()
        imageUrl = uploadData.url

        // Update existing pet with new photo and caption
        const { error: updateError } = await supabase
          .from('pets')
          .update({
            cover_photo_url: imageUrl,
            caption: caption.trim() || null,
          })
          .eq('id', selectedPetId)

        if (updateError) throw updateError
        petId = selectedPetId!
      }

      setCaption('')
      router.push(`/pets/${petId}`)
    } catch (err) {
      console.error('Upload error:', err)
      alert('Upload failed')
    } finally {
      setUploading(false)
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
      display: 'flex',
      flexDirection: 'column',
      paddingBottom: '100px',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 20px',
        borderBottom: '1px solid var(--line)',
        background: 'var(--paper)',
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
          }}
        >
          ← Back
        </button>
        <h1 style={{
          fontFamily: '"Instrument Serif", Georgia, serif',
          fontSize: '18px',
          fontWeight: 400,
          fontStyle: 'italic',
          margin: 0,
          color: 'var(--ink)',
        }}>
          Create Post
        </h1>
        <div style={{ width: '40px' }} />
      </div>

      {/* Main Content */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 20px',
        gap: '24px',
      }}>
        {/* Image Upload Area */}
        <div
          onClick={triggerImageInput}
          style={{
            aspectRatio: '1',
            backgroundColor: selectedImage ? 'transparent' : '#e5e1d7',
            backgroundImage: selectedImage ? `url(${selectedImage})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            border: selectedImage ? 'none' : '2px dashed var(--ink-2)',
            borderRadius: '0px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 200ms ease',
          }}
          onMouseEnter={(e) => !selectedImage && (e.currentTarget.style.borderColor = 'var(--ink)')}
          onMouseLeave={(e) => !selectedImage && (e.currentTarget.style.borderColor = 'var(--ink-2)')}
        >
          {!selectedImage && (
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '40px', margin: '0 0 8px 0' }}>📷</p>
              <p style={{ color: 'var(--ink-2)', fontSize: '13px', margin: 0 }}>
                Tap to select photo
              </p>
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          style={{ display: 'none' }}
        />

        {selectedImage && (
          <>
            {/* Pet Selector */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label style={{
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--ink-2)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
                Which pet is this?
              </label>

              {pets.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {pets.map(pet => (
                    <button
                      key={pet.id}
                      onClick={() => {
                        setSelectedPetId(pet.id)
                        setShowNewPetForm(false)
                      }}
                      style={{
                        padding: '12px 14px',
                        background: selectedPetId === pet.id ? 'var(--acc)' : 'var(--paper)',
                        color: selectedPetId === pet.id ? '#fff' : 'var(--ink)',
                        border: selectedPetId === pet.id ? 'none' : '1px solid var(--line)',
                        borderRadius: '0px',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 160ms ease',
                      }}
                      onMouseEnter={(e) => {
                        if (selectedPetId !== pet.id) {
                          e.currentTarget.style.borderColor = 'var(--ink)'
                          e.currentTarget.style.background = 'rgba(8, 145, 178, 0.05)'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedPetId !== pet.id) {
                          e.currentTarget.style.borderColor = 'var(--line)'
                          e.currentTarget.style.background = 'var(--paper)'
                        }
                      }}
                    >
                      {pet.name}
                    </button>
                  ))}
                </div>
              )}

              <button
                onClick={() => {
                  setShowNewPetForm(!showNewPetForm)
                  setSelectedPetId(null)
                }}
                style={{
                  padding: '12px 14px',
                  background: showNewPetForm ? 'var(--acc)' : 'var(--paper)',
                  color: showNewPetForm ? '#fff' : 'var(--ink)',
                  border: showNewPetForm ? 'none' : '1px solid var(--line)',
                  borderRadius: '0px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 160ms ease',
                }}
                onMouseEnter={(e) => {
                  if (!showNewPetForm) {
                    e.currentTarget.style.borderColor = 'var(--ink)'
                    e.currentTarget.style.background = 'rgba(8, 145, 178, 0.05)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!showNewPetForm) {
                    e.currentTarget.style.borderColor = 'var(--line)'
                    e.currentTarget.style.background = 'var(--paper)'
                  }
                }}
              >
                ➕ Create New Pet
              </button>
            </div>

            {/* New Pet Form */}
            {showNewPetForm && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <input
                  type="text"
                  placeholder="Pet name"
                  value={newPetName}
                  onChange={(e) => setNewPetName(e.target.value)}
                  style={{
                    padding: '10px 12px',
                    border: '1px solid var(--line)',
                    borderRadius: '0px',
                    fontSize: '13px',
                    fontFamily: 'inherit',
                    color: 'var(--ink)',
                  }}
                />
                <select
                  value={newPetSpecies}
                  onChange={(e) => setNewPetSpecies(e.target.value)}
                  style={{
                    padding: '10px 12px',
                    border: '1px solid var(--line)',
                    borderRadius: '0px',
                    fontSize: '13px',
                    fontFamily: 'inherit',
                    color: 'var(--ink)',
                    background: 'var(--paper)',
                  }}
                >
                  <option value="">Select species</option>
                  <option value="Dog">Dog</option>
                  <option value="Cat">Cat</option>
                  <option value="Rabbit">Rabbit</option>
                  <option value="Bird">Bird</option>
                  <option value="Fish">Fish</option>
                  <option value="Reptile">Reptile</option>
                  <option value="Hamster">Hamster</option>
                  <option value="Guinea Pig">Guinea Pig</option>
                  <option value="Horse">Horse</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            )}

            {/* Caption Input */}
            {selectedImage && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--ink-2)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}>
                  Caption (optional)
                </label>
                <textarea
                  placeholder="Add a single sentence to describe this moment..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value.slice(0, 150))}
                  maxLength={150}
                  style={{
                    padding: '10px 12px',
                    border: '1px solid var(--line)',
                    borderRadius: '0px',
                    fontSize: '13px',
                    fontFamily: 'inherit',
                    color: 'var(--ink)',
                    resize: 'vertical',
                    minHeight: '60px',
                  }}
                />
                <p style={{
                  fontSize: '10px',
                  color: 'var(--ink-2)',
                  margin: '0',
                  textAlign: 'right',
                }}>
                  {caption.length}/150
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Action Button */}
      {selectedImage && (
        <div style={{
          position: 'fixed',
          bottom: '90px',
          left: '20px',
          right: '20px',
        }}>
          <button
            onClick={handlePost}
            disabled={uploading}
            style={{
              width: '100%',
              padding: '14px',
              background: 'var(--acc)',
              color: '#fff',
              border: 'none',
              borderRadius: '0px',
              fontSize: '13px',
              fontWeight: 600,
              letterSpacing: '0.4px',
              cursor: uploading ? 'not-allowed' : 'pointer',
              opacity: uploading ? 0.7 : 1,
              transition: 'all 160ms ease',
              boxShadow: '0 4px 12px rgba(8, 145, 178, 0.2)',
            }}
            onMouseEnter={(e) => !uploading && (e.currentTarget.style.transform = 'translateY(-2px)', e.currentTarget.style.boxShadow = '0 6px 16px rgba(8, 145, 178, 0.3)')}
            onMouseLeave={(e) => !uploading && (e.currentTarget.style.transform = 'translateY(0)', e.currentTarget.style.boxShadow = '0 4px 12px rgba(8, 145, 178, 0.2)')}
          >
            {uploading ? 'Posting...' : 'Post'}
          </button>
        </div>
      )}
    </div>
  )
}
