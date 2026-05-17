'use client'

import Link from 'next/link'

export default function OnboardingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome to PetProject</h1>
          <p className="text-lg text-gray-600">
            PetProject is better with a pet card. Add yours, or explore first?
          </p>
        </div>

        <div className="space-y-4">
          <Link href="/pets/create">
            <button className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-4 rounded-lg transition-colors text-lg">
              🐾 Add my first pet
            </button>
          </Link>

          <Link href="/stack">
            <button className="w-full bg-gray-200 hover:bg-gray-300 text-gray-900 font-bold py-4 rounded-lg transition-colors text-lg">
              👀 Browse first, add pet later
            </button>
          </Link>
        </div>

        <p className="text-center text-sm text-gray-500 mt-8">
          You can always add a pet later from your profile.
        </p>
      </div>
    </div>
  )
}
