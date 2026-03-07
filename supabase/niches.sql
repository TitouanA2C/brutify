-- =============================================
-- BRUTIFY — TABLE NICHES
-- À exécuter dans Supabase SQL Editor
-- =============================================

CREATE TABLE public.niches (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug         TEXT NOT NULL UNIQUE,          -- identifiant machine (ex: "fitness")
  label        TEXT NOT NULL,                 -- nom affiché (ex: "Fitness")
  hashtags_broad  TEXT[] NOT NULL DEFAULT '{}',  -- hashtags volume (2-3)
  hashtags_niche  TEXT[] NOT NULL DEFAULT '{}',  -- hashtags ciblés (2-3)
  hashtags_fr     TEXT[] NOT NULL DEFAULT '{}',  -- hashtags langue française (2-3)
  is_builtin   BOOLEAN NOT NULL DEFAULT false,
  created_by   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.niches ENABLE ROW LEVEL SECURITY;

-- Tout le monde peut lire toutes les niches
CREATE POLICY "niches_select_auth"
  ON public.niches FOR SELECT
  USING (auth.role() = 'authenticated');

-- Tout le monde peut créer une niche
CREATE POLICY "niches_insert_auth"
  ON public.niches FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Seul le créateur peut mettre à jour sa niche (les built-in ne peuvent pas être modifiées)
CREATE POLICY "niches_update_own"
  ON public.niches FOR UPDATE
  USING (auth.uid() = created_by AND is_builtin = false);

-- Seul le créateur peut supprimer sa niche
CREATE POLICY "niches_delete_own"
  ON public.niches FOR DELETE
  USING (auth.uid() = created_by AND is_builtin = false);

-- =============================================
-- SEED — Niches built-in
-- =============================================

INSERT INTO public.niches (slug, label, hashtags_broad, hashtags_niche, hashtags_fr, is_builtin) VALUES
  ('fitness',    'Fitness',    ARRAY['fitness','fitnesscoach'],           ARRAY['coachfitness','coachingfitness'],      ARRAY['coachfitnessfr','fitnessfrance'],        true),
  ('business',   'Business',   ARRAY['entrepreneur','businesscoach'],     ARRAY['solopreneur','mindsetentrepreneur'],   ARRAY['entrepreneurfr','businessfrance'],       true),
  ('finance',    'Finance',    ARRAY['investissement','finance'],         ARRAY['libertefin','intelligencefinanciere'], ARRAY['investissementfr','financepersonnelle'], true),
  ('mindset',    'Mindset',    ARRAY['developpementpersonnel','mindset'], ARRAY['croissancepersonnelle','coachingvie'], ARRAY['developpementpersonnelfr','coachmindset'], true),
  ('nutrition',  'Nutrition',  ARRAY['nutrition','nutritioncoach'],       ARRAY['dietetique','alimentation'],          ARRAY['nutritionfrance','coachnutrition'],      true),
  ('marketing',  'Marketing',  ARRAY['marketing','digitalmarketing'],     ARRAY['marketingdigital','reseauxsociaux'],  ARRAY['marketingfr','contentcreationfr'],       true),
  ('tech',       'Tech',       ARRAY['tech','developpeur'],               ARRAY['startuptech','coding'],               ARRAY['techfr','developpementfr'],              true),
  ('voyage',     'Voyage',     ARRAY['voyage','travel'],                  ARRAY['voyageur','digitalnomad'],            ARRAY['voyagefrance','blogueurvoyage'],         true),
  ('cuisine',    'Cuisine',    ARRAY['cuisine','recette'],                ARRAY['cuisinefrancaise','foodblogger'],     ARRAY['cuisinefr','recettefr'],                 true),
  ('lifestyle',  'Lifestyle',  ARRAY['lifestyle','contenu'],              ARRAY['contentcreator','influenceur'],       ARRAY['lifestylefr','influenceurfr'],           true);
