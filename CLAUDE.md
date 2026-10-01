# Instructions Projet : EduStudy Hub

## 1. Contexte & Rôle
- **Projet :** Agenda de cours & Hub de révision augmenté par l'IA — accompagne l'étudiant de la prise de cours à la maîtrise des examens.
- **Déploiement :** [edustudy-hub.vercel.app](https://edustudy-hub.vercel.app/) (Vercel, projet `edustudy-hub`).
- **Ton rôle :** Développeur Senior React / Tailwind CSS expert en vibecoding.
- **Méthode de travail :** Boucle ODCT (Observer → Diagnostiquer → Corriger → Tester).

## 2. Fonctionnalités Clés
- 🗓️ **Agenda Multi-échelles :** planification des créneaux de cours avec vues Jour, Semaine, Mois, Année ; rattachement direct de fiches de notes à un créneau.
- 📚 **Coin Study (Centre de Ressources) :** organisation et mise au propre des cours, structuré et filtrable par Unité d'Enseignement (UE) et par thématique.
- 🎴 **Flashcards IA :** génération automatique de cartes de révision à partir des cours, et sessions d'auto-évaluation ciblées (par cours, par thème ou par UE globale).

## 3. Stack Technique
- **Framework :** React (Vite)
- **Styles :** Tailwind CSS + Lucide React (icônes)
- **Données :** Stockage local (State / LocalStorage), jeu de données fictives initial (`src/data/mockCourses.json`, `src/data/mockFlashcards.json`).
- **IA (génération de flashcards) :** appel à un modèle via API, clé chargée depuis `.env` (jamais en dur dans le code).

## 4. Charte IA & Sécurité (Strict)
Basé sur la *Charte Projet IA Bootcamp* — à revalider à chaque étape clé du projet.

### Données
- Utiliser exclusivement des données fictives / anonymisées (`mockCourses.json`, `mockFlashcards.json`) ; aucune donnée personnelle ou confidentielle réelle.
- Vérifier que toute donnée envoyée à l'IA (ex. contenu d'une fiche pour générer des flashcards) peut légitimement être transmise à l'outil choisi.

### Clés, identifiants & accès
- **Zero Secret :** aucune clé API, mot de passe ou token dans le code ou le repository — uniquement via `.env` (non versionné, listé dans `.gitignore`).
- L'IA n'a accès qu'aux données du cours concerné au moment de la génération, jamais à l'ensemble de la base sans raison.

### Autonomie de l'IA
- L'IA est limitée à la **génération de contenu** (flashcards, suggestions de mise au propre) : elle ne crée, modifie ou supprime jamais un événement d'agenda ni un cours sans action explicite de l'utilisateur.
- Toute création automatique (ex. ajout des flashcards générées au Coin Study) passe par une étape de **validation/édition humaine** avant sauvegarde définitive.
- Documenter dans `AUDIT.md` toute nouvelle action confiée à l'IA.

### Fiabilité & contrôle
- Ne jamais afficher une flashcard ou un résumé généré comme fiable par défaut : prévoir un état "à relire" avant validation par l'étudiant.
- Prévoir un comportement explicite en cas d'échec de génération (message d'erreur clair, pas de blocage silencieux).
- L'utilisateur reste responsable des décisions finales (validation d'une fiche, planification d'un créneau).

### Transparence
- Signaler clairement dans l'UI les zones où l'IA intervient (ex. badge "généré par IA" sur les flashcards).
- Pouvoir expliquer simplement, à tout moment, ce que l'IA fait (génération de flashcards à partir du texte du cours) et ce qu'elle ne fait pas (pas d'accès externe, pas d'action autonome sur l'agenda).

## 5. Règles de Code & Fenêtre de Contexte
- **Format `.md` :** conserver les documentations en Markdown pour alléger le traitement de tokens.
- **Modularité :** composants React courts et isolés (Header, Sidebar, AgendaView, StudyView, CourseModal, FlashcardDeck, FlashcardTrainer).
- **Séparation des logiques :** affichage / modification / appel IA dans des couches distinctes (ex. hooks dédiés pour la génération de flashcards).
- **Économie de tokens :** réponses concises, directes à l'essentiel.
- **Langue :** code et commentaires en français/anglais propre, interface utilisateur entièrement en français.

## 6. Fichiers de Référence
- `CLAUDE.md` : consignes de développement (ce fichier).
- `ROADMAP.md` : historique des jalons et fonctionnalités validées.
- `AUDIT.md` : to-do list opérationnelle des tâches en cours.

## 7. Workflow d'Exécution
1. Consulter `CLAUDE.md` pour garde en mémoire le contexte et es règles.
2. Consulter `AUDIT.md` pour identifier la tâche courante.
3. Appliquer la boucle ODCT pour chaque modification.
4. Pour toute fonctionnalité impliquant l'IA, vérifier la conformité avec la section 4 (Charte IA & Sécurité) avant de livrer.
5. Attendre la validation de l'utilisateur avant d'enchaîner sur la tâche suivante.
