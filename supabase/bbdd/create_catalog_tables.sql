
-- Create tables if they don't exist
CREATE TABLE IF NOT EXISTS public.catalog_seasons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    show_id UUID REFERENCES public.catalog_shows(id) ON DELETE CASCADE,
    season_number INTEGER NOT NULL,
    title TEXT,
    overview TEXT,
    poster_path TEXT,
    air_date DATE,
    episode_count INTEGER,
    external_id TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(show_id, season_number)
);

CREATE TABLE IF NOT EXISTS public.catalog_episodes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    show_id UUID REFERENCES public.catalog_shows(id) ON DELETE CASCADE,
    season_id UUID REFERENCES public.catalog_seasons(id) ON DELETE CASCADE,
    episode_number INTEGER NOT NULL,
    title TEXT,
    overview TEXT,
    still_path TEXT,
    vote_average NUMERIC,
    runtime INTEGER,
    air_date DATE,
    external_id TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(season_id, episode_number)
);

-- Enable RLS
ALTER TABLE public.catalog_seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_episodes ENABLE ROW LEVEL SECURITY;

-- Create Policies (Public Read)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'catalog_seasons' AND policyname = 'Enable read access for all users'
    ) THEN
        CREATE POLICY "Enable read access for all users" ON public.catalog_seasons FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'catalog_episodes' AND policyname = 'Enable read access for all users'
    ) THEN
        CREATE POLICY "Enable read access for all users" ON public.catalog_episodes FOR SELECT USING (true);
    END IF;
END
$$;

-- Grant access to anon and authenticated
GRANT SELECT ON public.catalog_seasons TO anon, authenticated;
GRANT SELECT ON public.catalog_episodes TO anon, authenticated;
