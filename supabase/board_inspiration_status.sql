-- Ajouter le status 'inspiration' aux board_items (vidéos d'inspiration)
ALTER TABLE public.board_items
  DROP CONSTRAINT IF EXISTS board_items_status_check;

ALTER TABLE public.board_items
  ADD CONSTRAINT board_items_status_check
  CHECK (status IN ('inspiration', 'idea', 'draft', 'in_progress', 'scheduled', 'published'));
