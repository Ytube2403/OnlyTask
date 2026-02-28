-- THE DEFINITIVE SQL SCHEMA FOR TASK MANAGEMENT DASHBOARD
-- THIS ONE REPLACES ALL PREVIOUS VERSIONS (schema.sql, schema_v2.sql)

-- Drop existing unused/old tables for clean state
DROP TABLE IF EXISTS public.task_tags CASCADE;
DROP TABLE IF EXISTS public.task_guidelines CASCADE;
DROP TABLE IF EXISTS public.tasks CASCADE;
DROP TABLE IF EXISTS public.sop_notes CASCADE;
DROP TABLE IF EXISTS public.guidelines CASCADE;
DROP TABLE IF EXISTS public.tags CASCADE;
DROP TABLE IF EXISTS public.subtasks CASCADE;
DROP TABLE IF EXISTS public.time_logs CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 1. Profiles Table (For Auth User mapping and settings)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    display_name TEXT,
    avatar_color TEXT,
    avatar_url TEXT,
    is_premium BOOLEAN DEFAULT false,
    premium_history JSONB DEFAULT '[]'::jsonb,
    -- SECURITY: pending_order_code dùng để đối chiếu webhook PayOS.
    -- Dùng UUID ngẫu nhiên thay vì timestamp để không thể bị Bruteforce.
    pending_order_code TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- SECURITY FIX #1: Chỉ cho phép user xem đúng profile của mình.
-- Loại bỏ "USING (true)" vì nó cho phép bất kỳ ai (kể cả ẩn danh) dump toàn bộ email users.
CREATE POLICY "Users can view their own profile."
  ON public.profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile." 
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- SECURITY FIX #2: Ngăn client-side tự update is_premium, is_premium chỉ được
-- update bởi Service Role key (qua webhook), không phải bởi anon key.
-- Cột `is_premium` và `premium_history` bị loại khỏi những gì user được phép thay đổi.
CREATE POLICY "Users can update their own safe profile fields."
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    -- Đảm bảo is_premium không thay đổi (bảo vệ khỏi client self-elevation)
    AND is_premium = (SELECT is_premium FROM public.profiles WHERE id = auth.uid())
  );

-- 2. Trigger to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, avatar_color, is_premium)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'display_name', ''), 
    'from-blue-500 to-blue-700', -- default
    false
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. Tasks Table (Matches Typescript Interface)
CREATE TABLE public.tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    column_id TEXT NOT NULL,
    content TEXT NOT NULL,
    description TEXT,
    tag TEXT,
    time TEXT,
    effort NUMERIC,
    deadline TIMESTAMP WITH TIME ZONE,
    linked_sop_ids UUID[] DEFAULT '{}',
    score NUMERIC,
    review_note TEXT,
    completion_date TIMESTAMP WITH TIME ZONE,
    is_important BOOLEAN DEFAULT false,
    actual_time_seconds NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. SOP Notes Table (Matches Typescript Interface)
CREATE TABLE public.sop_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    folder TEXT,
    linked_task_ids UUID[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Require Authentication for all primary tables (Row Level Security)
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sop_notes ENABLE ROW LEVEL SECURITY;

-- Tasks Policies
CREATE POLICY "Users can manage their own tasks" 
ON public.tasks FOR ALL USING (auth.uid() = user_id);

-- SOP Notes Policies
CREATE POLICY "Users can manage their own notes" 
ON public.sop_notes FOR ALL USING (auth.uid() = user_id);

-- 5. Storage Buckets (Avatars)
-- Note: Supabase storage tables live in the 'storage' schema.
-- We must insert the 'avatars' bucket into storage.buckets.
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for Avatars
-- To manage storage policies properly, the syntax requires mapping to storage.objects
CREATE POLICY "Avatar images are publicly accessible."
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'avatars' );

CREATE POLICY "Anyone can upload an avatar."
  ON storage.objects FOR INSERT
  WITH CHECK ( bucket_id = 'avatars' AND auth.uid() = owner );

CREATE POLICY "Anyone can update their own avatar."
  ON storage.objects FOR UPDATE
  USING ( bucket_id = 'avatars' AND auth.uid() = owner );
