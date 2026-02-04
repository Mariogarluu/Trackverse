
-- 1. Drop the function to ensure clean state
DROP FUNCTION IF EXISTS public.track_new_item;

-- 2. Re-create the function
CREATE OR REPLACE FUNCTION public.track_new_item(
  p_user_id UUID,
  p_type TEXT,
  p_external_id TEXT,
  p_title TEXT,
  p_cover_url TEXT,
  p_creator TEXT,
  p_total INT,
  p_status TEXT DEFAULT 'pending'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
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

-- 3. Grant Explicit Permissions
GRANT EXECUTE ON FUNCTION public.track_new_item TO postgres, anon, authenticated, service_role;

-- 4. Force Schema Cache Reload (Important for API to see new function immediately)
NOTIFY pgrst, 'reload config';
