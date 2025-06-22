-- Create user_profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    email TEXT NOT NULL,
    full_name TEXT,
    bio TEXT,
    location TEXT,
    website TEXT,
    occupation TEXT,
    company TEXT,
    education TEXT,
    interests TEXT[] DEFAULT '{}',
    goals TEXT[] DEFAULT '{}',
    avatar_url TEXT,
    phone TEXT,
    linkedin TEXT,
    twitter TEXT,
    github TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own profile" ON public.user_profiles
    FOR DELETE USING (auth.uid() = user_id);

-- Create updated_at trigger (reuse the function from user_settings)
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Create avatars storage bucket (run this in Supabase storage if not exists)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- Create storage policies for avatars
-- CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
--     FOR SELECT USING (bucket_id = 'avatars');

-- CREATE POLICY "Users can upload their own avatar" ON storage.objects
--     FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- CREATE POLICY "Users can update their own avatar" ON storage.objects
--     FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- CREATE POLICY "Users can delete their own avatar" ON storage.objects
--     FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
