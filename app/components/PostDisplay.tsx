'use client'

import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { logPostDelete, logCommentCreate, logCommentDelete } from '@/lib/audit'
import { notifyPostComment } from '@/lib/notifications'

interface Post {
  id: string
  content: string
  user_id: string
  pet_id: string
  is_private: boolean
  is_deleted: boolean
  deleted_at: string | null
  created_at: string
}

interface Comment {
  id: string
  content: string
  user_id: string
  post_id: string
  is_deleted: boolean
  deleted_at: string | null
  created_at: string
}

interface PostDisplayProps {
  petId: string
  currentUserId: string | null
}

interface PostWithComments extends Post {
  comments: Comment[]
  author: { username: string }
}

export function PostDisplay({ petId, currentUserId }: PostDisplayProps) {
  const [posts, setPosts] = useState<PostWithComments[]>([])
  const [loading, setLoading] = useState(true)
  const [commentTexts, setCommentTexts] = useState<Record<string, string>>({})
  const [commentsLoading, setCommentsLoading] = useState<Record<string, boolean>>({})

  useEffect(() => {
    loadPosts()
  }, [petId])

  const loadPosts = async () => {
    try {
      const supabase = createClient()

      const { data: postsData } = await supabase
        .from('posts')
        .select(
          `
          id, content, user_id, pet_id, is_private, is_deleted, deleted_at, created_at,
          user:users(username)
        `
        )
        .eq('pet_id', petId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })

      if (!postsData) {
        setLoading(false)
        return
      }

      // Fetch comments for each post
      const postsWithComments: PostWithComments[] = []

      for (const post of postsData) {
        const { data: commentsData } = await supabase
          .from('comments')
          .select('id, content, user_id, post_id, is_deleted, deleted_at, created_at')
          .eq('post_id', post.id)
          .eq('is_deleted', false)
          .order('created_at', { ascending: true })

        postsWithComments.push({
          ...post,
          comments: commentsData || [],
          author: post.user || { username: 'Unknown' },
        })
      }

      setPosts(postsWithComments)
      setLoading(false)
    } catch (err) {
      console.error('Load posts error:', err)
      setLoading(false)
    }
  }

  const handleDeletePost = async (postId: string, content: string) => {
    if (!window.confirm('Delete this post? You can recover it for 30 days.')) {
      return
    }

    try {
      const supabase = createClient()

      await supabase
        .from('posts')
        .update({ is_deleted: true, deleted_at: new Date().toISOString() })
        .eq('id', postId)

      await logPostDelete(currentUserId || '', postId, content)

      // Refresh posts
      loadPosts()
    } catch (err) {
      console.error('Delete post error:', err)
    }
  }

  const handleAddComment = async (postId: string) => {
    const text = commentTexts[postId]?.trim()
    if (!text) return

    setCommentsLoading({ ...commentsLoading, [postId]: true })

    try {
      const supabase = createClient()
      const { data: userData } = await supabase.auth.getUser()

      if (!userData.user) {
        setCommentsLoading({ ...commentsLoading, [postId]: false })
        return
      }

      const { data: comment, error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          user_id: userData.user.id,
          content: text,
          is_deleted: false,
        })
        .select()
        .single()

      if (error || !comment) {
        setCommentsLoading({ ...commentsLoading, [postId]: false })
        return
      }

      await logCommentCreate(userData.user.id, comment.id, text, postId)

      // Notify post owner if different from commenter
      const post = posts.find((p) => p.id === postId)
      if (post && post.user_id !== userData.user.id) {
        await notifyPostComment(post.user_id, userData.user.id, postId, comment.id, post.author.username)
      }

      // Clear input and refresh
      setCommentTexts({ ...commentTexts, [postId]: '' })
      loadPosts()
    } catch (err) {
      console.error('Add comment error:', err)
    } finally {
      setCommentsLoading({ ...commentsLoading, [postId]: false })
    }
  }

  const handleDeleteComment = async (commentId: string, content: string) => {
    if (!window.confirm('Delete this comment?')) {
      return
    }

    try {
      const supabase = createClient()

      await supabase
        .from('comments')
        .update({ is_deleted: true, deleted_at: new Date().toISOString() })
        .eq('id', commentId)

      await logCommentDelete(currentUserId || '', commentId, content)

      loadPosts()
    } catch (err) {
      console.error('Delete comment error:', err)
    }
  }

  if (loading) {
    return <div className="text-center text-gray-600">Loading posts...</div>
  }

  if (posts.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        <p>No updates yet. Share one!</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {posts.map((post) => (
        <div key={post.id} className="bg-white rounded-lg p-4 border border-gray-200">
          {/* Post header */}
          <div className="flex justify-between items-start mb-3">
            <Link
              href={`/user/${post.author.username}`}
              className="text-sm text-amber-600 hover:text-amber-700 font-medium"
            >
              @{post.author.username}
            </Link>
            {currentUserId === post.user_id && (
              <button
                onClick={() => handleDeletePost(post.id, post.content)}
                className="text-xs text-red-600 hover:text-red-700 font-medium"
              >
                Delete
              </button>
            )}
          </div>

          {/* Post content */}
          <p className="text-gray-900 mb-3 whitespace-pre-wrap">{post.content}</p>

          {/* Timestamp */}
          <p className="text-xs text-gray-400 mb-4">
            {new Date(post.created_at).toLocaleDateString()} •{' '}
            {new Date(post.created_at).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>

          {/* Comments section */}
          <div className="border-t pt-4">
            {post.comments.length > 0 && (
              <div className="space-y-3 mb-4">
                {post.comments.map((comment) => (
                  <div key={comment.id} className="bg-gray-50 rounded p-3 text-sm">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium text-gray-700">Comment</span>
                      {currentUserId === comment.user_id && (
                        <button
                          onClick={() => handleDeleteComment(comment.id, comment.content)}
                          className="text-xs text-red-600 hover:text-red-700"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                    <p className="text-gray-800">{comment.content}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(comment.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {currentUserId && (
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add a comment..."
                  value={commentTexts[post.id] || ''}
                  onChange={(e) => setCommentTexts({ ...commentTexts, [post.id]: e.target.value })}
                  disabled={commentsLoading[post.id]}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleAddComment(post.id)
                    }
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50"
                />
                <button
                  onClick={() => handleAddComment(post.id)}
                  disabled={!commentTexts[post.id]?.trim() || commentsLoading[post.id]}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-medium px-3 py-2 rounded text-sm transition-colors disabled:opacity-50"
                >
                  {commentsLoading[post.id] ? '...' : '→'}
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
