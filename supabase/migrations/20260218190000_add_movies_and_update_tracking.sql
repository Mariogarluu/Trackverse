-- 1. Create Table for Movies if it doesn't exist
CREATE TABLE IF NOT EXISTS public.catalog_movies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    overview TEXT,
    poster_path TEXT,
    release_date DATE,
    runtime INTEGER, -- In minutes
    vote_average NUMERIC,
    external_id TEXT UNIQUE, -- e.g., 'movie-123'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for movies
ALTER TABLE public.catalog_movies ENABLE ROW LEVEL SECURITY;

-- Create Policies (Public Read)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'catalog_movies' AND policyname = 'Enable read access for all users'
    ) THEN
        CREATE POLICY "Enable read access for all users" ON public.catalog_movies FOR SELECT USING (true);
    END IF;
END
$$;

-- Grant access
GRANT SELECT, INSERT, UPDATE, DELETE ON public.catalog_movies TO anon, authenticated, service_role;

-- 2. Update track_new_item function to handle MOVIES and deduplication
CREATE OR REPLACE FUNCTION track_new_item(
  p_user_id UUID,
  p_type TEXT,
  p_external_id TEXT,
  p_title TEXT,
  p_cover_url TEXT,
  p_creator TEXT,
  p_total INT, -- Runtime (mins) for movies, Episodes for shows, Pages for books, TimeToBeat for games
  p_status TEXT DEFAULT 'pending'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_catalog_id UUID;
  v_existing_tracking_id UUID;
  v_new_tracking_id UUID;
BEGIN
  -- 1. Handle GAMES
  IF p_type = 'game' THEN
    SELECT id INTO v_catalog_id FROM catalog_games WHERE external_id = p_external_id LIMIT 1;
    IF v_catalog_id IS NULL THEN
      INSERT INTO catalog_games (title, cover_url, developer, time_to_beat, external_id)
      VALUES (p_title, p_cover_url, p_creator, p_total, p_external_id)
      RETURNING id INTO v_catalog_id;
    END IF;

    -- Check for existing tracking
    SELECT id INTO v_existing_tracking_id
    FROM user_media_items
    WHERE user_id = p_user_id AND game_id = v_catalog_id
    LIMIT 1;

    IF v_existing_tracking_id IS NOT NULL THEN
      v_new_tracking_id := v_existing_tracking_id;
    ELSE
      INSERT INTO user_media_items (user_id, game_id, status)
      VALUES (p_user_id, v_catalog_id, p_status)
      RETURNING id INTO v_new_tracking_id;
    END IF;

  -- 2. Handle SHOWS
  ELSIF p_type = 'show' THEN
    SELECT id INTO v_catalog_id FROM catalog_shows WHERE external_id = p_external_id LIMIT 1;
    IF v_catalog_id IS NULL THEN
      INSERT INTO catalog_shows (title, cover_url, network, total_episodes, external_id)
      VALUES (p_title, p_cover_url, p_creator, p_total, p_external_id)
      RETURNING id INTO v_catalog_id;
    END IF;

    SELECT id INTO v_existing_tracking_id
    FROM user_media_items
    WHERE user_id = p_user_id AND show_id = v_catalog_id
    LIMIT 1;

    IF v_existing_tracking_id IS NOT NULL THEN
      v_new_tracking_id := v_existing_tracking_id;
    ELSE
      INSERT INTO user_media_items (user_id, show_id, status)
      VALUES (p_user_id, v_catalog_id, p_status)
      RETURNING id INTO v_new_tracking_id;
    END IF;

  -- 3. Handle BOOKS
  ELSIF p_type = 'book' THEN
    SELECT id INTO v_catalog_id FROM catalog_books WHERE external_id = p_external_id LIMIT 1;
    IF v_catalog_id IS NULL THEN
      INSERT INTO catalog_books (title, cover_url, author, total_pages, external_id)
      VALUES (p_title, p_cover_url, p_creator, p_total, p_external_id)
      RETURNING id INTO v_catalog_id;
    END IF;

    SELECT id INTO v_existing_tracking_id
    FROM user_media_items
    WHERE user_id = p_user_id AND book_id = v_catalog_id
    LIMIT 1;

    IF v_existing_tracking_id IS NOT NULL THEN
      v_new_tracking_id := v_existing_tracking_id;
    ELSE
      INSERT INTO user_media_items (user_id, book_id, status)
      VALUES (p_user_id, v_catalog_id, p_status)
      RETURNING id INTO v_new_tracking_id;
    END IF;

  -- 4. Handle MOVIES (NEW)
  ELSIF p_type = 'movie' THEN
    SELECT id INTO v_catalog_id FROM catalog_movies WHERE external_id = p_external_id LIMIT 1;
    IF v_catalog_id IS NULL THEN
      INSERT INTO catalog_movies (title, poster_path, runtime, external_id)
      VALUES (p_title, p_cover_url, p_total, p_external_id)
      RETURNING id INTO v_catalog_id;
    END IF;

    SELECT id INTO v_existing_tracking_id
    FROM user_media_items
    WHERE user_id = p_user_id AND movie_id = v_catalog_id
    LIMIT 1;

    IF v_existing_tracking_id IS NOT NULL THEN
      v_new_tracking_id := v_existing_tracking_id;
    ELSE
      INSERT INTO user_media_items (user_id, movie_id, status)
      VALUES (p_user_id, v_catalog_id, p_status)
      RETURNING id INTO v_new_tracking_id;
    END IF;

  ELSE
    RAISE EXCEPTION 'Invalid media type: %', p_type;
  END IF;

  RETURN jsonb_build_object('tracking_id', v_new_tracking_id, 'catalog_id', v_catalog_id, 'is_new', v_existing_tracking_id IS NULL);
END;
$$;
