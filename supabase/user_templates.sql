-- Persistent storage for hook templates & script structures
-- Sources: video analysis, competitive analysis (veille), manual

CREATE TABLE IF NOT EXISTS public.user_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('hook', 'structure')),
  name TEXT NOT NULL,
  template TEXT NOT NULL,
  hook_type TEXT,
  skeleton TEXT,
  description TEXT,
  source TEXT NOT NULL CHECK (source IN ('video', 'veille', 'manual')),
  source_id TEXT,
  performance_score REAL DEFAULT 0,
  use_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_templates_user ON public.user_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_user_templates_kind ON public.user_templates(user_id, kind);
CREATE INDEX IF NOT EXISTS idx_user_templates_ranking ON public.user_templates(user_id, kind, performance_score DESC, use_count DESC);

ALTER TABLE public.user_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own templates" ON public.user_templates
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Function to increment use_count
CREATE OR REPLACE FUNCTION public.increment_template_use(tid UUID, uid UUID)
RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
  UPDATE public.user_templates
  SET use_count = COALESCE(use_count, 0) + 1, updated_at = now()
  WHERE id = tid AND user_id = uid;
$$;
