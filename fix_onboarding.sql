
-- 1. Add external_id to Catalog Tables (if not exists)
ALTER TABLE catalog_games ADD COLUMN IF NOT EXISTS external_id TEXT UNIQUE;
ALTER TABLE catalog_shows ADD COLUMN IF NOT EXISTS external_id TEXT UNIQUE;
ALTER TABLE catalog_books ADD COLUMN IF NOT EXISTS external_id TEXT UNIQUE;

-- 2. Create the Tracking Function (Bypasses RLS)
CREATE OR REPLACE FUNCTION track_new_item(
  p_user_id UUID,
  p_type TEXT,
  p_external_id TEXT,
  p_title TEXT,
  p_cover_url TEXT,
  p_creator TEXT, -- developer / network / author
  p_total INT,    -- time_to_beat / total_episodes / total_pages
  p_status TEXT DEFAULT 'pending'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- CRITICAL: Runs with creator privileges to bypass RLS
AS $$
DECLARE
  v_catalog_id UUID;
  v_new_tracking_id UUID;
BEGIN
  -- Handle GAMES
  IF p_type = 'game' THEN
    SELECT id INTO v_catalog_id FROM catalog_games WHERE external_id = p_external_id LIMIT 1;
    
    IF v_catalog_id IS NULL THEN
      INSERT INTO catalog_games (title, cover_url, developer, time_to_beat, external_id)
      VALUES (p_title, p_cover_url, p_creator, p_total, p_external_id)
      RETURNING id INTO v_catalog_id;
    END IF;

    INSERT INTO user_media_items (user_id, game_id, status)
    VALUES (p_user_id, v_catalog_id, p_status)
    RETURNING id INTO v_new_tracking_id;

  -- Handle SHOWS
  ELSIF p_type = 'show' THEN
    SELECT id INTO v_catalog_id FROM catalog_shows WHERE external_id = p_external_id LIMIT 1;
    
    IF v_catalog_id IS NULL THEN
      INSERT INTO catalog_shows (title, cover_url, network, total_episodes, external_id)
      VALUES (p_title, p_cover_url, p_creator, p_total, p_external_id)
      RETURNING id INTO v_catalog_id;
    END IF;

    INSERT INTO user_media_items (user_id, show_id, status)
    VALUES (p_user_id, v_catalog_id, p_status)
    RETURNING id INTO v_new_tracking_id;

  -- Handle BOOKS
  ELSIF p_type = 'book' THEN
    SELECT id INTO v_catalog_id FROM catalog_books WHERE external_id = p_external_id LIMIT 1;
    
    IF v_catalog_id IS NULL THEN
      INSERT INTO catalog_books (title, cover_url, author, total_pages, external_id)
      VALUES (p_title, p_cover_url, p_creator, p_total, p_external_id)
      RETURNING id INTO v_catalog_id;
    END IF;

    INSERT INTO user_media_items (user_id, book_id, status)
    VALUES (p_user_id, v_catalog_id, p_status)
    RETURNING id INTO v_new_tracking_id;

  ELSE
    RAISE EXCEPTION 'Invalid media type: %', p_type;
  END IF;

  RETURN jsonb_build_object('success', true, 'tracking_id', v_new_tracking_id, 'catalog_id', v_catalog_id);
END;
$$;
