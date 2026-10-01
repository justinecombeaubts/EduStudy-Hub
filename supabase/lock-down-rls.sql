-- Migration Tâche 17 (AUDIT.md) — à exécuter une fois dans Supabase → SQL Editor → New query → Run.
-- Supprime les policies publiques créées par la Tâche 16 (clé "anon" appelée directement depuis le
-- front). Après ce script : plus aucun accès direct via l'API Supabase publique, seule la fonction
-- serveur netlify/functions/data.js (clé "service_role") peut lire/écrire ces 3 tables.
drop policy if exists "fiches_public_all" on public.fiches;
drop policy if exists "flashcards_public_all" on public.flashcards;
drop policy if exists "qcm_public_all" on public.qcm;
