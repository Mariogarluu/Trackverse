-- Evitar que un usuario tenga el mismo ítem dos veces en user_media_items

DO $$
BEGIN
  -- Limpiar duplicados existentes antes de crear las restricciones únicas
  -- Duplicados de juegos
  DELETE FROM user_media_items a
  USING user_media_items b
  WHERE a.id < b.id
    AND a.user_id = b.user_id
    AND a.game_id IS NOT NULL
    AND a.game_id = b.game_id;

  -- Duplicados de series
  DELETE FROM user_media_items a
  USING user_media_items b
  WHERE a.id < b.id
    AND a.user_id = b.user_id
    AND a.show_id IS NOT NULL
    AND a.show_id = b.show_id;

  -- Duplicados de libros
  DELETE FROM user_media_items a
  USING user_media_items b
  WHERE a.id < b.id
    AND a.user_id = b.user_id
    AND a.book_id IS NOT NULL
    AND a.book_id = b.book_id;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_unique_game_tracking'
  ) THEN
    ALTER TABLE user_media_items
    ADD CONSTRAINT user_unique_game_tracking
    UNIQUE (user_id, game_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_unique_show_tracking'
  ) THEN
    ALTER TABLE user_media_items
    ADD CONSTRAINT user_unique_show_tracking
    UNIQUE (user_id, show_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_unique_book_tracking'
  ) THEN
    ALTER TABLE user_media_items
    ADD CONSTRAINT user_unique_book_tracking
    UNIQUE (user_id, book_id);
  END IF;
END;
$$;

