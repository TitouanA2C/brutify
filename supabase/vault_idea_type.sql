-- Add 'idea' type to vault_items and metadata column for structured data

ALTER TABLE public.vault_items
  DROP CONSTRAINT IF EXISTS vault_items_type_check;

ALTER TABLE public.vault_items
  ADD CONSTRAINT vault_items_type_check
  CHECK (type IN ('video', 'script', 'manual', 'ai', 'idea'));

ALTER TABLE public.vault_items
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
