import { Database } from './supabase';

export type UserMediaItem = Database['public']['Tables']['user_media_items']['Row'];
export type Game = Database['public']['Tables']['catalog_games']['Row'];
export type Show = Database['public']['Tables']['catalog_shows']['Row'];
export type Book = Database['public']['Tables']['catalog_books']['Row'];

export type MediaType = 'game' | 'show' | 'book';
export type MediaStatus = 'pending' | 'watching' | 'completed' | 'dropped';

// Combined interface for UI/Search logic
export interface UniversalMediaItem {
    id: string;
    type: MediaType;
    title: string;
    cover_url: string | null;
    metadata: {
        creator?: string | null; // developer/author/network
        total_prog?: number | null; // time_to_beat/episodes/pages
        extra_info?: string | null; // platform/is_anime/type
    };
    description?: string | null;
    // User context (if tracked)
    tracking?: {
        status: MediaStatus;
        progress: number;
        rating: number | null;
        id: string; // user_media_item id
    } | null;
}
