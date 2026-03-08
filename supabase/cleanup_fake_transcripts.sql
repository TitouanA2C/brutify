-- =============================================
-- CLEANUP — Supprimer les faux transcripts (placeholders)
-- Ces transcriptions ont été générées par le code de fallback
-- avant le fix. Elles empêchent la vraie transcription Whisper.
-- 
-- Exécuter dans Supabase SQL Editor
-- =============================================

-- D'abord, vérifier combien il y en a :
SELECT 
  t.id,
  t.video_id,
  LEFT(t.content, 100) AS content_preview,
  t.created_at
FROM public.transcriptions t
WHERE 
  t.content ILIKE '%— Hook%'
  OR t.content ILIKE '%— Développement%'
  OR t.content ILIKE '%— Point clé%'
  OR t.content ILIKE '%— CTA%'
  OR t.content ILIKE '%— Conclusion + CTA%'
  OR t.content ILIKE '%partage-la et abonne-toi%'
  OR t.content ILIKE '%[Transcription automatique de%'
  OR t.content ILIKE '%va changer ta vision%'
  OR t.content ILIKE '%première chose importante à comprendre%'
ORDER BY t.created_at DESC;

-- Puis supprimer (décommenter pour exécuter) :
-- DELETE FROM public.transcriptions
-- WHERE 
--   content ILIKE '%— Hook%'
--   OR content ILIKE '%— Développement%'
--   OR content ILIKE '%— Point clé%'
--   OR content ILIKE '%— CTA%'
--   OR content ILIKE '%— Conclusion + CTA%'
--   OR content ILIKE '%partage-la et abonne-toi%'
--   OR content ILIKE '%[Transcription automatique de%'
--   OR content ILIKE '%va changer ta vision%'
--   OR content ILIKE '%première chose importante à comprendre%';

-- Vérifier aussi les fausses analyses (placeholders générés par generatePlaceholderAnalysis) :
SELECT 
  a.id,
  a.video_id,
  LEFT(a.hook_analysis, 80) AS hook_preview,
  a.created_at
FROM public.video_analyses a
WHERE 
  a.hook_analysis ILIKE '%tension cognitive immédiate%'
  OR a.hook_analysis ILIKE '%contredit une croyance populaire%'
  OR a.structure_analysis ILIKE '%Structure narrative en 4 actes détectée%'
  OR a.style_analysis ILIKE '%Ton conversationnel et direct — adapté à la cible 18-34 ans%'
ORDER BY a.created_at DESC;

-- Supprimer les fausses analyses (décommenter pour exécuter) :
-- DELETE FROM public.video_analyses
-- WHERE 
--   hook_analysis ILIKE '%tension cognitive immédiate%'
--   OR hook_analysis ILIKE '%contredit une croyance populaire%'
--   OR structure_analysis ILIKE '%Structure narrative en 4 actes détectée%'
--   OR style_analysis ILIKE '%Ton conversationnel et direct — adapté à la cible 18-34 ans%';
