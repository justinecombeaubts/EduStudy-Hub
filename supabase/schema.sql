-- EduStudy Hub — schéma Supabase (AUDIT.md J4 : BDD applicative, remplace LocalStorage comme
-- source de vérité pour fiches / flashcards / QCM, cross-device).
--
-- À exécuter une fois dans Supabase → SQL Editor → New query → Run.
--
-- Forme générique volontaire : {id text primary key, data jsonb, updated_at timestamptz} pour
-- les 3 tables — un enregistrement par élément de tableau, `data` porte exactement le même objet
-- JS que celui déjà stocké en LocalStorage aujourd'hui (voir src/utils/useSupabaseStore.js).
-- Pas de colonnes dédiées par champ : dataset petit (usage bootcamp), priorité à la simplicité
-- et à la stabilité si le modèle de fiche évolue (pas de migration de colonnes à refaire).

create table if not exists public.fiches (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.flashcards (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.qcm (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

-- Row Level Security : activée, SANS AUCUNE policy → deny-all pour les clés "anon"/"authenticated"
-- (AUDIT.md Tâche 17 — correctif sécurité). Le navigateur ne détient plus aucune clé Supabase :
-- toute la lecture/écriture passe par netlify/functions/data.js, seule à détenir la clé
-- "service_role" (secrète, jamais exposée au client) — qui contourne RLS par nature, donc n'a besoin
-- d'aucune policy pour fonctionner.
--
-- (Historique : une première version de ce schéma avait des policies publiques via la clé "anon",
-- appelée directement depuis le front — voir Tâche 16. Remplacé par la passerelle serveur ci-dessus,
-- voir supabase/lock-down-rls.sql pour la migration si ces policies existent déjà chez toi.)
alter table public.fiches enable row level security;
alter table public.flashcards enable row level security;
alter table public.qcm enable row level security;
