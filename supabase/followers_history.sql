-- Migration: followers history tracking
-- Run this in the Supabase SQL editor

CREATE TABLE IF NOT EXISTS public.followers_history (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id  uuid        NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  followers   integer     NOT NULL,
  scraped_at  timestamptz NOT NULL DEFAULT now()
);

-- Index for fast per-creator lookups sorted by date
CREATE INDEX IF NOT EXISTS followers_history_creator_scraped_idx
  ON public.followers_history (creator_id, scraped_at DESC);

-- RLS: service role only (cron + scraping routes use service client)
ALTER TABLE public.followers_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access"
  ON public.followers_history
  USING (true)
  WITH CHECK (true);
