'use client'

import { createClient } from '@/lib/supabase'
import { createPack } from '@/lib/packs'
import { useState } from 'react'

interface PackCreatorProps {
  onPackCreated: () => void
}

export function PackCreator({ onPackCreated }: PackCreatorProps) {
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('Pack name is required')
      return
    }

    setCreating(true)

    try {
      const supabase = createClient()
      const { data: userData } = await supabase.auth.getUser()

      if (!userData.user) {
        setError('Not authenticated')
        setCreating(false)
        return
      }

      const packId = await createPack(userData.user.id, name, description, isPrivate)

      if (!packId) {
        setError('Failed to create pack')
        setCreating(false)
        return
      }

      // Reset form and notify parent
      setName('')
      setDescription('')
      setIsPrivate(false)
      setShowForm(false)
      onPackCreated()
    } catch (err) {
      console.error('Pack creation error:', err)
      setError('An error occurred')
    } finally {
      setCreating(false)
    }
  }

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 rounded-lg transition-colors"
      >
        🐾 Create New Pack
      </button>
    )
  }

  return (
    <div className="bg-white rounded-lg p-6 mb-8 border-2 border-amber-200">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Create a Pack</h2>
      <p className="text-gray-600 mb-6">
        Start a collection for golden retrievers, rescue dogs, puppies, or any pet group!
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Pack Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Pack Name *
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={creating}
            placeholder="e.g. Golden Retrievers, Rescue Dogs, Littermates"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50"
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={creating}
            placeholder="Tell people what this pack is about..."
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50 resize-none"
          />
        </div>

        {/* Privacy Toggle */}
        <div className="flex items-center gap-3">
          <input
            id="private"
            type="checkbox"
            checked={isPrivate}
            onChange={(e) => setIsPrivate(e.target.checked)}
            disabled={creating}
            className="w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
          />
          <label htmlFor="private" className="text-sm font-medium text-gray-700">
            Make this pack private (only you can add pets)
          </label>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        {/* Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={creating || !name.trim()}
            className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            {creating ? 'Creating...' : 'Create Pack'}
          </button>
          <button
            type="button"
            onClick={() => {
              setShowForm(false)
              setName('')
              setDescription('')
              setError('')
            }}
            disabled={creating}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 font-medium py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
