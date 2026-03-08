-- Add planning dates to board_items for content scheduling workflow
-- shoot_date: when to film the video
-- edit_date: when to edit/montage
-- publish_date: when to publish (replaces usage of scheduled_date for this purpose)

ALTER TABLE public.board_items
  ADD COLUMN IF NOT EXISTS shoot_date DATE,
  ADD COLUMN IF NOT EXISTS edit_date DATE,
  ADD COLUMN IF NOT EXISTS publish_date DATE;

-- Index for calendar queries on all three date columns
CREATE INDEX IF NOT EXISTS idx_board_shoot ON public.board_items(user_id, shoot_date);
CREATE INDEX IF NOT EXISTS idx_board_edit ON public.board_items(user_id, edit_date);
CREATE INDEX IF NOT EXISTS idx_board_publish ON public.board_items(user_id, publish_date);
