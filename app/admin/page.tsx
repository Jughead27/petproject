'use client'

import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface Report {
  id: string
  reason: string
  status: string
  created_at: string
  additional_info: string | null
  reporter_id: string
  reported_pet_id: string
  pets: {
    id: string
    name: string
    species: string
    avatar_url: string | null
    owner_id: string
  } | null
  users: {
    username: string
  } | null
}

export default function AdminPage() {
  const router = useRouter()
  const [user, setUser] = useState<{ id: string } | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('pending')
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [actioningId, setActioningId] = useState<string | null>(null)

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const supabase = createClient()
        const { data: userData } = await supabase.auth.getUser()
        if (!userData.user) {
          router.push('/login')
          return
        }

        setUser(userData.user as { id: string })

        const { data: userRole } = await supabase
          .from('users')
          .select('role')
          .eq('id', userData.user.id)
          .single()

        if (!userRole || userRole.role !== 'admin') {
          router.push('/stack')
          return
        }

        setIsAdmin(true)
      } catch (err) {
        console.error('Admin check error:', err)
        router.push('/stack')
      }
    }

    checkAccess()
  }, [router])

  useEffect(() => {
    const loadReports = async () => {
      if (!isAdmin) return

      setLoading(true)
      try {
        const res = await fetch(`/api/admin/reports?status=${status}&page=${page}`)
        const data = await res.json()
        setReports(data.reports || [])
        setTotalPages(data.pages || 0)
      } catch (err) {
        console.error('Reports load error:', err)
      } finally {
        setLoading(false)
      }
    }

    loadReports()
  }, [isAdmin, status, page])

  const handleAction = async (reportId: string, action: string, petId?: string, userId?: string) => {
    setActioningId(reportId)
    try {
      const res = await fetch('/api/admin/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          reportId,
          petId,
          userId,
          adminNote: action === 'hide_pet' ? 'Hidden by admin' : action === 'ban_user' ? 'Banned by admin' : undefined,
        }),
      })

      if (!res.ok) throw new Error('Action failed')

      // Reload reports
      const reportsRes = await fetch(`/api/admin/reports?status=${status}&page=${page}`)
      const data = await reportsRes.json()
      setReports(data.reports || [])
    } catch (err) {
      console.error('Action error:', err)
      alert('Failed to execute action')
    } finally {
      setActioningId(null)
    }
  }

  if (!isAdmin || loading) {
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
      paddingBottom: '40px',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        padding: '24px',
        borderBottom: '1px solid var(--line)',
      }}>
        <div>
          <p style={{
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '2.5px',
            textTransform: 'uppercase',
            color: 'var(--acc)',
            margin: '0 0 8px 0',
          }}>
            Admin
          </p>
          <h1 style={{
            fontFamily: '"Instrument Serif", Georgia, serif',
            fontSize: '32px',
            fontWeight: 400,
            fontStyle: 'italic',
            color: 'var(--ink)',
            margin: '0 0 6px 0',
            lineHeight: 1,
          }}>
            Reports
          </h1>
          <p style={{
            fontSize: '12px',
            color: 'var(--ink-2)',
            margin: 0,
          }}>
            {reports.length} {status} report{reports.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link href="/profile" style={{
          padding: '10px 16px',
          background: 'var(--paper)',
          border: '1px solid var(--line)',
          borderRadius: '0px',
          fontSize: '12px',
          fontWeight: 600,
          color: 'var(--ink)',
          textDecoration: 'none',
          transition: 'all 160ms ease',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0, 0, 0, 0.05)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--paper)')}
        >
          Back to app
        </Link>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '0',
        borderBottom: '1px solid var(--line)',
        background: 'var(--paper)',
      }}>
        {['pending', 'reviewed', 'dismissed'].map(s => (
          <button
            key={s}
            onClick={() => { setStatus(s); setPage(0) }}
            style={{
              padding: '12px 20px',
              background: status === s ? 'var(--app-bg)' : 'transparent',
              border: 'none',
              borderBottom: status === s ? '2px solid var(--acc)' : '2px solid transparent',
              color: status === s ? 'var(--ink)' : 'var(--ink-2)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 160ms ease',
              letterSpacing: '0.5px',
              textTransform: 'capitalize',
            }}
            onMouseEnter={(e) => status !== s && (e.currentTarget.style.color = 'var(--ink)')}
            onMouseLeave={(e) => status !== s && (e.currentTarget.style.color = 'var(--ink-2)')}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Reports List */}
      <div style={{ padding: '20px' }}>
        {reports.length === 0 ? (
          <div style={{ textAlign: 'center', paddingTop: '60px' }}>
            <p style={{ fontSize: '40px', marginBottom: '16px' }}>🎉</p>
            <h2 style={{
              fontFamily: '"Instrument Serif", Georgia, serif',
              fontSize: '20px',
              fontWeight: 400,
              fontStyle: 'italic',
              color: 'var(--ink)',
              marginBottom: '8px',
            }}>
              No {status} reports
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--ink-2)' }}>All clear!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {reports.map(report => (
              <div key={report.id} style={{
                background: 'var(--paper)',
                border: '1px solid var(--line)',
                borderRadius: '0px',
                padding: '16px',
                display: 'grid',
                gridTemplateColumns: '80px 1fr auto',
                gap: '16px',
                alignItems: 'start',
              }}>
                {/* Pet Avatar */}
                <div style={{
                  width: '80px',
                  height: '80px',
                  backgroundColor: '#e5e1d7',
                  backgroundImage: report.pets?.avatar_url ? `url(${report.pets.avatar_url})` : undefined,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  border: '1px solid var(--line)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '32px',
                }}>
                  {!report.pets?.avatar_url && '🐾'}
                </div>

                {/* Report Details */}
                <div>
                  <div style={{ marginBottom: '8px' }}>
                    <h3 style={{
                      margin: '0 0 4px 0',
                      fontSize: '16px',
                      fontWeight: 600,
                      color: 'var(--ink)',
                    }}>
                      {report.pets?.name || 'Deleted pet'}
                    </h3>
                    <p style={{
                      margin: '0 0 8px 0',
                      fontSize: '12px',
                      color: 'var(--ink-2)',
                    }}>
                      {report.pets?.species || 'Unknown'} • Reported by @{report.users?.username}
                    </p>
                    <p style={{
                      margin: '0 0 8px 0',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: 'var(--acc)',
                      textTransform: 'capitalize',
                    }}>
                      Reason: {report.reason}
                    </p>
                    {report.additional_info && (
                      <p style={{
                        margin: '0',
                        fontSize: '12px',
                        color: 'var(--ink)',
                        lineHeight: 1.4,
                      }}>
                        "{report.additional_info}"
                      </p>
                    )}
                  </div>
                  <p style={{
                    margin: '0',
                    fontSize: '11px',
                    color: 'var(--ink-2)',
                  }}>
                    {new Date(report.created_at).toLocaleDateString()} at {new Date(report.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                {/* Actions */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}>
                  {status === 'pending' && report.pets && (
                    <>
                      <button
                        onClick={() => handleAction(report.id, 'hide_pet', report.pets?.id)}
                        disabled={actioningId === report.id}
                        style={{
                          padding: '8px 12px',
                          background: 'var(--acc)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '0px',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: actioningId === report.id ? 'not-allowed' : 'pointer',
                          opacity: actioningId === report.id ? 0.7 : 1,
                          transition: 'all 160ms ease',
                          whiteSpace: 'nowrap',
                        }}
                        onMouseEnter={(e) => !actioningId && (e.currentTarget.style.transform = 'translateY(-2px)')}
                        onMouseLeave={(e) => !actioningId && (e.currentTarget.style.transform = 'translateY(0)')}
                      >
                        Hide pet
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Ban this user? They will not be able to log in.')) {
                            handleAction(report.id, 'ban_user', undefined, report.pets?.owner_id)
                          }
                        }}
                        disabled={actioningId === report.id}
                        style={{
                          padding: '8px 12px',
                          background: 'var(--ink)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '0px',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: actioningId === report.id ? 'not-allowed' : 'pointer',
                          opacity: actioningId === report.id ? 0.7 : 1,
                          transition: 'all 160ms ease',
                          whiteSpace: 'nowrap',
                        }}
                        onMouseEnter={(e) => !actioningId && (e.currentTarget.style.transform = 'translateY(-2px)')}
                        onMouseLeave={(e) => !actioningId && (e.currentTarget.style.transform = 'translateY(0)')}
                      >
                        Ban user
                      </button>
                      <button
                        onClick={() => handleAction(report.id, 'dismiss_report')}
                        disabled={actioningId === report.id}
                        style={{
                          padding: '8px 12px',
                          background: 'transparent',
                          color: 'var(--ink-2)',
                          border: '1px solid var(--line)',
                          borderRadius: '0px',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: actioningId === report.id ? 'not-allowed' : 'pointer',
                          opacity: actioningId === report.id ? 0.7 : 1,
                          transition: 'all 160ms ease',
                          whiteSpace: 'nowrap',
                        }}
                        onMouseEnter={(e) => !actioningId && (e.currentTarget.style.color = 'var(--ink)')}
                        onMouseLeave={(e) => !actioningId && (e.currentTarget.style.color = 'var(--ink-2)')}
                      >
                        Dismiss
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{
          padding: '20px',
          display: 'flex',
          gap: '8px',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <button
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
            style={{
              padding: '8px 12px',
              background: page === 0 ? 'var(--ink-2)' : 'var(--ink)',
              color: '#fff',
              border: 'none',
              borderRadius: '0px',
              fontSize: '12px',
              cursor: page === 0 ? 'not-allowed' : 'pointer',
              opacity: page === 0 ? 0.5 : 1,
            }}
          >
            ←
          </button>
          <p style={{ margin: '0 8px', fontSize: '12px', color: 'var(--ink-2)' }}>
            Page {page + 1} of {totalPages}
          </p>
          <button
            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
            disabled={page >= totalPages - 1}
            style={{
              padding: '8px 12px',
              background: page >= totalPages - 1 ? 'var(--ink-2)' : 'var(--ink)',
              color: '#fff',
              border: 'none',
              borderRadius: '0px',
              fontSize: '12px',
              cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer',
              opacity: page >= totalPages - 1 ? 0.5 : 1,
            }}
          >
            →
          </button>
        </div>
      )}
    </div>
  )
}
