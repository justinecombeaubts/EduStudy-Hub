# EduStudy Hub

Agenda de cours & Hub de révision augmenté par l'IA — accompagne l'étudiant de la prise de cours à la maîtrise des examens.

**Démo :** [edustudy-hub.vercel.app](https://edustudy-hub.vercel.app/)

## Fonctionnalités

- 🗓️ **Agenda Multi-échelles** — planification des créneaux de cours (Jour, Semaine, Mois, Année), fiches de notes rattachées directement à un créneau.
- 📚 **Coin Study** — organisation et mise au propre des cours, filtrable par Unité d'Enseignement (UE) et par thématique.
- 🎴 **Professeur Sakura (IA)** — génération de flashcards et de QCM de révision à partir des cours, et mode discussion libre pour réviser.

## Stack technique

- **Front :** React (Vite) + Tailwind CSS + Lucide React
- **Backend :** fonctions serverless Vercel (`api/`) — passerelle Supabase (`api/data.js`) et génération IA (`api/ia.js`, appel direct à l'API Gemini)
- **Données :** Supabase (fiches/flashcards/QCM), avec repli LocalStorage si non configuré

## Développement local

```bash
npm install
npm run dev
```

Copier `.env.example` en `.env` et renseigner les clés nécessaires (`GEMINI_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`) — voir les commentaires du fichier. Les fonctions `api/` ne sont exécutées qu'avec `vercel dev` ou en production ; `vite` seul suffit pour l'itération UI.

## Documentation projet

- [CLAUDE.md](CLAUDE.md) — consignes de développement et charte IA & sécurité.
- [ROADMAP.md](ROADMAP.md) — historique des jalons.
- [AUDIT.md](AUDIT.md) — suivi détaillé des tâches réalisées.
