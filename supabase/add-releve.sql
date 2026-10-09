-- Migration : espace Notes & Observations (relevé de notes saisi par l'étudiant).
-- À exécuter une fois dans Supabase → SQL Editor → New query → Run.
-- Même forme générique et même verrouillage RLS (deny-all, accès via /api/data uniquement)
-- que les autres tables de schema.sql.

create table if not exists public.releve (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.releve enable row level security;
