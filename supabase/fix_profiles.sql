-- Crea perfiles faltantes para usuarios existentes en auth.users
INSERT INTO public.profiles (id, username, avatar_url, bio)
SELECT 
  u.id,
  COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', 'Viajero'),
  u.raw_user_meta_data->>'avatar_url',
  'Explorador del Trackverse'
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;

