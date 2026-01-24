import { createClient } from '@supabase/supabase-js'
import { MediaType, MediaStatus, UserMedia } from '@/types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: window.localStorage
  }
})

// Helper функции для работы с БД
export const db = {
  // Media Items
  async getMediaItems(type?: MediaType) {
    let query = supabase.from('media_items').select('*')
    if (type) query = query.eq('type', type)
    return query
  },

  async getMediaById(id: string) {
    return supabase
      .from('media_items')
      .select('*')
      .eq('id', id)
      .single()
  },

  // User Media
  async getUserMedia(userId: string, filters?: { type?: MediaType; status?: MediaStatus }) {
    let query = supabase
      .from('user_media')
      .select(`
        *,
        media:media_items (*)
      `)
      .eq('user_id', userId)

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    return query
  },

  async addUserMedia(data: {
    userId: string
    mediaId: string
    status: MediaStatus
  }) {
    return supabase.from('user_media').insert({
      user_id: data.userId,
      media_id: data.mediaId,
      status: data.status
    })
  },

  async updateUserMedia(id: string, updates: Partial<UserMedia>) {
    return supabase
      .from('user_media')
      .update(updates)
      .eq('id', id)
  },

  async deleteUserMedia(id: string) {
    return supabase.from('user_media').delete().eq('id', id)
  }
}
