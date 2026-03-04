-- Permitir que usuarios autenticados inserten entradas en los catálogos

-- Games
CREATE POLICY "Users can insert catalog games"
ON catalog_games
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Shows
CREATE POLICY "Users can insert catalog shows"
ON catalog_shows
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Books
CREATE POLICY "Users can insert catalog books"
ON catalog_books
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

