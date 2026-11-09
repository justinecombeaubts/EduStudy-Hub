-- Migration : planning rempli à la main (créneaux → cours choisi), événements libres de l'agenda
-- et espace Exercices & Livrables.
-- À exécuter une fois dans Supabase → SQL Editor → New query → Run.
-- Même forme générique et même verrouillage RLS (deny-all, accès via /api/data uniquement)
-- que les tables de schema.sql.

create table if not exists public.creneaux (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.livrables (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.creneaux enable row level security;
alter table public.livrables enable row level security;

create table if not exists public.evenements (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.evenements enable row level security;
