-- RUN THIS IN YOUR SUPABASE SQL EDITOR

-- 1. Create the bucket (if not exists checks are tricky in standard SQL for Supabase storage schema, but this attempts it)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Enable RLS
-- (Storage tables generally have RLS enabled by default, but ensuring policies exist is key)

-- 3. Policy: Public Read Access
CREATE POLICY "Avatar images are publicly accessible" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'avatars' );

-- 4. Policy: Authenticated Uploads (User can upload their own avatar)
CREATE POLICY "Anyone can upload an avatar" 
ON storage.objects FOR INSERT 
WITH CHECK ( bucket_id = 'avatars' AND auth.role() = 'authenticated' );

-- 5. Policy: Owner Update/Delete
CREATE POLICY "Users can update their own avatar" 
ON storage.objects FOR UPDATE 
USING ( bucket_id = 'avatars' AND auth.uid() = owner );

CREATE POLICY "Users can delete their own avatar" 
ON storage.objects FOR DELETE 
USING ( bucket_id = 'avatars' AND auth.uid() = owner );
