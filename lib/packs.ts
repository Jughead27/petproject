import { createClient } from './supabase'

/**
 * Create a new pack
 */
export async function createPack(
  ownerId: string,
  name: string,
  description: string,
  isPrivate: boolean
): Promise<string | null> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('packs')
      .insert({
        owner_id: ownerId,
        name: name.trim(),
        description: description.trim(),
        is_private: isPrivate,
      })
      .select()
      .single()

    if (error || !data) {
      console.error('Create pack error:', error)
      return null
    }

    return data.id
  } catch (err) {
    console.error('Create pack error:', {
      error: err instanceof Error ? err.message : String(err),
      timestamp: new Date().toISOString(),
    })
    return null
  }
}

/**
 * Get packs owned by user
 */
export async function getUserPacks(userId: string): Promise<any[]> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('packs')
      .select('*')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Get user packs error:', error)
      return []
    }

    return data || []
  } catch (err) {
    console.error('Get user packs error:', err)
    return []
  }
}

/**
 * Get all public packs for discovery
 */
export async function getPublicPacks(limit = 50, offset = 0): Promise<any[]> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('packs')
      .select('*')
      .eq('is_private', false)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Get public packs error:', error)
      return []
    }

    return data || []
  } catch (err) {
    console.error('Get public packs error:', err)
    return []
  }
}

/**
 * Get single pack with member count
 */
export async function getPack(packId: string): Promise<any | null> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('packs')
      .select(
        `
        *,
        owner:owner_id(username),
        members:pack_members(count)
      `
      )
      .eq('id', packId)
      .single()

    if (error || !data) {
      console.error('Get pack error:', error)
      return null
    }

    return data
  } catch (err) {
    console.error('Get pack error:', err)
    return null
  }
}

/**
 * Add pet to pack
 */
export async function addPetToPack(packId: string, petId: string): Promise<boolean> {
  try {
    const supabase = createClient()

    const { error } = await supabase.from('pack_members').insert({
      pack_id: packId,
      pet_id: petId,
    })

    if (error) {
      console.error('Add pet to pack error:', error)
      return false
    }

    return true
  } catch (err) {
    console.error('Add pet to pack error:', err)
    return false
  }
}

/**
 * Remove pet from pack
 */
export async function removePetFromPack(packId: string, petId: string): Promise<boolean> {
  try {
    const supabase = createClient()

    const { error } = await supabase
      .from('pack_members')
      .delete()
      .eq('pack_id', packId)
      .eq('pet_id', petId)

    if (error) {
      console.error('Remove pet from pack error:', error)
      return false
    }

    return true
  } catch (err) {
    console.error('Remove pet from pack error:', err)
    return false
  }
}

/**
 * Get all pets in a pack
 */
export async function getPackPets(packId: string): Promise<any[]> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('pack_members')
      .select(
        `
        pet:pet_id(id, name, species, breed, avatar_url, card_number, owner_id),
        pet_owner:pet_id(owner_id)
      `
      )
      .eq('pack_id', packId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Get pack pets error:', error)
      return []
    }

    return data?.map((item: any) => item.pet) || []
  } catch (err) {
    console.error('Get pack pets error:', err)
    return []
  }
}

/**
 * Follow a pack
 */
export async function followPack(userId: string, packId: string): Promise<boolean> {
  try {
    const supabase = createClient()

    const { error } = await supabase
      .from('pack_followers')
      .insert({
        user_id: userId,
        pack_id: packId,
      })
      .select()
      .single()

    if (error) {
      // Might be duplicate, that's ok
      return true
    }

    return true
  } catch (err) {
    console.error('Follow pack error:', err)
    return false
  }
}

/**
 * Unfollow a pack
 */
export async function unfollowPack(userId: string, packId: string): Promise<boolean> {
  try {
    const supabase = createClient()

    const { error } = await supabase
      .from('pack_followers')
      .delete()
      .eq('user_id', userId)
      .eq('pack_id', packId)

    if (error) {
      console.error('Unfollow pack error:', error)
      return false
    }

    return true
  } catch (err) {
    console.error('Unfollow pack error:', err)
    return false
  }
}

/**
 * Check if user follows pack
 */
export async function isFollowingPack(userId: string, packId: string): Promise<boolean> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('pack_followers')
      .select('id')
      .eq('user_id', userId)
      .eq('pack_id', packId)
      .single()

    if (error) return false
    return !!data
  } catch (err) {
    console.error('Is following pack error:', err)
    return false
  }
}

/**
 * Delete a pack (owner only)
 */
export async function deletePack(packId: string, ownerId: string): Promise<boolean> {
  try {
    const supabase = createClient()

    // First delete all pack members
    await supabase.from('pack_members').delete().eq('pack_id', packId)

    // Then delete pack
    const { error } = await supabase
      .from('packs')
      .delete()
      .eq('id', packId)
      .eq('owner_id', ownerId)

    if (error) {
      console.error('Delete pack error:', error)
      return false
    }

    return true
  } catch (err) {
    console.error('Delete pack error:', err)
    return false
  }
}
