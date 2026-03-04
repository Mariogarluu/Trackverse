
-- Create Table for Movies
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

-- Enable RLS
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
