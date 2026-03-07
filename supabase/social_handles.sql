-- Migration: add social handle fields to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS instagram_handle TEXT,
  ADD COLUMN IF NOT EXISTS tiktok_handle    TEXT,
  ADD COLUMN IF NOT EXISTS youtube_handle   TEXT;
