-- Supabase Migration: Novel World Database Schema
-- Year: 2026

-- Enable UUID generation extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================================================
-- 1. BADGES TABLE
-- =========================================================================
CREATE TABLE public.badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    icon VARCHAR(100) NOT NULL, -- Holds emoji or Lucide icon class/identifier
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =========================================================================
-- 2. USERS (PROFILES) TABLE
-- =========================================================================
-- This table mirrors the Supabase Auth metadata for public access.
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    avatar_url TEXT,
    bio TEXT,
    role VARCHAR(20) DEFAULT 'user' NOT NULL CONSTRAINT chk_user_role CHECK (role IN ('user', 'admin')),
    badge_id UUID REFERENCES public.badges(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =========================================================================
-- 3. NOVELS TABLE
-- =========================================================================
CREATE TABLE public.novels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    cover_image TEXT,
    category VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' NOT NULL CONSTRAINT chk_novel_status CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for filtering and searching novels rapidly
CREATE INDEX idx_novels_category ON public.novels(category);
CREATE INDEX idx_novels_status ON public.novels(status);
CREATE INDEX idx_novels_author ON public.novels(author_id);

-- =========================================================================
-- 4. CHAPTERS TABLE
-- =========================================================================
CREATE TABLE public.chapters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    novel_id UUID NOT NULL REFERENCES public.novels(id) ON DELETE CASCADE,
    chapter_number INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT uq_novel_chapter_number UNIQUE (novel_id, chapter_number)
);

-- Index for retrieving specific chapters ordered
CREATE INDEX idx_chapters_novel_ordering ON public.chapters(novel_id, chapter_number ASC);

-- =========================================================================
-- 5. COMMENTS TABLE
-- =========================================================================
CREATE TABLE public.comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    novel_id UUID NOT NULL REFERENCES public.novels(id) ON DELETE CASCADE,
    comment_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX idx_comments_novel ON public.comments(novel_id);

-- =========================================================================
-- 6. BOOKMARKS TABLE
-- =========================================================================
CREATE TABLE public.bookmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    novel_id UUID NOT NULL REFERENCES public.novels(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT uq_user_novel_bookmark UNIQUE (user_id, novel_id)
);

-- =========================================================================
-- 7. LIKES TABLE
-- =========================================================================
CREATE TABLE public.likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    novel_id UUID NOT NULL REFERENCES public.novels(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT uq_user_novel_like UNIQUE (user_id, novel_id)
);

-- =========================================================================
-- HELPER FUNCTIONS FOR ROW LEVEL SECURITY (RLS)
-- =========================================================================

-- Security definer function to avoid circular policy dependency when resolving admin role
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN COALESCE(
        (SELECT role = 'admin' FROM public.users WHERE id = auth.uid()),
        FALSE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =========================================================================
-- AUTOMATED USER CREATION TRIGGER (AUTH LINKING)
-- =========================================================================
-- This trigger automatically fires when a user completes standard Supabase Auth signup.
-- It populates our public.users profile safely and checks for pre-defined admins by email.
CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS TRIGGER AS $$
DECLARE
    v_username TEXT;
    v_role TEXT := 'user';
BEGIN
    -- Derive a default unique username from email prefix
    v_username := COALESCE(
        NEW.raw_user_meta_data->>'username', 
        SPLIT_PART(NEW.email, '@', 1)
    );

    -- Ensure uniqueness for username
    WHILE EXISTS (SELECT 1 FROM public.users WHERE username = v_username) LOOP
        v_username := v_username || floor(random() * 100)::text;
    END LOOP;

    -- Make the first user or designated email admin automatically (optional premium detail)
    IF NEW.email = 'siyamrahman1268@gmail.com' THEN
        v_role := 'admin';
    END IF;

    INSERT INTO public.users (id, username, email, avatar_url, role)
    VALUES (
        NEW.id,
        v_username,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150'),
        v_role
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger hooking public.users dynamic entry to auth.users
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_signup();


-- =========================================================================
-- NOVEL UPDATE SECURITY TRIGGER
-- =========================================================================
-- Reverts status to 'pending' every time a non-admin edits a novel, demanding re-approval!
CREATE OR REPLACE FUNCTION public.handle_novel_update_approval()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT public.is_admin() THEN
        NEW.status := 'pending';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_novel_updated_safety
    BEFORE UPDATE ON public.novels
    FOR EACH ROW EXECUTE FUNCTION public.handle_novel_update_approval();


-- =========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================

-- Enable RLS across all schema entities
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.novels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

----------------------------------------------------------------------------
-- Badges Policies
----------------------------------------------------------------------------
CREATE POLICY "Allow public read access to badges"
    ON public.badges FOR SELECT
    USING (TRUE);

CREATE POLICY "Allow admin full control on badges"
    ON public.badges FOR ALL
    USING (public.is_admin());

----------------------------------------------------------------------------
-- Users Policies
----------------------------------------------------------------------------
CREATE POLICY "Allow public read access to profiles"
    ON public.users FOR SELECT
    USING (TRUE);

CREATE POLICY "Allow users to update own profile"
    ON public.users FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id AND 
        -- Enforce that non-admins cannot hijack higher-privileged roles or alter their badges manually
        (
            public.is_admin() OR 
            (
                role = (SELECT role FROM public.users WHERE id = auth.uid()) AND
                badge_id IS NOT DISTINCT FROM (SELECT badge_id FROM public.users WHERE id = auth.uid())
            )
        )
    );

CREATE POLICY "Allow admin full control on profiles"
    ON public.users FOR ALL
    USING (public.is_admin());

----------------------------------------------------------------------------
-- Novels Policies
----------------------------------------------------------------------------
CREATE POLICY "Allow public to view approved novels"
    ON public.novels FOR SELECT
    USING (status = 'approved');

CREATE POLICY "Allow authors to view own pending/rejected novels"
    ON public.novels FOR SELECT
    USING (auth.uid() = author_id);

CREATE POLICY "Allow admin full select access on novels"
    ON public.novels FOR SELECT
    USING (public.is_admin());

CREATE POLICY "Allow authenticated users to create novels"
    ON public.novels FOR INSERT
    WITH CHECK (
        auth.uid() = author_id AND
        (
            (NOT public.is_admin() AND status = 'pending') OR
            public.is_admin()
        )
    );

CREATE POLICY "Allow authors to update own novels"
    ON public.novels FOR UPDATE
    USING (auth.uid() = author_id OR public.is_admin())
    WITH CHECK (auth.uid() = author_id OR public.is_admin());

CREATE POLICY "Allow authors to delete own novels"
    ON public.novels FOR DELETE
    USING (auth.uid() = author_id OR public.is_admin());

----------------------------------------------------------------------------
-- Chapters Policies
----------------------------------------------------------------------------
CREATE POLICY "Allow public to view approved novel chapters"
    ON public.chapters FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.novels 
            WHERE novels.id = chapters.novel_id AND novels.status = 'approved'
        )
    );

CREATE POLICY "Allow authors and admins to view all chapters"
    ON public.chapters FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.novels 
            WHERE novels.id = chapters.novel_id AND novels.author_id = auth.uid()
        ) OR public.is_admin()
    );

CREATE POLICY "Allow authors and admins to insert chapters"
    ON public.chapters FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.novels 
            WHERE novels.id = chapters.novel_id AND novels.author_id = auth.uid()
        ) OR public.is_admin()
    );

CREATE POLICY "Allow authors and admins to update chapters"
    ON public.chapters FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.novels 
            WHERE novels.id = chapters.novel_id AND novels.author_id = auth.uid()
        ) OR public.is_admin()
    );

CREATE POLICY "Allow authors and admins to delete chapters"
    ON public.chapters FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.novels 
            WHERE novels.id = chapters.novel_id AND novels.author_id = auth.uid()
        ) OR public.is_admin()
    );

----------------------------------------------------------------------------
-- Comments Policies
----------------------------------------------------------------------------
CREATE POLICY "Allow public to view comments"
    ON public.comments FOR SELECT
    USING (TRUE);

CREATE POLICY "Allow authenticated users to insert comments"
    ON public.comments FOR INSERT
    WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM public.novels
            WHERE novels.id = comments.novel_id AND novels.status = 'approved'
        )
    );

CREATE POLICY "Allow authors to update own comments"
    ON public.comments FOR UPDATE
    USING (auth.uid() = user_id OR public.is_admin())
    WITH CHECK (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Allow authors to delete own comments"
    ON public.comments FOR DELETE
    USING (auth.uid() = user_id OR public.is_admin());

----------------------------------------------------------------------------
-- Bookmarks Policies
----------------------------------------------------------------------------
CREATE POLICY "Allow users to view own bookmarks"
    ON public.bookmarks FOR SELECT
    USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Allow users to create bookmarks for themselves"
    ON public.bookmarks FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to delete own bookmarks"
    ON public.bookmarks FOR DELETE
    USING (auth.uid() = user_id OR public.is_admin());

----------------------------------------------------------------------------
-- Likes Policies
----------------------------------------------------------------------------
CREATE POLICY "Allow public to read likes count"
    ON public.likes FOR SELECT
    USING (TRUE);

CREATE POLICY "Allow users to create likes for themselves"
    ON public.likes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to delete own likes"
    ON public.likes FOR DELETE
    USING (auth.uid() = user_id OR public.is_admin());


-- =========================================================================
-- 8. STORAGE BUCKET SECURE POLICIES Configuration
-- =========================================================================

-- Ensure all required storage buckets exist and are public for reading
INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('covers', 'covers', true),
    ('novel-covers', 'novel-covers', true),
    ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Enforce Row Level Security (RLS) on storage objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Allow public read access to cover images and avatars
CREATE POLICY "Allow public read access to storage assets"
    ON storage.objects FOR SELECT
    USING (bucket_id IN ('covers', 'novel-covers', 'avatars'));

-- Allow authenticated users to upload cover or profile images with their unique user ID prefix
CREATE POLICY "Allow authenticated users to upload own assets"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        (bucket_id = 'covers' AND name LIKE 'covers/' || auth.uid()::text || '_%') OR
        (bucket_id IN ('novel-covers', 'avatars') AND (name LIKE auth.uid()::text || '_%' OR name LIKE auth.uid()::text || '.%'))
    );

-- Allow authenticated users to update their own assets
CREATE POLICY "Allow users to update own assets"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
        (bucket_id = 'covers' AND name LIKE 'covers/' || auth.uid()::text || '_%') OR
        (bucket_id IN ('novel-covers', 'avatars') AND (name LIKE auth.uid()::text || '_%' OR name LIKE auth.uid()::text || '.%'))
    );

-- Allow users to delete their own uploaded assets, or admins to delete any assets
CREATE POLICY "Allow users to delete own assets"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        (bucket_id = 'covers' AND name LIKE 'covers/' || auth.uid()::text || '_%') OR
        (bucket_id IN ('novel-covers', 'avatars') AND (name LIKE auth.uid()::text || '_%' OR name LIKE auth.uid()::text || '.%')) OR
        public.is_admin()
    );
