-- Actualiza la función track_new_item para NO crear duplicados en user_media_items

CREATE OR REPLACE FUNCTION track_new_item(
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

    -- ¿ya existe tracking para este user + game?
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

  ELSE
    RAISE EXCEPTION 'Invalid media type: %', p_type;
  END IF;

  RETURN jsonb_build_object('tracking_id', v_new_tracking_id, 'catalog_id', v_catalog_id);
END;
$$;

