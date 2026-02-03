-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES (Extends auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. CATALOG TABLES (Static Data)
CREATE TABLE catalog_games (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  cover_url TEXT,
  developer TEXT,
  release_year INT,
  time_to_beat INT, -- minutes
  platforms TEXT[]
);

CREATE TABLE catalog_shows (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  cover_url TEXT,
  network TEXT,
  total_seasons INT,
  total_episodes INT,
  is_anime BOOLEAN DEFAULT FALSE
);

CREATE TABLE catalog_books (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  cover_url TEXT,
  author TEXT,
  total_pages INT,
  type TEXT CHECK (type IN ('manga', 'novel'))
);

-- 3. SOCIAL
CREATE TABLE friendships (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  requester_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT CHECK (status IN ('pending', 'accepted')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(requester_id, receiver_id)
);

-- 4. TRACKING (CORE - Polymorphic)
CREATE TABLE user_media_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Polymorphic Foreign Keys
  game_id UUID REFERENCES catalog_games(id),
  show_id UUID REFERENCES catalog_shows(id),
  book_id UUID REFERENCES catalog_books(id),
  
  status TEXT CHECK (status IN ('pending', 'watching', 'completed', 'dropped')) NOT NULL,
  progress INT DEFAULT 0, -- minutes, episodes, or pages
  rating INT CHECK (rating >= 1 AND rating <= 5),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraint: Exactly one FK must be set
  CONSTRAINT one_media_type_not_null CHECK (
    (game_id IS NOT NULL AND show_id IS NULL AND book_id IS NULL) OR
    (game_id IS NULL AND show_id IS NOT NULL AND book_id IS NULL) OR
    (game_id IS NULL AND show_id IS NULL AND book_id IS NOT NULL)
  )
);

-- 5. ROW LEVEL SECURITY (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog_shows ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_media_items ENABLE ROW LEVEL SECURITY;

-- Policies (Basic examples for now)

-- Profiles: Public read, owner update
CREATE POLICY "Public profiles are viewable by everyone" 
ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" 
ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE USING (auth.uid() = id);

-- Catalog: Public read only
CREATE POLICY "Catalog games are viewable by everyone" 
ON catalog_games FOR SELECT USING (true);
CREATE POLICY "Catalog shows are viewable by everyone" 
ON catalog_shows FOR SELECT USING (true);
CREATE POLICY "Catalog books are viewable by everyone" 
ON catalog_books FOR SELECT USING (true);

-- Friendships: Viewable by involved parties
CREATE POLICY "Users can view their friendships" 
ON friendships FOR SELECT 
USING (auth.uid() = requester_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can create friendship requests" 
ON friendships FOR INSERT 
WITH CHECK (auth.uid() = requester_id);

-- Tracking: Viewable by owner (and potentially friends in future)
CREATE POLICY "Tracked items are viewable by everyone" 
ON user_media_items FOR SELECT USING (true);

CREATE POLICY "Users can insert their own tracked items" 
ON user_media_items FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tracked items" 
ON user_media_items FOR UPDATE 
USING (auth.uid() = user_id);
