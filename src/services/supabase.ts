import { createClient } from "@supabase/supabase-js";
import { MediaType, MediaStatus } from "@/types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
  },
});

export const db = {
  async getMediaItems(type?: MediaType) {
    let query = supabase.from("media_items").select("*");
    if (type) query = query.eq("type", type);
    return query;
  },

  async getMediaById(id: string) {
    return supabase.from("media_items").select("*").eq("id", id).single();
  },

  async getMediaByExternalId(external_id: string, type: MediaType) {
    const { data, error } = await supabase
      .from("media_items")
      .select("*")
      .eq("external_id", external_id)
      .eq("type", type)
      .limit(1);

    if (error) {
      return { data: null, error };
    }

    if (!data || data.length === 0) {
      return { data: null, error: null };
    }

    return { data: data[0], error: null };
  },

  async createMediaItem(data: {
    type: MediaType;
    title: string;
    coverUrl: string | null;
    external_id: string | null;
    isCustom: boolean;
    createdBy: string | null;
  }) {
    const { data: mediaItem, error } = await supabase
      .from("media_items")
      .insert({
        type: data.type,
        title: data.title,
        cover_url: data.coverUrl,
        //external_id: data.externalId,
        external_id: data.external_id,
        is_custom: data.isCustom,
        created_by: data.createdBy,
      })
      .select()
      .single();

    return { data: mediaItem, error };
  },

  async createMovie(data: {
    id: string;
    // director: string | null
    // durationMinutes: number | null
    year: number | null;
    isSeries: boolean;
    // seasonsCount: number | null
    // episodesCount: number | null
  }) {
    return supabase.from("movies").insert({
      id: data.id,
      // director: data.director,
      // duration_minutes: data.durationMinutes,
      release_year: data.year,
      is_series: data.isSeries,
      //seasons_count: data.seasonsCount,
      //episodes_count: data.episodesCount
    });
  },

  async createBook(data: {
    id: string;
    author: string | null;
    pages: number | null;
    isbn: string | null;
  }) {
    return supabase.from("books").insert({
      id: data.id,
      author: data.author,
      pages: data.pages,
      isbn: data.isbn,
    });
  },

  async createGame(data: {
    id: string;
    //developer: string | null;
    platform: string[] | null;
    genre: string[] | null;
  }) {
    return supabase.from("games").insert({
      id: data.id,
      // developer: data.developer,
      platform: data.platform,
      genre: data.genre,
    });
  },

  // User Media
  async getUserMedia(
    userId: string,
    filters?: { type?: MediaType; status?: MediaStatus },
  ) {
    let query = supabase
      .from("user_media")
      .select(
        `
        *,
        media:media_items (*)
      `,
      )
      .eq("user_id", userId);

    if (filters?.status) {
      query = query.eq("status", filters.status);
    }

    return query;
  },

  async addUserMedia(data: {
    userId: string;
    mediaId: string;
    status: MediaStatus;
  }) {
    return supabase.from("user_media").insert({
      user_id: data.userId,
      media_id: data.mediaId,
      status: data.status,
    });
  },

  async updateUserMedia(
    id: string,
    updates: {
      status?: MediaStatus;
      rating?: number | null;
      review?: string | null;
      is_finished?: boolean;
      started_at?: string | null;
      completed_at?: string | null;
      currentPage?: number | null;
      currentSeason?: number | null;
      currentEpisode?: number | null;
      hoursPlayed?: number | null;
    },
  ) {
    const dbUpdates: Record<string, string | number | boolean | null> = {};

    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.rating !== undefined) dbUpdates.rating = updates.rating;
    if (updates.review !== undefined) dbUpdates.review = updates.review;
    if (updates.is_finished !== undefined) dbUpdates.is_finished = updates.is_finished;
    if (updates.started_at !== undefined) dbUpdates.started_at = updates.started_at;
    if (updates.completed_at !== undefined) dbUpdates.completed_at = updates.completed_at;
    if (updates.currentPage !== undefined)
      dbUpdates.current_page = updates.currentPage;
    if (updates.currentSeason !== undefined)
      dbUpdates.current_season = updates.currentSeason;
    if (updates.currentEpisode !== undefined)
      dbUpdates.current_episode = updates.currentEpisode;
    if (updates.hoursPlayed !== undefined)
      dbUpdates.hours_played = updates.hoursPlayed;

    dbUpdates.updated_at = new Date().toISOString();

    return supabase.from("user_media").update(dbUpdates).eq("id", id);
  },

  async deleteUserMedia(id: string) {
    return supabase.from("user_media").delete().eq("id", id);
  },
};
