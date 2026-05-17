'use client'

import { createClient } from '@/lib/supabase'
import { logPostCreate } from '@/lib/audit'
import { useState } from 'react'

interface PostCreatorProps {
  petId: string
  isOwner: boolean
  onPostCreated: () => void
}

export function PostCreator({ petId, isOwner, onPostCreated }: PostCreatorProps) {
  const [content, setContent] = useState('')
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState('')

  if (!isOwner) {
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!content.trim()) {
      setError('Post cannot be empty')
      return
    }

    setPosting(true)

    try {
      const supabase = createClient()
      const { data: userData } = await supabase.auth.getUser()

      if (!userData.user) {
        setError('Not authenticated')
        setPosting(false)
        return
      }

      const { data: post, error: postError } = await supabase
        .from('posts')
        .insert({
          pet_id: petId,
          user_id: userData.user.id,
          content: content.trim(),
          is_private: false,
          is_deleted: false,
        })
        .select()
        .single()

      if (postError || !post) {
        setError('Failed to create post')
        setPosting(false)
        return
      }

      // Log to audit trail
      await logPostCreate(userData.user.id, post.id, content.trim(), petId)

      // Reset form and notify parent
      setContent('')
      onPostCreated()
    } catch (err) {
      console.error('Post creation error:', {
        error: err instanceof Error ? err.message : String(err),
        timestamp: new Date().toISOString(),
      })
      setError('An error occurred')
    } finally {
      setPosting(false)
    }
  }

  return (
    <div className="bg-white rounded-lg p-4 mb-6">
      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={posting}
          placeholder="Share an update about your pet..."
          className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50 resize-none"
          rows={3}
        />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={posting || !content.trim()}
          className="bg-amber-600 hover:bg-amber-700 text-white font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
        >
          {posting ? 'Posting...' : '✨ Post Update'}
        </button>
      </form>
    </div>
  )
}
