CREATE TABLE IF NOT EXISTS catalog_seasons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  show_id UUID REFERENCES catalog_shows(id) ON DELETE CASCADE NOT NULL,
  season_number INT NOT NULL,
  title TEXT,
  overview TEXT,
  episode_count INT,
  air_date DATE,
  poster_path TEXT,
  external_id TEXT, -- TMDB ID for the season if needed, or composite
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(show_id, season_number)
);

-- 2. CATALOG EPISODES
CREATE TABLE IF NOT EXISTS catalog_episodes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  show_id UUID REFERENCES catalog_shows(id) ON DELETE CASCADE NOT NULL,
  season_id UUID REFERENCES catalog_seasons(id) ON DELETE CASCADE NOT NULL,
  episode_number INT NOT NULL,
  title TEXT,
  overview TEXT,
  air_date DATE,
  still_path TEXT,
  vote_average NUMERIC(3, 1),
  runtime INT,
  external_id TEXT UNIQUE, -- TMDB ID for the episode
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(season_id, episode_number)
);

-- 3. USER EPISODES (Tracking)
CREATE TABLE IF NOT EXISTS user_episodes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  show_id UUID REFERENCES catalog_shows(id) ON DELETE CASCADE NOT NULL, -- optimization for querying
  season_id UUID REFERENCES catalog_seasons(id) ON DELETE CASCADE NOT NULL, -- optimization
  episode_id UUID REFERENCES catalog_episodes(id) ON DELETE CASCADE NOT NULL,
  watched BOOLEAN DEFAULT FALSE,
  watched_at TIMESTAMP WITH TIME ZONE,
  rating INT CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, episode_id)
);

-- 4. RLS POLICIES
ALTER TABLE catalog_seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog_episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_episodes ENABLE ROW LEVEL SECURITY;

-- Public read for catalog (idempotente)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'catalog_seasons' AND policyname = 'Seasons are viewable by everyone'
  ) THEN
    CREATE POLICY "Seasons are viewable by everyone" ON catalog_seasons FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'catalog_episodes' AND policyname = 'Episodes are viewable by everyone'
  ) THEN
    CREATE POLICY "Episodes are viewable by everyone" ON catalog_episodes FOR SELECT USING (true);
  END IF;
END
$$;

-- User Episodes policies (idempotentes)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_episodes' AND policyname = 'Users can view their own episode progress'
  ) THEN
    CREATE POLICY "Users can view their own episode progress" 
    ON user_episodes FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_episodes' AND policyname = 'Users can insert their own episode progress'
  ) THEN
    CREATE POLICY "Users can insert their own episode progress" 
    ON user_episodes FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_episodes' AND policyname = 'Users can update their own episode progress'
  ) THEN
    CREATE POLICY "Users can update their own episode progress" 
    ON user_episodes FOR UPDATE USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_episodes' AND policyname = 'Users can delete their own episode progress'
  ) THEN
    CREATE POLICY "Users can delete their own episode progress" 
    ON user_episodes FOR DELETE USING (auth.uid() = user_id);
  END IF;
END
$$;
