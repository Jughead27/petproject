'use client'

import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface Pet {
  id: string
  name: string
  species: string
  breed: string | null
  avatar_url: string | null
  cover_url: string | null
  bio: string | null
  caption: string | null
  owner_id: string
}

export default function StackPage() {
  const router = useRouter()
  const [pets, setPets] = useState<Pet[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<{ id: string } | null>(null)
  const [isFollowing, setIsFollowing] = useState(false)
  const [followerCount, setFollowerCount] = useState(0)
  const [loadingFollow, setLoadingFollow] = useState(false)
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

  // Check onboarding status immediately
  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const supabase = createClient()
        const { data: userData } = await supabase.auth.getUser()
        if (!userData.user) return

        const { count } = await supabase
          .from('pets')
          .select('id', { count: 'exact', head: true })
          .eq('owner_id', userData.user.id)

        console.log('[Stack] Onboarding check - user pets count:', count)
        if (!count || count === 0) {
          console.log('[Stack] No pets found, redirecting to /onboarding')
          router.push('/onboarding')
        } else {
          console.log('[Stack] User has pets, allowing stack access')
        }
      } catch (err) {
        console.error('Onboarding check error:', err)
      }
    }

    checkOnboarding()
  }, [router])

  // Load pets
  useEffect(() => {
    const loadStack = async () => {
      try {
        const supabase = createClient()
        const { data: userData } = await supabase.auth.getUser()
        if (!userData.user) {
          router.push('/login')
          return
        }

        setUser(userData.user as { id: string })

        const { data: allPets } = await supabase
          .from('pets')
          .select('*')
          .eq('is_hidden', false)
          .order('created_at', { ascending: false })

        setPets(allPets || [])
        setLoading(false)
      } catch (err) {
        console.error('Stack load error:', err)
        setLoading(false)
      }
    }

    loadStack()
  }, [router])

  // Load follow state and follower count
  useEffect(() => {
    const loadFollowState = async () => {
      if (currentIndex < pets.length && user) {
        const currentPet = pets[currentIndex]
        try {
          const supabase = createClient()

          // Get follower count
          const { count } = await supabase
            .from('follows')
            .select('*', { count: 'exact' })
            .eq('following_id', currentPet.owner_id)
          setFollowerCount(count || 0)

          // Check if user follows this pet owner
          const { data: followData } = await supabase
            .from('follows')
            .select('*')
            .eq('follower_id', user.id)
            .eq('following_id', currentPet.owner_id)
            .single()

          setIsFollowing(!!followData)
        } catch (err) {
          console.error('Follow fetch error:', err)
        }
      }
    }

    loadFollowState()
  }, [currentIndex, pets, user])

  const handleFollow = async () => {
    if (!user || currentIndex >= pets.length) return

    const currentPet = pets[currentIndex]
    setLoadingFollow(true)

    try {
      const supabase = createClient()

      if (isFollowing) {
        // Unfollow
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', currentPet.owner_id)
        setIsFollowing(false)
        setFollowerCount(prev => Math.max(0, prev - 1))
      } else {
        // Follow
        await supabase.from('follows').insert({
          follower_id: user.id,
          following_id: currentPet.owner_id,
        })
        setIsFollowing(true)
        setFollowerCount(prev => prev + 1)
      }
    } catch (err) {
      console.error('Follow error:', err)
    } finally {
      setLoadingFollow(false)
    }
  }

  const handleShare = async () => {
    if (currentIndex >= pets.length) return
    const currentPet = pets[currentIndex]
    const url = `${window.location.origin}/pets/${currentPet.id}`

    try {
      if (navigator.share) {
        await navigator.share({
          title: currentPet.name,
          url: url,
        })
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(url)
        alert('Link copied to clipboard!')
      }
    } catch (err) {
      console.error('Share error:', err)
    }
  }

  const handleReport = async () => {
    if (!reportReason.trim() || !user || currentIndex >= pets.length) {
      alert('Please select a reason')
      return
    }

    setReportingLoading(true)
    try {
      const supabase = createClient()
      const currentPet = pets[currentIndex]

      const { error } = await supabase.from('reports').insert({
        reporter_id: user.id,
        reported_pet_id: currentPet.id,
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

  const advanceCard = () => {
    setCurrentIndex(prev => {
      const next = prev + 1
      return next < pets.length ? next : prev
    })
  }

  // Handle scroll/swipe
  const handleWheel = (e: React.WheelEvent) => {
    if (e.deltaY > 0) {
      advanceCard()
    }
  }

  // Handle keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault()
        advanceCard()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentIndex, pets.length])

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

  const currentPet = currentIndex < pets.length ? pets[currentIndex] : null

  if (!currentPet) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'var(--app-bg)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}>
        <p style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</p>
        <h1 style={{
          fontFamily: '"Instrument Serif", Georgia, serif',
          fontSize: '32px',
          fontWeight: 400,
          fontStyle: 'italic',
          color: 'var(--ink)',
          marginBottom: '12px',
          textAlign: 'center',
        }}>
          You've seen them all!
        </h1>
        <p style={{
          fontSize: '13px',
          color: 'var(--ink-2)',
          marginBottom: '32px',
          textAlign: 'center',
          maxWidth: '300px',
        }}>
          Check back later for more pets to discover.
        </p>
        <Link href="/profile" style={{
          padding: '12px 28px',
          background: 'var(--ink)',
          color: '#fff',
          textDecoration: 'none',
          fontSize: '13px',
          fontWeight: 600,
          letterSpacing: '0.5px',
          borderRadius: '0px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          transition: 'all 180ms ease',
          display: 'inline-block',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)', e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.2)')}
        onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)', e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)')}
        >
          View Your Pets
        </Link>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--app-bg)',
      display: 'flex',
      flexDirection: 'column',
      onWheel: handleWheel,
    } as any}>
      {/* Carousel Card - Full Screen */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Main Image/Photo */}
        <div style={{
          flex: 1,
          backgroundColor: '#e5e1d7',
          backgroundImage: currentPet.cover_url || currentPet.avatar_url ? `url(${currentPet.cover_url || currentPet.avatar_url})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'relative',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'flex-end',
        }} onClick={advanceCard}>
          {/* Flag Button */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowReportModal(true)
            }}
            style={{
              position: 'absolute',
              top: '14px',
              right: '14px',
              width: '32px',
              height: '32px',
              borderRadius: '0px',
              background: 'rgba(0, 0, 0, 0.2)',
              color: '#fff',
              border: 'none',
              backdropFilter: 'blur(8px)',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 160ms ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: 0.6,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0, 0, 0, 0.3)', e.currentTarget.style.opacity = '0.8')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(0, 0, 0, 0.2)', e.currentTarget.style.opacity = '0.6')}
            title="Report this pet"
          >
            ⋯
          </button>
          {/* Dark overlay for text readability */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent 60%)',
            pointerEvents: 'none',
          }} />

          {/* Content Overlay at Bottom */}
          <div style={{
            position: 'relative',
            width: '100%',
            padding: '24px 20px 40px',
            color: '#fff',
          }}>
            {/* Pet Name and Species */}
            <div style={{ marginBottom: '16px' }}>
              <h1 style={{
                fontFamily: '"Instrument Serif", Georgia, serif',
                fontSize: '36px',
                fontWeight: 400,
                fontStyle: 'italic',
                margin: '0 0 4px 0',
                lineHeight: 1,
              }}>
                {currentPet.name}
              </h1>
              <p style={{
                fontSize: '12px',
                fontWeight: 600,
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                margin: '0 0 8px 0',
                opacity: 0.9,
              }}>
                {currentPet.species}{currentPet.breed ? ` · ${currentPet.breed}` : ''}
              </p>

              {/* Caption if exists */}
              {currentPet.caption && (
                <p style={{
                  fontSize: '11px',
                  fontWeight: 400,
                  lineHeight: 1.4,
                  margin: '0 0 12px 0',
                  opacity: 0.8,
                  fontStyle: 'italic',
                }}>
                  {currentPet.caption}
                </p>
              )}
            </div>

            {/* Bio if exists */}
            {currentPet.bio && (
              <p style={{
                fontSize: '13px',
                fontWeight: 400,
                lineHeight: 1.5,
                margin: '0 0 16px 0',
                opacity: 0.95,
              }}>
                "{currentPet.bio}"
              </p>
            )}

            {/* Follower Count */}
            <div style={{
              textAlign: 'right',
            }}>
              <p style={{
                fontSize: '20px',
                fontWeight: 700,
                margin: '0 0 2px 0',
              }}>
                {followerCount.toLocaleString()}
              </p>
              <p style={{
                fontSize: '10px',
                fontWeight: 600,
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                margin: 0,
                opacity: 0.8,
              }}>
                Followers
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{
        padding: '20px',
        background: 'var(--paper)',
        borderTop: '1px solid var(--line)',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '12px',
      }}>
        {/* Follow Button */}
        <button
          onClick={handleFollow}
          disabled={loadingFollow}
          style={{
            padding: '14px 16px',
            background: isFollowing ? 'var(--ink)' : 'var(--acc)',
            color: '#fff',
            border: 'none',
            borderRadius: '0px',
            fontSize: '13px',
            fontWeight: 600,
            letterSpacing: '0.4px',
            cursor: loadingFollow ? 'not-allowed' : 'pointer',
            opacity: loadingFollow ? 0.7 : 1,
            transition: 'all 160ms ease',
            boxShadow: isFollowing ? '0 4px 12px rgba(0, 0, 0, 0.15)' : '0 4px 12px rgba(8, 145, 178, 0.2)',
          }}
          onMouseEnter={(e) => !loadingFollow && (e.currentTarget.style.transform = 'translateY(-2px)', e.currentTarget.style.boxShadow = isFollowing ? '0 8px 20px rgba(0, 0, 0, 0.2)' : '0 6px 16px rgba(8, 145, 178, 0.3)')}
          onMouseLeave={(e) => !loadingFollow && (e.currentTarget.style.transform = 'translateY(0)', e.currentTarget.style.boxShadow = isFollowing ? '0 4px 12px rgba(0, 0, 0, 0.15)' : '0 4px 12px rgba(8, 145, 178, 0.2)')}
        >
          {isFollowing ? '✓ Following' : '+ Follow'}
        </button>

        {/* Share Button */}
        <button
          onClick={handleShare}
          style={{
            padding: '14px 16px',
            background: 'transparent',
            color: 'var(--acc)',
            border: '1.5px solid var(--acc)',
            borderRadius: '0px',
            fontSize: '13px',
            fontWeight: 600,
            letterSpacing: '0.4px',
            cursor: 'pointer',
            transition: 'all 160ms ease',
            boxShadow: '0 2px 6px rgba(8, 145, 178, 0.1)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--acc)', e.currentTarget.style.color = '#fff', e.currentTarget.style.boxShadow = '0 4px 12px rgba(8, 145, 178, 0.25)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent', e.currentTarget.style.color = 'var(--acc)', e.currentTarget.style.boxShadow = '0 2px 6px rgba(8, 145, 178, 0.1)')}
        >
          ↗ Share
        </button>
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

      {/* Navigation Info */}
      <div style={{
        padding: '12px 20px',
        background: 'var(--paper)',
        textAlign: 'center',
        borderTop: '1px solid var(--line)',
        fontSize: '11px',
        color: 'var(--ink-2)',
        fontWeight: 500,
      }}>
        {currentIndex + 1} / {pets.length} · Scroll or tap to next
      </div>

      {/* Bottom Navigation */}
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
          { icon: 'explore', label: 'Explore', href: '/stack', active: true },
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
              gap: '4px',
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
