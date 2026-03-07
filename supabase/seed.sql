-- =============================================
-- BRUTIFY — SEED DATA
-- Hook Templates & Script Structures
-- À exécuter après schema.sql
-- =============================================


-- =============================================
-- HOOK TEMPLATES (8 types)
-- =============================================

INSERT INTO public.hook_templates (name, type, template, description, performance_score, position) VALUES

('Question Choc', 'question', 
 'Tu savais que [stat surprenante] ? Voilà pourquoi [sujet]…',
 'Pose une question inattendue qui crée un gap de curiosité. Idéal pour des sujets éducatifs ou des mythes à déconstruire.',
 85, 1),

('Déclaration Controversée', 'controversy',
 '[Affirmation provocante]. Je sais, ça fait réagir. Mais laisse-moi t''expliquer…',
 'Commence avec une opinion forte ou contre-intuitive pour provoquer une réaction émotionnelle immédiate.',
 90, 2),

('Storytelling Personnel', 'story',
 'Il y a [durée], [situation initiale]. Aujourd''hui, [résultat]. Voici comment…',
 'Partage une transformation personnelle. Crée une connexion émotionnelle et de la crédibilité.',
 80, 3),

('Résultat d''abord', 'result_first',
 '[Résultat impressionnant] en [durée]. Voici les [X] étapes exactes que j''ai suivies…',
 'Montre le résultat final en premier pour capter l''attention, puis déroule le process.',
 88, 4),

('Erreur Commune', 'mistake',
 'L''erreur n°1 que [audience cible] fait avec [sujet] (et comment la corriger)…',
 'Pointe une erreur fréquente. Crée un sentiment d''urgence et positionne comme expert.',
 82, 5),

('Liste Numérotée', 'list',
 '[X] [choses/astuces/erreurs] sur [sujet] que [bénéfice]. Le n°[X] va te surprendre…',
 'Format listicle classique. Le cerveau adore les chiffres et la promesse de surprise.',
 75, 6),

('Interpellation Directe', 'callout',
 'Si tu [situation du viewer], STOP. Regarde ça avant de [action]…',
 'Cible directement le viewer dans sa situation. Crée un sentiment de pertinence immédiate.',
 86, 7),

('Avant/Après', 'transformation',
 'Avant : [situation problème]. Après : [situation idéale]. La différence ? [teaser solution]…',
 'Contraste visuel ou narratif puissant entre deux états. Très efficace en Reels/TikTok.',
 84, 8);


-- =============================================
-- SCRIPT STRUCTURES (8 types)
-- =============================================

INSERT INTO public.script_structures (name, skeleton, description, position) VALUES

('PAS (Problem-Agitate-Solve)', 
 E'🔴 HOOK : [Accroche — identifier le problème]\n\n😤 PROBLÈME : [Décrire le problème en détail, montrer qu''on comprend]\n\n😡 AGITATION : [Amplifier la douleur — conséquences, frustration]\n\n✅ SOLUTION : [Présenter la solution étape par étape]\n\n📣 CTA : [Appel à l''action]',
 'Structure classique du copywriting. Idéale pour les vidéos qui résolvent un problème concret.',
 1),

('AIDA (Attention-Interest-Desire-Action)',
 E'⚡ ATTENTION : [Hook percutant — stat, question, déclaration choc]\n\n🧲 INTÉRÊT : [Développer avec des faits, du contexte, une histoire]\n\n🔥 DÉSIR : [Montrer le bénéfice, la transformation possible]\n\n🎯 ACTION : [CTA clair et spécifique]',
 'Structure marketing éprouvée. Parfaite pour les vidéos de vente ou de promotion.',
 2),

('Storytelling (Héros)',
 E'📖 SITUATION : [Contexte initial — le "monde ordinaire"]\n\n💥 PROBLÈME : [L''événement déclencheur — le challenge]\n\n🏔️ PÉRIPÉTIES : [Les obstacles, les échecs, les leçons]\n\n🏆 RÉSOLUTION : [Le tournant — comment tu as trouvé la solution]\n\n💡 LEÇON : [Le takeaway pour le viewer + CTA]',
 'Arc narratif du héros. Crée un maximum d''engagement émotionnel.',
 3),

('Liste à Valeur',
 E'🔢 HOOK : [X choses/erreurs/astuces sur sujet]\n\n1️⃣ POINT 1 : [Titre] — [Explication courte + exemple]\n\n2️⃣ POINT 2 : [Titre] — [Explication courte + exemple]\n\n3️⃣ POINT 3 : [Titre] — [Explication courte + exemple]\n\n(…répéter…)\n\n🎁 BONUS : [Astuce supplémentaire]\n\n📣 CTA : [Appel à l''action]',
 'Format listicle. Facile à consommer, très partageable. Bon pour les tips et erreurs.',
 4),

('Avant/Après Transformation',
 E'😰 AVANT : [Décrire la situation "avant" — douleur, frustration]\n\n🔄 LE DÉCLIC : [Ce qui a changé — la découverte ou la décision]\n\n😎 APRÈS : [La nouvelle réalité — résultats concrets]\n\n🛠️ COMMENT : [Les étapes clés de la transformation]\n\n📣 CTA : [Si toi aussi tu veux… + action]',
 'Puissant pour les transformations personnelles, les case studies, les témoignages.',
 5),

('Éducatif (Teach)',
 E'❓ HOOK : [Question ou mythe à déconstruire]\n\n📚 CONTEXTE : [Pourquoi c''est important — poser les bases]\n\n🔍 EXPLICATION : [Le cœur du contenu — enseigner pas à pas]\n\n💡 EXEMPLES : [Illustrer avec des cas concrets]\n\n📝 RÉSUMÉ : [Récap en 1-2 phrases]\n\n📣 CTA : [Sauvegarde si tu veux pas oublier + action]',
 'Pour le contenu éducatif et informatif. Positionne comme expert de la niche.',
 6),

('Contrarian (Contre-courant)',
 E'🚫 HOOK : [Opinion populaire que tu vas contredire]\n\n🤔 POURQUOI TOUT LE MONDE SE TROMPE : [Exposer l''idée reçue]\n\n🔬 LA VÉRITÉ : [Ta thèse alternative avec preuves]\n\n💣 PREUVES : [Exemples, données, expérience perso]\n\n🎯 CONCLUSION : [Résumer ta position + CTA]',
 'Prend le contre-pied d''une opinion populaire. Génère débat et partages.',
 7),

('Mini-Vlog Structuré',
 E'🎬 HOOK : [Teaser de ce qui va se passer]\n\n📍 CONTEXTE : [Où, quand, pourquoi — poser la scène]\n\n🎥 SÉQUENCE 1 : [Première partie de l''aventure/journée]\n\n🎥 SÉQUENCE 2 : [Deuxième partie — le twist ou le moment fort]\n\n🎥 SÉQUENCE 3 : [Résolution ou résultat]\n\n💭 RÉFLEXION : [Lesson learned + CTA]',
 'Pour les vlogs et le contenu lifestyle. Donne un cadre narratif au quotidien.',
 8);
