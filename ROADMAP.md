# ROADMAP — EduStudy Hub

Historique des jalons validés. Détails opérationnels dans `AUDIT.md` (jetable), consignes dans `CLAUDE.md`.

## J1 — Agenda Multi-échelles & Rattachement de fiches (2026-08-31)

- ✅ **Setup initial & Sécurité** — Vite + React + Tailwind CSS + Lucide React ; `.gitignore` et `.env.example` (Zero Secret).
- ✅ **Jeu de données fictives (initial)** — `src/data/mockCourses.json` (5 cours fictifs : titre, jour, horaire, UE, statut). *Remplacé ensuite par la grille réelle du programme (voir ci-dessous).*
- ✅ **Layout visuel de l'Accueil** — `Sidebar`, `Header`, `WelcomeBanner`, `AgendaView` (onglets Jour/Semaine/Mois/Année, grille horaire Semaine branchée sur les données), responsive.
- ✅ **Création et édition de fiche de cours** — bouton flottant `+`, modale `CourseFicheModal` (choix du cours, titre, UE, notes), sauvegarde en state local avec mise à jour dynamique de l'agenda (badge de statut de fiche).
- ✅ **Refonte DA Cozy Girly Pastel** — palette rose/pêche (`cream`, `peach` ajoutés à `tailwind.config.js`) appliquée à l'ensemble des écrans existants (Sidebar, Header, WelcomeBanner, AgendaView, modale). Remplace la première version bleu/indigo.
- ✅ **Vues Jour, Mois et Année** — implémentation complète et connectée à `mockCourses.json` : fil d'actualité horaire (Jour), grille calendaire avec mini-badges pastel par UE (Mois), heatmap de charge sur 12 mois (Année) ; navigation temporelle (Précédent/Suivant/Aujourd'hui) partagée par les 4 vues, plus navigation croisée (jour → Jour, mois → Mois).
- ✅ **Coin Study** — `mockNotes.json` (10 fiches fictives, UE1 Droit/UE2 Finance/UE3 Marketing/UE4 Dev Web), `StudyView` (recherche, filtres UE/Thème/Statut, grille de `FicheCard`), `NoteModal` (lecture/édition complète + emplacement J3 "Générer des Flashcards IA").
- ✅ **Recherche globale du Header & filtrage avancé** — champ de recherche du `Header` connecté (état global dans `App.jsx`), sélecteur de type Tout/Cours/UE/Thème + valeur dynamique, filtrage temps réel sur l'Agenda (cours/créneaux) et le Coin Study (fiches), états vides gérés, logique de correspondance mutualisée (`src/utils/searchFilter.js`).
- ✅ **Correctif final : WelcomeBanner connecté & persistance LocalStorage** — le compteur "fiches en attente" reflète désormais les vraies données Coin Study (bouton cliquable vers Coin Study) ; les fiches créées depuis l'Agenda et éditées dans le Coin Study sont persistées en LocalStorage (`src/utils/useLocalStorage.js`) et survivent à un rafraîchissement de page.
- ✅ **Grille de cours réelle (programme officiel B3 AIA)** — `mockCourses.json` reconstruit à partir du programme de formation officiel et du calendrier d'alternance réel : rentrée 08/10/2026, rythme Lundi-Mercredi Entreprise / Jeudi-Vendredi école, semaine finale 5 jours (14-18/06/2027), 69 sessions de cours réelles (UE0 à UE9) aux vraies dates. Modèle de données hybride (`date` ponctuelle ou `jour` récurrent) introduit dans `src/utils/agendaDates.js`.
- ✅ **Bornage de la grille + Boost Camp** — l'Entreprise récurrente est bornée du 08/10/2026 au 31/07/2027 (`startDate`/`endDate`) pour ne plus apparaître hors période de formation ; ajout du Boost Camp (31/08 → 02/09/2026) avant la rentrée officielle.

**Reste à faire (hors périmètre J1) :** génération de flashcards IA (bouton placeholder déjà en place dans `NoteModal`).
