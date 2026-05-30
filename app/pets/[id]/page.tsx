'use client'

import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'

interface Pet {
  id: string
  name: string
  species: string
  breed: string | null
  avatar_url: string | null
  cover_photo_url: string | null
  age_years: number | null
  age_months: number | null
  bio: string | null
  card_number: number | null
  owner_id: string
  is_hidden: boolean | null
}

export default function PetCardPage() {
  const router = useRouter()
  const params = useParams()
  const petId = params.id as string
  const [pet, setPet] = useState<Pet | null>(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<{ id: string } | null>(null)
  const [isOwner, setIsOwner] = useState(false)
  const [isDarkNav, setIsDarkNav] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [reportText, setReportText] = useState('')
  const [reportingLoading, setReportingLoading] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('nav-theme')
    if (saved) {
      setIsDarkNav(saved === 'dark')
    }
  }, [])

  useEffect(() => {
    const loadPet = async () => {
      try {
        const supabase = createClient()
        const { data: userData } = await supabase.auth.getUser()
        if (!userData.user) {
          router.push('/login')
          return
        }
        setUser(userData.user as { id: string })

        const { data: petData } = await supabase
          .from('pets')
          .select('*')
          .eq('id', petId)
          .single()

        if (petData) {
          const isOwner = petData.owner_id === userData.user.id

          // Check if pet is hidden and user is not owner
          if (petData.is_hidden && !isOwner) {
            router.push('/stack')
            return
          }

          setPet(petData)
          setIsOwner(isOwner)
        }
        setLoading(false)
      } catch (err) {
        console.error('Pet load error:', err)
        setLoading(false)
      }
    }

    loadPet()
  }, [petId, router])

  const handleReport = async () => {
    if (!reportReason.trim() || !user || !pet) {
      alert('Please select a reason')
      return
    }

    setReportingLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from('reports').insert({
        reporter_id: user.id,
        reported_pet_id: pet.id,
        reason: reportReason,
        additional_info: reportText.trim() || null,
        status: 'pending',
      })

      if (error) throw error
      setShowReportModal(false)
      setReportReason('')
      setReportText('')
      alert('Thank you for reporting. Our team will review this.')
    } catch (err) {
      console.error('Report error:', err)
      alert('Failed to submit report')
    } finally {
      setReportingLoading(false)
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

  if (!pet) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'var(--app-bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '32px', marginBottom: '16px' }}>🐾</p>
          <h1 style={{
            fontFamily: '"Instrument Serif", Georgia, serif',
            fontSize: '28px',
            fontWeight: 400,
            fontStyle: 'italic',
            color: 'var(--ink)',
            marginBottom: '16px',
            lineHeight: 1,
          }}>
            Pet not found
          </h1>
          <Link href="/stack" style={{ color: 'var(--acc)', fontSize: '12px', fontWeight: 500 }}>
            ← Back to Stack
          </Link>
        </div>
      </div>
    )
  }

  const ageDisplay = pet.age_years !== null
    ? `${pet.age_years}y ${pet.age_months || 0}m`
    : null

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--app-bg)',
      paddingBottom: '100px',
    }}>
      {/* Hero Section */}
      <div style={{
        height: '240px',
        backgroundColor: '#e5e1d7',
        backgroundImage: pet.cover_photo_url ? `url(${pet.cover_photo_url})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Gradient Overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to bottom, transparent 30%, rgba(250, 250, 247, 0.7) 80%, rgba(250, 250, 247, 1))',
          pointerEvents: 'none',
        }} />

        {/* Header Controls */}
        <div style={{
          position: 'absolute',
          top: '14px',
          left: '16px',
          right: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 10,
        }}>
          <button
            onClick={() => router.back()}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '0px',
              background: 'rgba(0, 0, 0, 0.3)',
              color: '#fff',
              border: 'none',
              backdropFilter: 'blur(10px)',
              fontSize: '16px',
              cursor: 'pointer',
              transition: 'all 160ms ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0, 0, 0, 0.4)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(0, 0, 0, 0.3)')}
          >
            ←
          </button>

          {pet.card_number && (
            <div style={{
              padding: '6px 12px',
              borderRadius: '0px',
              background: 'rgba(0, 0, 0, 0.35)',
              backdropFilter: 'blur(8px)',
            }}>
              <p style={{ color: '#fff', letterSpacing: '1px', fontSize: '9px', fontWeight: 700, margin: 0 }}>
                #{String(pet.card_number).padStart(3, '0')}
              </p>
            </div>
          )}

          {isOwner && (
            <Link
              href={`/pets/${petId}/edit`}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '0px',
                background: 'var(--acc)',
                color: '#fff',
                border: 'none',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textDecoration: 'none',
                cursor: 'pointer',
                transition: 'all 160ms ease',
                boxShadow: '0 4px 10px rgba(8, 145, 178, 0.2)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)', e.currentTarget.style.boxShadow = '0 6px 14px rgba(8, 145, 178, 0.3)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)', e.currentTarget.style.boxShadow = '0 4px 10px rgba(8, 145, 178, 0.2)')}
            >
              ✎
            </Link>
          )}
        </div>

        {/* Avatar Overlay */}
        <div style={{
          position: 'absolute',
          bottom: '-44px',
          left: '16px',
          width: '88px',
          height: '88px',
          borderRadius: '0px',
          border: '3px solid var(--paper)',
          backgroundColor: '#e5e1d7',
          backgroundImage: pet.avatar_url ? `url(${pet.avatar_url})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 5,
          boxShadow: '0 8px 20px rgba(0, 0, 0, 0.12)',
        }}>
          {!pet.avatar_url && <span style={{ fontSize: '40px' }}>🐾</span>}
        </div>
      </div>

      {/* Content Panel */}
      <div style={{
        marginTop: '-44px',
        paddingTop: '52px',
        paddingLeft: '16px',
        paddingRight: '16px',
        paddingBottom: '24px',
        borderTopLeftRadius: '12px',
        borderTopRightRadius: '12px',
        backgroundColor: 'var(--paper)',
        position: 'relative',
        zIndex: 4,
      }}>
        {/* Pet Info */}
        <div style={{ marginBottom: '20px' }}>
          <h1 style={{
            fontFamily: '"Instrument Serif", Georgia, serif',
            fontSize: '36px',
            fontWeight: 400,
            fontStyle: 'italic',
            color: 'var(--ink)',
            lineHeight: 1,
            margin: '0 0 6px 0',
          }}>
            {pet.name}
          </h1>
          <p style={{
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.5px',
            color: 'var(--ink-2)',
            lineHeight: 1,
            margin: 0,
            textTransform: 'uppercase',
          }}>
            {pet.species}{pet.breed ? ` · ${pet.breed}` : ''}
          </p>
          {ageDisplay && (
            <p style={{
              fontSize: '12px',
              fontWeight: 400,
              color: 'var(--ink-2)',
              lineHeight: 1.4,
              margin: '4px 0 0 0',
            }}>
              {ageDisplay} old
            </p>
          )}
        </div>

        {/* Bio */}
        {pet.bio && (
          <div style={{
            padding: '12px 14px',
            borderLeft: '3px solid var(--acc)',
            backgroundColor: 'rgba(217, 119, 87, 0.06)',
            borderRadius: '0px',
            marginBottom: '20px',
          }}>
            <p style={{
              fontSize: '12px',
              fontWeight: 400,
              color: 'var(--ink)',
              fontStyle: 'italic',
              lineHeight: 1.6,
              margin: 0,
            }}>
              "{pet.bio}"
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
          <button style={{
            padding: '12px 16px',
            borderRadius: '0px',
            background: 'var(--ink)',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 600,
            letterSpacing: '0.4px',
            transition: 'all 160ms ease',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)', e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.2)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)', e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)')}
          >
            Follow
          </button>
          <button style={{
            padding: '12px 16px',
            borderRadius: '0px',
            background: 'var(--acc)',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 600,
            letterSpacing: '0.4px',
            transition: 'all 160ms ease',
            boxShadow: '0 4px 12px rgba(217, 119, 87, 0.2)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)', e.currentTarget.style.boxShadow = '0 6px 16px rgba(217, 119, 87, 0.3)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)', e.currentTarget.style.boxShadow = '0 4px 12px rgba(217, 119, 87, 0.2)')}
          >
            Send treat
          </button>
        </div>

        {/* Flag Link - only show if not owner */}
        {!isOwner && (
          <button
            onClick={() => setShowReportModal(true)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--ink-2)',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: 400,
              textDecoration: 'none',
              letterSpacing: '0.4px',
              transition: 'color 160ms ease',
              padding: '6px 0',
              textAlign: 'left',
              opacity: 0.7,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--acc)', e.currentTarget.style.opacity = '1')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--ink-2)', e.currentTarget.style.opacity = '0.7')}
          >
            ⋯ Report
          </button>
        )}

      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'flex-end',
          zIndex: 1000,
        }} onClick={() => !reportingLoading && setShowReportModal(false)}>
          <div style={{
            width: '100%',
            maxHeight: '80vh',
            background: 'var(--paper)',
            borderTopLeftRadius: '16px',
            borderTopRightRadius: '16px',
            padding: '24px',
            boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.15)',
          }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{
              fontFamily: '"Instrument Serif", Georgia, serif',
              fontSize: '20px',
              fontWeight: 400,
              fontStyle: 'italic',
              margin: '0 0 16px 0',
              color: 'var(--ink)',
            }}>
              Report this pet
            </h2>

            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--ink-2)',
                textTransform: 'uppercase',
                marginBottom: '8px',
                letterSpacing: '0.5px',
              }}>
                Why are you reporting this?
              </label>
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid var(--line)',
                  borderRadius: '0px',
                  fontSize: '13px',
                  fontFamily: 'inherit',
                  color: 'var(--ink)',
                  background: 'var(--paper)',
                  cursor: 'pointer',
                }}
              >
                <option value="">Select a reason...</option>
                <option value="spam">Spam or scam</option>
                <option value="inappropriate">Inappropriate content</option>
                <option value="harassment">Harassment or bullying</option>
                <option value="politics">Political content</option>
                <option value="no_pets">No pets in photo</option>
                <option value="other">Something else</option>
              </select>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--ink-2)',
                textTransform: 'uppercase',
                marginBottom: '8px',
                letterSpacing: '0.5px',
              }}>
                Additional details (optional)
              </label>
              <textarea
                placeholder="Please provide any additional context..."
                value={reportText}
                onChange={(e) => setReportText(e.target.value.slice(0, 500))}
                maxLength={500}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid var(--line)',
                  borderRadius: '0px',
                  fontSize: '13px',
                  fontFamily: 'inherit',
                  color: 'var(--ink)',
                  resize: 'vertical',
                  minHeight: '60px',
                  boxSizing: 'border-box',
                }}
              />
              <p style={{
                fontSize: '10px',
                color: 'var(--ink-2)',
                margin: '4px 0 0 0',
                textAlign: 'right',
              }}>
                {reportText.length}/500
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <button
                onClick={() => !reportingLoading && setShowReportModal(false)}
                disabled={reportingLoading}
                style={{
                  padding: '12px',
                  background: 'var(--paper)',
                  border: '1px solid var(--line)',
                  borderRadius: '0px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: reportingLoading ? 'not-allowed' : 'pointer',
                  opacity: reportingLoading ? 0.5 : 1,
                  color: 'var(--ink)',
                  transition: 'all 160ms ease',
                }}
                onMouseEnter={(e) => !reportingLoading && (e.currentTarget.style.background = 'rgba(0, 0, 0, 0.05)')}
                onMouseLeave={(e) => !reportingLoading && (e.currentTarget.style.background = 'var(--paper)')}
              >
                Cancel
              </button>
              <button
                onClick={handleReport}
                disabled={reportingLoading || !reportReason.trim()}
                style={{
                  padding: '12px',
                  background: reportReason.trim() ? 'var(--acc)' : 'var(--ink-2)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '0px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: reportingLoading || !reportReason.trim() ? 'not-allowed' : 'pointer',
                  opacity: reportingLoading ? 0.7 : 1,
                  transition: 'all 160ms ease',
                  boxShadow: reportReason.trim() ? '0 4px 12px rgba(8, 145, 178, 0.2)' : 'none',
                }}
                onMouseEnter={(e) => !reportingLoading && reportReason.trim() && (e.currentTarget.style.transform = 'translateY(-2px)', e.currentTarget.style.boxShadow = '0 6px 16px rgba(8, 145, 178, 0.3)')}
                onMouseLeave={(e) => !reportingLoading && reportReason.trim() && (e.currentTarget.style.transform = 'translateY(0)', e.currentTarget.style.boxShadow = '0 4px 12px rgba(8, 145, 178, 0.2)')}
              >
                {reportingLoading ? 'Reporting...' : 'Submit Report'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab Bar */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '76px',
        paddingTop: '8px',
        paddingBottom: '12px',
        background: isDarkNav ? 'rgba(30, 30, 30, 0.92)' : 'rgba(250, 250, 247, 0.92)',
        backdropFilter: 'blur(16px)',
        borderTop: isDarkNav ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid var(--line)',
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'flex-start',
      }}>
        {[
          { icon: 'explore', label: 'Explore', href: '/stack', active: false },
          { icon: 'pawparazzi', label: 'Pawparazzi', href: '/pawparazzi', active: false },
          { icon: 'create', label: 'Create', href: '/create', active: false },
          { icon: 'profile', label: 'Profile', href: '/profile', active: false },
        ].map(tab => (
          <Link
            key={tab.label}
            href={tab.href}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '3px',
              textDecoration: 'none',
              opacity: tab.active ? 1 : 0.5,
              transition: 'opacity 160ms',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.75')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = tab.active ? '1' : '0.5')}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style={{ color: tab.active ? 'var(--acc)' : (isDarkNav ? '#fff' : 'var(--ink)') }}>
              {tab.icon === 'explore' && (
                <>
                  <ellipse cx="12" cy="16.2" rx="5" ry="4.3"/>
                  <circle cx="5.4" cy="11.2" r="2.05"/>
                  <circle cx="9.5" cy="7.6" r="2.25"/>
                  <circle cx="14.5" cy="7.6" r="2.25"/>
                  <circle cx="18.6" cy="11.2" r="2.05"/>
                </>
              )}
              {tab.icon === 'pawparazzi' && (
                <>
                  <ellipse cx="4.0" cy="15.6" rx="2.5" ry="4.5"/>
                  <ellipse cx="5.2" cy="14.0" rx="1.8" ry="3.6"/>
                  <rect x="4.6" y="16" width="2.0" height="4.4"/>
                  <circle cx="5.2" cy="9.6" r="2.1"/>
                  <polygon points="3.8,5.9 5.0,7.8 3.5,7.9"/>
                  <polygon points="6.3,5.9 6.9,7.9 5.4,7.8"/>
                  <path d="M1.9,20 C0.6,18.4 0.9,14.6 2.6,14 C1.7,15.2 1.9,18 3.0,19.2 Z"/>
                  <ellipse cx="9.8" cy="16.3" rx="2.6" ry="3.5"/>
                  <ellipse cx="11.4" cy="14.4" rx="2.6" ry="3.0"/>
                  <rect x="12.2" y="12" width="1.9" height="8.5"/>
                  <ellipse cx="12.6" cy="11.6" rx="1.5" ry="2.1"/>
                  <circle cx="13.4" cy="9.5" r="2.0"/>
                  <ellipse cx="12.5" cy="9.7" rx="0.95" ry="1.7"/>
                  <polygon points="14.9,9.1 16.6,10.0 14.9,10.8"/>
                  <polygon points="7.9,15 6.8,12.6 8.4,13.9"/>
                  <ellipse cx="19.2" cy="14.8" rx="2.4" ry="3.1"/>
                  <circle cx="20.5" cy="11.0" r="1.6"/>
                  <polygon points="21.9,10.9 23.1,11.5 21.8,11.8"/>
                  <polygon points="17.0,16.6 16.7,18.7 18.6,17.2"/>
                  <rect x="18.6" y="17.4" width="0.55" height="2.9"/>
                  <rect x="19.8" y="17.4" width="0.55" height="2.9"/>
                </>
              )}
              {tab.icon === 'create' && (
                <>
                  <circle cx="5.4" cy="11.2" r="2.05"/>
                  <circle cx="9.5" cy="7.6" r="2.25"/>
                  <circle cx="14.5" cy="7.6" r="2.25"/>
                  <circle cx="18.6" cy="11.2" r="2.05"/>
                  <path fillRule="evenodd" d="M7,16.2 a5,4.3 0 1,0 10,0 a5,4.3 0 1,0 -10,0 Z M10.85,13.2 L13.15,13.2 L13.15,15.05 L15,15.05 L15,17.35 L13.15,17.35 L13.15,19.2 L10.85,19.2 L10.85,17.35 L9,17.35 L9,15.05 L10.85,15.05 Z"/>
                </>
              )}
              {tab.icon === 'profile' && (
                <>
                  <path fillRule="evenodd" d="M4.6,3.4 L8.8,6.6 L15.2,6.6 L19.4,3.4 Q18.8,7 18,9.2 Q17,13.5 12,18.8 Q7,13.5 6,9.2 Q5.2,7 4.6,3.4 Z M8.85,11.2 a1.15,1.15 0 1,0 2.3,0 a1.15,1.15 0 1,0 -2.3,0 Z M12.85,11.2 a1.15,1.15 0 1,0 2.3,0 a1.15,1.15 0 1,0 -2.3,0 Z"/>
                </>
              )}
            </svg>
            <span style={{
              fontSize: '9px',
              fontWeight: 600,
              color: tab.active ? 'var(--acc)' : (isDarkNav ? '#fff' : 'var(--ink)'),
              letterSpacing: '0.4px',
            }}>
              {tab.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
