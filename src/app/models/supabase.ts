export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    username: string
                    avatar_url: string | null
                    bio: string | null
                    onboarding_completed: boolean
                    updated_at: string
                }
                Insert: {
                    id: string
                    username: string
                    avatar_url?: string | null
                    bio?: string | null
                    onboarding_completed?: boolean
                    updated_at?: string
                }
                Update: {
                    id?: string
                    username?: string
                    avatar_url?: string | null
                    bio?: string | null
                    onboarding_completed?: boolean
                    updated_at?: string
                }
            }
            catalog_games: {
                Row: {
                    id: string
                    title: string
                    cover_url: string | null
                    developer: string | null
                    release_year: number | null
                    time_to_beat: number | null
                    platforms: string[] | null
                }
                Insert: {
                    id?: string
                    title: string
                    cover_url?: string | null
                    developer?: string | null
                    release_year?: number | null
                    time_to_beat?: number | null
                    platforms?: string[] | null
                }
                Update: {
                    id?: string
                    title?: string
                    cover_url?: string | null
                    developer?: string | null
                    release_year?: number | null
                    time_to_beat?: number | null
                    platforms?: string[] | null
                }
            }
            catalog_shows: {
                Row: {
                    id: string
                    title: string
                    cover_url: string | null
                    network: string | null
                    total_seasons: number | null
                    total_episodes: number | null
                    is_anime: boolean | null
                }
                Insert: {
                    id?: string
                    title: string
                    cover_url?: string | null
                    network?: string | null
                    total_seasons?: number | null
                    total_episodes?: number | null
                    is_anime?: boolean | null
                }
                Update: {
                    id?: string
                    title?: string
                    cover_url?: string | null
                    network?: string | null
                    total_seasons?: number | null
                    total_episodes?: number | null
                    is_anime?: boolean | null
                }
            }
            catalog_books: {
                Row: {
                    id: string
                    title: string
                    cover_url: string | null
                    author: string | null
                    total_pages: number | null
                    type: 'manga' | 'novel' | null
                }
                Insert: {
                    id?: string
                    title: string
                    cover_url?: string | null
                    author?: string | null
                    total_pages?: number | null
                    type?: 'manga' | 'novel' | null
                }
                Update: {
                    id?: string
                    title?: string
                    cover_url?: string | null
                    author?: string | null
                    total_pages?: number | null
                    type?: 'manga' | 'novel' | null
                }
            }
            friendships: {
                Row: {
                    id: string
                    requester_id: string
                    receiver_id: string
                    status: 'pending' | 'accepted'
                    created_at: string
                }
                Insert: {
                    id?: string
                    requester_id: string
                    receiver_id: string
                    status?: 'pending' | 'accepted'
                    created_at?: string
                }
                Update: {
                    id?: string
                    requester_id?: string
                    receiver_id?: string
                    status?: 'pending' | 'accepted'
                    created_at?: string
                }
            }
            user_media_items: {
                Row: {
                    id: string
                    user_id: string
                    game_id: string | null
                    show_id: string | null
                    book_id: string | null
                    status: 'pending' | 'watching' | 'completed' | 'dropped'
                    progress: number | null
                    rating: number | null
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    game_id?: string | null
                    show_id?: string | null
                    book_id?: string | null
                    status: 'pending' | 'watching' | 'completed' | 'dropped'
                    progress?: number | null
                    rating?: number | null
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    game_id?: string | null
                    show_id?: string | null
                    book_id?: string | null
                    status?: 'pending' | 'watching' | 'completed' | 'dropped'
                    progress?: number | null
                    rating?: number | null
                    updated_at?: string
                }
            }
        }
        Functions: {
            track_new_item: {
                Args: {
                    p_user_id: string
                    p_type: string
                    p_external_id: string
                    p_title: string
                    p_cover_url: string | null
                    p_creator: string | null
                    p_total: number
                    p_status: string
                }
                Returns: Json
            }
        }
    }
}
