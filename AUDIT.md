# AUDIT — J2 : Automatisations Make.com (rappels, pont BDD externe, IA orchestrée)

> Tableau de bord jetable, ultra-court. Pas d'historique ni de règle générale ici (voir `ROADMAP.md` / `CLAUDE.md`).
> J1 (Agenda + Coin Study) entièrement validé et archivé dans `ROADMAP.md`.

---

## Contexte J2

Objectif du jour : automatisation via **Make.com** (scénarios déclenchés, pas d'agent IA autonome). Make ne peut pas lire le `LocalStorage` du navigateur directement → chaque scénario s'appuie sur un **webhook** envoyé depuis l'app (simple `fetch(POST)`, pas de backend à coder) et/ou sur un **Google Sheet** qui sert de BDD externe légère lue par Make sur déclencheur planifié.

**Prérequis externes (hors code du repo) :**
- Compte Make.com (plan gratuit : ~1000 opérations/mois, planification mini 15 min).
- Compte Google (Sheets + Calendar).
- Pour les tâches 6/7 : module IA (OpenAI ou Anthropic) configuré côté Make.

**Sécurité (Charte §4 — Zero Secret) :** chaque URL de webhook Make est stockée dans `.env` (`VITE_MAKE_WEBHOOK_*`), jamais en dur dans le code. Seules les données fictives (`mockCourses`/`mockNotes`) transitent vers Make/Sheets/IA pour l'instant.

**Ordre recommandé :** Tâche 1 d'abord (les tâches 2-4 lisent le Sheet qu'elle alimente).

---

## Tâche 1 — Pont "BDD externe" : webhook → Google Sheets
🗑️ retirée (02/09, soir) — obsolète depuis la Tâche 16 (voir note ci-dessous)

**Scope précis :**
1. Créer un scénario Make avec un trigger **Custom Webhook**.
2. Dans l'app, ajouter un appel `fetch(POST)` (nouveau hook `src/hooks/useMakeWebhook.js` ou utilitaire dédié) déclenché à chaque création/édition d'une fiche (`NoteModal`) ou d'un cours (`CourseFicheModal`).
3. Payload envoyé : titre, UE, date, statut, contenu (uniquement données fictives).
4. Côté Make : module Google Sheets "Add/Update a Row" — le Sheet devient la source de vérité externe (colonnes miroir du payload).
5. URL du webhook dans `.env` (`VITE_MAKE_WEBHOOK_SYNC`), jamais en dur.

**Critères de Done :**
- [x] Utilitaire `src/utils/makeWebhook.js` (`syncToMake`) créé — best-effort, non bloquant, silencieux si `.env` vide.
- [x] Appel branché sur la sauvegarde d'une fiche de cours (`AgendaView.jsx` → `handleSaveFiche`) et d'une fiche Coin Study (`StudyView.jsx` → `handleSaveNote`).
- [x] Variable `VITE_MAKE_WEBHOOK_SYNC` ajoutée à `.env.example` (vide), zéro secret en dur.
- [x] Testé en preview : sauvegarde d'une fiche sans `.env` configuré → aucune erreur console (désactivation silencieuse confirmée).
- [x] Scénario Make créé et activé côté utilisateur (webhook custom).
- [x] Vérifié en conditions réelles : sauvegarde d'une fiche → ligne apparaît dans le Google Sheet.

**À préparer par l'utilisateur (hors code, actions sur Make.com/Google) :**
1. Créer un compte Make.com (plan gratuit) si pas déjà fait.
2. Créer un Google Sheet dédié avec les colonnes : `type`, `id`, `titre`, `ue`, `date`, `theme`, `statut`, `contenu`, `syncedAt`, `date1` (`date`+1j, ajoutée pour la Tâche 2), `date5` (`date`+5j, ajoutée pour la Tâche 2).
3. Dans Make : nouveau scénario → module **Webhooks → Custom Webhook** → "Add" → nommer, copier l'URL générée.
4. Ajouter un module **Google Sheets → Add a Row** (ou "Search Rows" + "Update a Row" pour éviter les doublons sur `id`), connecter le compte Google, mapper les champs du webhook vers les colonnes du Sheet.
5. Activer le scénario (bouton ON en haut du scénario).
6. Coller l'URL du webhook dans le fichier `.env` local (à créer depuis `.env.example` si pas encore fait) : `VITE_MAKE_WEBHOOK_SYNC=https://hook.eu1.make.com/...`
7. Relancer `npm run dev` (les variables `VITE_*` sont lues au démarrage).
8. Tester : créer/éditer une fiche dans l'app → vérifier dans Make (historique d'exécution du scénario) et dans le Google Sheet que la ligne apparaît.

**Blocages / Questions :** aucun — tâche close.

**Note de résolution :** le module Webhook n'avait pas fait de "Detect new values" au moment de configurer le mapping Google Sheets → le module "Add a Row" tournait au vert mais sans variables réelles branchées, d'où un Sheet vide malgré des exécutions "réussies". Fix : redéclencher "Detect new values" pendant l'envoi d'une vraie requête (sauvegarde de fiche depuis l'app), puis refaire le mapping du module Google Sheets avec les champs nouvellement détectés (`type`, `id`, `titre`, `ue`, `date`, `theme`, `statut`, `contenu`, `syncedAt`). À garder en tête si un nouveau module Sheets/Calendar est ajouté un jour sans redétection.

**Retrait (02/09, soir) — demande utilisateur :** "Google Sheets on en a plus besoin vu qu'on a
Supabase maintenant." Juste — le Sheet n'a jamais été relu par l'app (Make ne peut pas lire
LocalStorage, d'où ce pont à l'origine, voir Contexte J2) ; Supabase (Tâche 16) est maintenant la
vraie source de vérité, interrogeable directement par un futur scénario Make (module HTTP → API
REST Supabase) si besoin pour les Tâches 2/4/5 — plus besoin de ce détour par un Sheet.

Retiré :
- `src/utils/makeWebhook.js` (`syncToMake`) supprimé, plus aucun appel dans `AgendaView.jsx`,
  `StudyView.jsx`, `DictionaryView.jsx`.
- `VITE_MAKE_WEBHOOK_SYNC` retiré de `.env`, `.env.example` et des variables d'environnement Netlify.
- Scénario Make "Integration Webhooks, Google Sheets" (id 7188732) : déjà inactif au moment du
  retrait (constaté, pas désactivé par nous) — laissé en l'état (pas supprimé) au cas où le Sheet
  garderait un intérêt d'audit/historique ; à supprimer manuellement dans Make si plus besoin.

**Effet de bord positif :** un seul scénario Make actif reste aujourd'hui (le Router IA, Tâches
7/13/14/15) sur les 2 permis par le plan Free — un slot est donc déjà libre, ce qui débloque la
Tâche 2 (rappels quotidiens) côté quota. Reste à désigner **quoi** interroger côté trigger
(Supabase directement, sans repasser par un Sheet).

---

## Tâche 2 — Rappels "aucune fiche" / "notes non prises" (J+1) & "relecture" (J+5)
🔄 en cours — design finalisé (Router Make à 3 branches), fusionne l'ancienne Tâche 3 (voir note ci-dessous)

**Scope précis :** un seul scénario Make quotidien avec un **Router** à 3 branches, basé sur deux colonnes calculées ajoutées au Sheet (`date` + 1 jour et `date` + 5 jours) plutôt qu'un calcul `addDays` dans chaque filtre :
- **Colonnes Sheet ajoutées :** `date1` (= `date` + 1j), `date5` (= `date` + 5j).
- **Branche A (J+1, fiche en brouillon)** : `date1 = aujourd'hui` ET `statut = Brouillon` → fiche créée mais pas finalisée. Message Discord : *"📝 Pense à compléter tes notes pour [titre] du [date] !"*
- **Branche B (J+5, relecture)** : `date5 = aujourd'hui`, peu importe le statut → rappel de relecture systématique. Message Discord : *"🔄 Pense à relire ton cours [titre] du [date] !"*
- **Branche C (J+1, aucune fiche)** : aucune ligne du Sheet n'a `date = hier` → aucune fiche créée du tout pour le cours de la veille. Message Discord : *"🚨 Aucune fiche enregistrée pour ton cours d'hier, pense à en créer une !"*

**Recette Make (config uniquement, aucun code app requis) :**
1. **Schedule** : déclenchement quotidien (ex. 9h).
2. **Google Sheets → Search Rows** : une seule lecture de toutes les lignes, réutilisée par les branches A et B.
3. **Router** avec 3 branches :
   - Branche A → **Filter** `date1 = formatDate(now; "YYYY-MM-DD")` ET `statut = Brouillon` → **Discord → Create a Message**.
   - Branche B → **Filter** `date5 = formatDate(now; "YYYY-MM-DD")` (sans filtre statut) → **Discord → Create a Message**.
   - Branche C → chaîne dédiée (ne peut pas réutiliser le Search Rows des branches A/B, car il s'agit de détecter une **absence** de ligne) :
     1. **Google Sheets → Search Rows** (propre à cette branche) : filtre `date = formatDate(addDays(now; -1); "YYYY-MM-DD")`.
     2. **Array Aggregator** (source = ce Search Rows) : produit toujours 1 bundle, même si 0 ligne trouvée.
     3. **Filter** : continue seulement si `length(array) = 0`.
     4. **Discord → Create a Message**.

**À préparer par l'utilisateur (hors code) :**
1. Ajouter les colonnes `date1` et `date5` au Google Sheet (formule ou calcul manuel à partir de `date`).
2. Construire le scénario Router à 3 branches ci-dessus dans Make (webhook Discord déjà validé lors du test précédent).
3. Activer le scénario.

**Critères de Done :**
- [ ] Colonnes `date1`/`date5` ajoutées et alimentées dans le Sheet.
- [ ] Router Make construit avec les 3 branches et filtres corrects.
- [ ] Message branche A reçu uniquement pour une fiche en Brouillon à la bonne date, testé en conditions réelles.
- [ ] Message branche B reçu pour une fiche à la bonne date (tout statut), testé en conditions réelles.
- [ ] Message branche C reçu uniquement quand aucune ligne n'existe pour la date d'hier, testé en conditions réelles (positif ET négatif : pas de message si une fiche existe).

**Blocages / Questions :** aucun — design validé avec l'utilisateur.

**Note :** remplace l'ancienne définition "cours du lendemain" (le Sheet ne contenant que les fiches déjà créées, pas la grille complète de l'année, un filtre "demain" n'était pas fiable). Fusionne aussi l'esprit de l'ancienne Tâche 3 ("fiche vide après 2 jours", ci-dessous) — voir note dans la Tâche 3.

**⚠️ Design à revoir (02/09, soir) :** ce design repose sur le Google Sheet (Tâche 1), retiré depuis
que Supabase est la source de vérité (Tâche 16). À réadapter avant de construire : remplacer
**Google Sheets → Search Rows** par un module **HTTP → Make a request** vers l'API REST Supabase
(même table `fiches`, filtrable côté requête), colonnes `date1`/`date5` recalculées à la volée
plutôt qu'ajoutées en dur. Le reste du design (Router à 3 branches, filtres, message Discord) reste
valable tel quel. Un scénario actif est déjà disponible dans le budget du plan Free (voir Tâche 1).

---

## Tâche 3 — Rappel "fiche vide après 2 jours"
🗑️ fusionnée dans la Tâche 2 — voir ci-dessus (branche J+1, colonne `date1` + filtre `statut = Brouillon`), délai ramené à J+1 au lieu de J+2 sur décision utilisateur.

---

## Tâche 4 — Rappel "pas revu depuis 1 semaine" (récap week-end)
⏳ à faire

**Scope précis :**
1. Ajouter un champ `lastReviewedAt` aux fiches Coin Study (absent aujourd'hui) — mis à jour à chaque ouverture/lecture d'une fiche.
2. Inclure ce champ dans le payload du webhook (Tâche 1).
3. Scénario Make planifié chaque samedi matin : filtre `lastReviewedAt > 7 jours` → email récap "fiches à réviser ce week-end".

**Critères de Done :**
- [ ] `lastReviewedAt` ajouté au modèle de fiche et persisté (LocalStorage + Sheet).
- [ ] Scénario Make déclenché chaque samedi, filtre correct.
- [ ] Email récap reçu avec la liste exacte des fiches concernées.

**Blocages / Questions :**
- Dépend des Tâches 1 et de l'ajout du champ `lastReviewedAt` côté app (petite tâche front avant le scénario Make).

---

## Tâche 5 — Sync vers Google Calendar
⏳ à faire

**Scope précis :**
1. Webhook Make déclenché à la création d'un cours/créneau (peut réutiliser le webhook de la Tâche 1 ou un webhook dédié).
2. Module Google Calendar "Create/Update Event" côté Make.

**Critères de Done :**
- [ ] Création d'un cours dans l'app crée bien un événement dans Google Calendar.
- [ ] Modification d'un cours met à jour l'événement existant (pas de doublon).

**Blocages / Questions :**
- À confirmer : calendrier Google dédié au projet (pas le calendrier perso réel de l'utilisateur), pour rester cohérent avec la Charte (données fictives).

---

## Tâche 6 — Dictionnaire (vue agrégée des définitions déjà extraites)
✅ terminé

**Recadrage utilisateur (important) :** le scope initial ci-dessous prévoyait un bouton dédié +
un nouveau scénario Make. Demande réelle, plus simple : une **nouvelle section "Dictionnaire"** dans
la Sidebar, sous "Coin Study", qui affiche les définitions **déjà extraites par l'Écriture magique**
(`fiche.redactionIA.definitions`, AUDIT.md Tâche 7) sur toutes les fiches — aucun nouveau webhook
Make nécessaire, aucune nouvelle action IA à valider (la validation a déjà eu lieu au moment
d'"Écriture magique" dans `NoteModal`). Conforme Charte §4 par construction : pure lecture agrégée
de contenu déjà généré et déjà validé par l'utilisateur.

**Scope réalisé :**
1. `Sidebar.jsx` : nouvel item "Dictionnaire" (icône `Library`, sous "Coin Study").
2. `DictionaryView.jsx` : pour chaque fiche filtrée (recherche/UE/Thème du Header, même mécanique
   que `StudyView.jsx`) ayant des définitions (`redactionIA.definitions.length > 0`), aplatit toutes
   les définitions en une liste triée alphabétiquement, chaque entrée affichant terme + définition +
   badge UE + titre de la fiche source.
3. Clic sur une entrée → ouvre la fiche source dans `NoteModal` (même modale que Coin Study,
   édition/suppression/régénération possibles depuis là).
4. État vide explicite si aucune fiche n'a encore été passée par l'Écriture magique (pas de blocage
   silencieux — invite à utiliser "✨ Écriture magique" depuis le Coin Study).
5. `App.jsx` : titre "Dictionnaire" + badge "N définitions" dans le Header, câblé comme les 2 autres
   sections (Agenda/Coin Study).

**Critères de Done :**
- [x] Section "Dictionnaire" accessible depuis la Sidebar.
- [x] Définitions de toutes les fiches "Écriture magique" agrégées et affichées, triées, avec source.
- [x] Recherche/filtres UE/Thème du Header fonctionnels sur cette vue (testé en preview).
- [x] État vide clair quand aucune définition n'existe encore.
- [x] Aucune nouvelle action IA (pure lecture de données déjà validées) — rien à documenter côté
      Charte au-delà de ce qui l'est déjà pour la Tâche 7.

---

## Tâche 7 — Reformulation "écriture magique" (IA orchestrée par Make)
✅ terminé — bout en bout, testé en conditions réelles (Make + app)

**⚠️ Action IA — conforme Charte §4 :** validation humaine obligatoire (état "à relire" distinct de l'état validé), badge IA permanent sur la fiche, aucune sauvegarde automatique — le contenu généré n'est écrit dans le champ Contenu qu'après clic explicite sur "Utiliser cette version", et la fiche elle-même n'est persistée qu'au clic sur "Enregistrer".

**Scope réalisé (app) :**
1. Bouton "✨ Écriture magique" dans `NoteModal` (Coin Study), sous le champ Contenu — désactivé si le contenu est vide.
2. Appel **synchrone** au webhook Make (`src/utils/ecritureMagique.js`, `fetch` classique, pas `no-cors` — il faut lire la réponse). Payload envoyé : uniquement `{titre, ue, theme, contenu}` de la fiche concernée (Charte : pas d'accès à toute la base).
3. Réponse attendue = **JSON structuré** : `{ titre, sousTitre, definitions: [{terme, definition}], sections: [{emoji, titre, items: [string]}], tags: [string] }`.
4. Aperçu affiché dans un nouveau composant `RedactionIACard` (rendu 2 colonnes fidèle à la maquette : définitions + tags à gauche, sections à émoji à droite), avec badge orange "Généré par IA — à relire" et boutons **Rejeter** / **Utiliser cette version**.
5. À l'acceptation : le JSON est aplati en texte simple (`aplatirRedaction`) qui remplace le champ Contenu (éditable), et la fiche stocke aussi le JSON brut (`fiche.redactionIA`) pour ré-afficher la belle carte (badge rose permanent "Reformulé automatiquement par IA") à chaque réouverture — tant que le contenu n'est pas ensuite modifié à la main (invalidation automatique dans ce cas).
6. `FicheCard` affiche un petit ✨ à côté du titre quand la fiche a une mise en forme IA validée.
7. Gestion d'erreur explicite et distincte par cas (Make non configuré / erreur réseau / erreur HTTP / réponse invalide) — jamais de blocage silencieux.

**Critères de Done (app) :**
- [x] Bouton fonctionnel, génération affichée en aperçu "à relire", jamais appliquée automatiquement.
- [x] Acceptation explicite requise avant que le contenu remplace le champ Contenu ; sauvegarde de la fiche toujours via le bouton Enregistrer existant.
- [x] Comportement clair en cas d'échec (4 messages distincts selon la cause), texte original conservé si erreur.
- [x] Testé en preview avec un webhook simulé (`fetch` mocké) : aperçu conforme à la maquette, acceptation, persistance après réouverture, invalidation après édition manuelle — tout vérifié.

**Scénario Make final (construit avec l'utilisateur) :**
1. **Webhooks → Custom Webhook** (trigger, nommé `ecriture-magique`) — URL dans `.env` (`VITE_MAKE_WEBHOOK_ECRITURE_MAGIQUE`).
2. **Anthropic Claude → Simple Text Prompt** (module "Tokens" — gratuit, inclus dans le plan Make, sans clé API à gérer). Prompt = schéma JSON strict + variables `{{titre}}` `{{ue}}` `{{theme}}` `{{contenu}}` du Webhook.
3. **Webhooks → Webhook Response** (Status `200`, Body = uniquement la pastille `Result` du module Claude — texte brut, pas de reconstruction JSON manuelle côté Make). Headers : `Content-Type: application/json`, **`Access-Control-Allow-Origin: *`** (indispensable, sinon le navigateur bloque la lecture de la réponse).
4. Pas de module "Parse JSON" côté Make — abandonné (voir bugs ci-dessous). Le nettoyage (retrait des balises ```json ```) et le parsing se font côté app (`ecritureMagique.js`), plus simple et fiable qu'une formule Make.

**Bugs rencontrés et corrigés pendant la mise en place (résumé, pour référence future) :**
- **URL tronquée par erreur** : l'URL du webhook collée dans le chat s'était concaténée avec le mot suivant ("...4qv" + "oici" au lieu de "...4q" + " voici") — le `v` en trop faisait pointer `.env` vers une URL inexistante (404 côté Make). Toujours vérifier une URL de webhook via copier-coller direct depuis Make, jamais retapée.
- **`Content-Type: text/plain` cassait le parsing des champs** : pour éviter un faux problème de CORS, le code envoyait `text/plain` au lieu de `application/json` — mais Make ne découpe le corps en champs nommés (`titre`/`ue`/`theme`/`contenu`) que si le `Content-Type` est `application/json`. Avec `text/plain`, le module IA recevait des variables vides. Revenu à `application/json` (le preflight CORS est bien géré nativement par la passerelle Make, vérifié).
- **Module "Parse JSON" fragile** : Claude entoure parfois sa réponse de balises ```` ```json ... ``` ```` malgré la consigne — le module JSON de Make échouait dessus (`Source is not valid JSON`), et une formule Make tapée à la main pour nettoyer le texte n'a pas été interprétée comme une fonction (traitée comme texte littéral). Solution : module JSON supprimé, nettoyage fait côté app avec une regex simple (`ecritureMagique.js`), bien plus fiable à déboguer.
- **"No data detected" persistant** : le trigger Webhook n'avait jamais capté de vraie requête tant que le scénario n'était pas réellement actif (le bouton "Run once" n'écoute qu'un seul appel, une fenêtre limitée) — nécessite de cliquer "Detect new values" en écoute active pendant l'envoi d'un vrai test.

**Vérifié en conditions réelles :** fiche Coin Study avec du contenu → "✨ Écriture magique" → aperçu 2 colonnes généré par le vrai scénario Make (définitions, sections, tags cohérents avec le contenu) → "Utiliser cette version" → "Enregistrer" → badge ✨ visible sur la carte, mise en forme persistée après réouverture.

**Note :** limité à Coin Study (`NoteModal`) pour l'instant, comme prévu au scope initial — pas encore disponible depuis la fiche de cours de l'Agenda (`CourseFicheModal`). Si une fiche a `redactionIA` ET est aussi liée à un créneau, `AgendaView` préserve cette donnée tant que le contenu n'est pas modifié depuis l'Agenda (voir `handleSaveFiche`).

**Ajustement demandé :** dans `NoteModal`, dès qu'une fiche a une mise en forme IA (validée ou en cours de révision), le cadre de saisie brut est masqué — on ne voit QUE la carte reformulée. Un lien discret "Voir / modifier le texte source" bascule vers le cadre brut (et réaffiche le bouton "Écriture magique") si besoin ; "Revenir à la version mise en forme" fait l'inverse. Testé : bascule dans les deux sens, aucune régression sur les fiches sans mise en forme IA (cadre brut affiché normalement).

**Ajustement demandé (2) :** clic sur "Utiliser cette version" → statut de la fiche passe automatiquement à "Rédigée" (`handleAccepterApercu`, `NoteModal.jsx`). Toujours conforme Charte : c'est l'action de validation explicite de l'utilisateur qui déclenche le changement, pas l'IA elle-même ; le statut reste modifiable manuellement ensuite si besoin. Testé en preview : Brouillon → aperçu généré → acceptation → statut "Rédigée" → persisté après Enregistrer.

**Incident du 02/09 (soir) — scénario cassé après une modification, diagnostiqué et corrigé :**
Suite à la modification du 07h30 (retrait du module Parse JSON, voir bugs ci-dessus), le module
final *Webhook Response* s'est retrouvé avec un header **malformé** — deux headers fusionnés en une
seule entrée invalide (`"Content-Type Access-Control-Allow-Origin": "application/json *"` au lieu de
deux entrées séparées). Repéré en lisant le blueprint du scénario via l'API Make (id 7194038), pas
visible dans l'interface au premier coup d'œil. Conséquence observée : le bouton "Écriture magique"
renvoyait "Réponse inattendue du service IA" côté app (exécution Make en statut WARNING).

Corrigé directement via l'API Make (`scenarios_update`, blueprint réécrit) :
- Header splitté en 2 entrées propres : `Content-Type: application/json` +
  `Access-Control-Allow-Origin: *`.
- `max_tokens` remonté de 1024 à 2048 par prudence (marge de sécurité, pas la cause identifiée mais
  un facteur de risque si le contenu source est long).

**Vérifié après correctif :** 2 appels webhook de test directs (`curl`) → JSON propre et complet,
parsing app confirmé côté Node ; 2 exécutions Make consécutives en statut SUCCESS (fini le WARNING) ;
test end-to-end réel dans l'app (fiche "Le contrat de travail : formation et rupture" → Écriture
magique → aperçu → acceptation → Enregistrer) → 4 définitions extraites, badge ✨ visible, et
apparaissent bien dans le Dictionnaire (Tâche 6). Cette fiche a été réellement modifiée par ce test
(statut passé à "Rédigée", contenu reformulé) — signalé à l'utilisatrice pour relecture, pas juste
revert d'un texte de test comme pour les vérifications précédentes.

---

## Tâche 8 — Fusion des fiches Agenda ↔ Coin Study + statut manuel
✅ terminé

**Contexte :** l'Agenda et le Coin Study géraient deux stores localStorage séparés (`agenda-fiches`
en objet `{courseId: data}`, `coin-study-notes` en tableau) alors qu'il s'agit de la même notion de
fiche — le Coin Study n'étant qu'une vue d'ensemble de toutes les fiches, pas un dataset à part.

**Scope réalisé :**
1. Modèle unifié : un seul tableau `fiches` (`src/App.jsx`), chaque fiche a `{id, courseId, titre, ue, theme, statut, contenu, date}`. `id === courseId` pour une fiche liée à un créneau ; sinon id indépendant (préfixé `note-…`).
2. Migration silencieuse (`src/utils/migrateFiches.js`) : fusionne les deux anciens stores dans le nouveau au premier chargement, sans perte de données ; anciennes clés laissées en place par sécurité.
3. `CourseFicheModal` (Agenda) : ajout du sélecteur **Statut** (Brouillon / À repasser / Rédigée, `src/utils/statuts.js` partagé) — il était auto-déduit avant, jamais choisi par l'utilisateur. Ajout aussi d'un champ **Thème** optionnel, pour que ces fiches soient filtrables dans Coin Study comme les autres.
4. `StudyView`/`AgendaView`/`WelcomeBanner` branchés sur le store unique — une fiche créée depuis l'Agenda apparaît dans Coin Study, et vice-versa.

**Vérifié en preview :** création/édition d'une fiche depuis l'Agenda → visible immédiatement dans Coin Study avec le bon statut ; console propre (un bug de clés React dupliquées détecté et corrigé en cours de route, voir préfixe `note-` ci-dessus).

**Note :** les payloads Make (Tâche 1/2, `syncToMake`) sont inchangés pour les fiches de cours (`id` = courseId, comme avant) — aucun impact sur le Sheet déjà en place. Seules les fiches Coin Study "orphelines" (non liées à un cours) changent d'id (`note-<n>` au lieu de `<n>`) ; sans effet sur les données fictives déjà validées.

---

## Tâche 9 — Suppression d'une fiche
✅ terminé

**Scope réalisé :** bouton "Supprimer" dans `CourseFicheModal` (Agenda) et `NoteModal` (Coin Study), visible uniquement pour une fiche existante. Confirmation à 2 clics obligatoire ("Supprimer définitivement cette fiche ?" → "Oui, supprimer" / "Annuler") avant toute suppression, conforme à la Charte (l'utilisateur reste responsable des décisions finales).

**Vérifié en preview :** suppression d'une fiche liée à un cours → icône fiche disparaît de l'Agenda, compteur "fiches en attente" mis à jour, fiche disparue de Coin Study, console propre.

**Note :** suppression locale uniquement — aucun scénario Make de suppression côté Google Sheet pour l'instant (la ligne correspondante y reste). À ajouter plus tard si besoin (ex. module "Delete a Row" déclenché par un webhook dédié).

---

## Tâche 10 — Sélection multiple & suppression groupée (Coin Study)
✅ terminé

**Scope réalisé :** bouton "Sélectionner" dans Coin Study → active un mode sélection sur les cartes de fiches (`FicheCard`, checkbox + surbrillance), avec une barre d'actions (compteur, "Tout sélectionner"/"Tout désélectionner", "Supprimer (n)"). Même confirmation à 2 clics que la suppression unitaire avant d'agir.

**Vérifié en preview :** sélection de 2 fiches → suppression groupée confirmée → les 2 disparaissent, compteur mis à jour, mode sélection refermé automatiquement, console propre.

**Note :** même limite que la Tâche 9 — suppression locale uniquement, pas de sync Make.

---

## Tâche 11 — Lien externe & fichier joint sur une fiche
✅ terminé

**Scope réalisé :**
1. Nouveau composant partagé `src/components/shared/PieceJointeFields.jsx` (utilisé par `CourseFicheModal` ET `NoteModal` — mêmes champs, même fiche unifiée, voir Tâche 8).
2. Champ `lien` (URL libre, optionnel) — input + lien "Ouvrir le lien" affiché dès qu'une valeur est saisie.
3. Champ `fichier` (optionnel) — `{nom, type, taille, dataUrl}`, lu en base64 via `FileReader` côté navigateur (stockage 100% local, cohérent avec le reste de l'app — pas de backend). Aperçu avec nom/taille, lien "ouvrir" (data URL), bouton retirer.
4. Limite de taille à 2 Mo par fichier, avec message d'erreur clair si dépassée — le `localStorage` du navigateur a un quota total de l'ordre de 5-10 Mo partagé entre toutes les fiches, donc pas de fichiers volumineux.
5. `FicheCard` affiche un petit icône 🔗/📎 quand une fiche a un lien et/ou un fichier.

**Bug corrigé en cours de route :** dans `AgendaView.handleSaveFiche`, le repli `data.fichier ?? existing?.fichier ?? null` restaurait silencieusement l'ancien fichier après un retrait volontaire (`null` est "nullish", donc capté par `??`). Corrigé en prenant `data.fichier`/`data.lien` tels quels, sans repli — la modale les pré-remplit déjà correctement à l'ouverture, un repli sur `existing` n'a pas de raison d'être ici (contrairement à `redactionIA`, qui doit survivre à une édition faite dans l'autre modale).

**Vérifié en preview :** ajout d'un lien + d'un fichier depuis Coin Study → persistés après réouverture → retrait du fichier → bien effacé (pas de restauration fantôme) → mêmes champs fonctionnels côté Agenda (`CourseFicheModal`). Build de production propre.

---

## Contexte J3

Objectif du jour : premier **agent IA** visible dans l'app, "Professeur Sakura" — bouton flottant 🌸
accessible sur tout l'écran (Agenda + Coin Study), qui ouvre un panel de discussion avec 3 usages :
générer des flashcards, générer un QCM, ou discuter librement. Trois nouveaux scénarios Make à
construire côté utilisateur, même recette que la Tâche 7 (Webhook trigger → module IA Anthropic Claude
→ Webhook Response en JSON) — un par usage.

**Rappel Charte (§4 — strict, comme J2) :** seules les fiches explicitement sélectionnées par
l'utilisateur sont envoyées à l'IA (jamais toute la base) ; génération toujours déclenchée manuellement ;
tout résultat généré est affiché en état "à relire" avec badge IA, jamais sauvegardé automatiquement ;
zéro secret (URLs de webhook dans `.env` uniquement) ; échec toujours explicite, jamais silencieux.

**Cadrage validé avec l'utilisateur (hors périmètre J3, à ne pas construire aujourd'hui) :** pas de mode
"passer le QCM" ni de vraie session d'entraînement flashcards — seulement génération + relecture +
sauvegarde. Une mini-liste en lecture seule ("Mes decks" / "Mes QCM") dans le panel Sakura permet de
confirmer visuellement la sauvegarde.

---

## Tâche 12 — Professeur Sakura : bouton flottant + panel (socle)
✅ terminé (app)

**⚠️ Action IA — conforme Charte §4 :** ce socle ne déclenche lui-même aucun appel IA — il pose
uniquement la structure (bouton, panel, machine à états) sur laquelle s'appuient les Tâches 13-15.

**Scope réalisé :**
1. Bouton 🌸 "Professeur Sakura" dans `Sidebar.jsx`, en bas de la même colonne que Agenda/Coin Study
   (pas un bouton flottant coin d'écran — ajusté suite retour utilisateur, voir note ci-dessous).
2. Panel ancré (`src/components/sakura/SakuraAssistant.jsx`) ouvert en bas à gauche, avec menu à 3
   options + accès "Mes decks" / "Mes QCM", fermeture via bouton, Escape, ou clic en dehors du panel.
3. Machine à états : `menu → flashcards | qcm | chat | mesDecks | mesQcm`, chaque flux gérant ses
   propres sous-étapes (voir Tâches 13-15).
4. Ouverture pré-remplie depuis `NoteModal` (bouton "Générer des Flashcards IA") via un prop
   `flashcardsRequest` (nonce unique par demande).

**Critères de Done :**
- [x] Bouton visible sur Agenda ET Coin Study, aucune régression sur les modales existantes (z-index,
      backdrop de `NoteModal`/`CourseFicheModal` inchangés).
- [x] Panel s'ouvre/se ferme (bouton, Escape, clic extérieur), animation cohérente avec le reste de l'app.
- [x] Depuis Coin Study, fiche avec contenu → "Générer des Flashcards IA" → `NoteModal` se ferme → Sakura
      s'ouvre directement sur le flux flashcards, périmètre pré-rempli sur cette fiche.

**Blocages / Questions :** aucun.

**Ajustement demandé :** bouton déplacé du coin flottant (`fixed bottom-6 right-6`) vers le bas de la
Sidebar, dans la même colonne que Agenda/Coin Study. `SakuraAssistant` n'a plus son propre bouton
déclencheur : il expose `open()` via `forwardRef`/`useImperativeHandle`, appelé depuis le bouton de
`Sidebar.jsx` (relié dans `App.jsx` via une ref). Le panel s'ouvre désormais ancré en bas à gauche
(`bottom-4 left-4 md:left-6`) au lieu de bas-droite. Testé en preview desktop + mobile.

---

## Tâche 13 — Sakura → Génération de flashcards IA
✅ terminé — bout en bout, testé en conditions réelles (Make + app)

**⚠️ Action IA — conforme Charte §4 :** génération manuelle uniquement (bouton dédié après sélection du
périmètre) ; résultat toujours affiché en état "à relire" (badge orange "Généré par IA") ; chaque deck
peut être retiré individuellement avant sauvegarde ; rien n'est écrit dans `edustudy-hub:flashcards`
avant le clic explicite sur "Enregistrer".

**Scope réalisé (app) :**
1. Sélecteur de périmètre partagé (`SakuraScopeSelector.jsx`) : par UE ou par cours/fiche, un ou
   plusieurs éléments, uniquement les fiches avec du contenu.
2. Appel synchrone au webhook Make (`src/utils/genererFlashcards.js`, même recette que
   `ecritureMagique.js`). Payload envoyé : uniquement `{id, titre, ue, theme, contenu}` des fiches
   sélectionnées.
3. Réponse attendue : `{ decks: [{ ficheId, titre, ue, theme, cards: [{question, reponse}] }] }`.
4. Relecture (`SakuraReviewDecks.jsx`) : un deck par fiche source, retrait individuel possible,
   "Enregistrer (n)" persiste les decks conservés dans `edustudy-hub:flashcards`.
5. Liste "Mes decks" (`SakuraMesDecks.jsx`) : titre, UE, nombre de cartes, badge IA — chaque deck est
   cliquable et ouvre le mode entraînement (Tâche 13-bis ci-dessous).
6. Gestion explicite des 4 cas d'erreur (non configuré / réseau / HTTP / réponse invalide).

**Critères de Done :**
- [x] Sélection UE unique/multiple et fiche(s) individuelle(s) fonctionnelle.
- [x] Comportement clair si webhook non configuré (message inline, aucune erreur console).
- [x] Aperçu "à relire" jamais appliqué automatiquement ; sauvegarde uniquement après clic explicite.
- [x] Payload vérifié en Network : uniquement les fiches sélectionnées, jamais toute la base.
- [x] Testé en conditions réelles (scénario Make + app) : decks cohérents générés à partir du
      contenu réel d'une fiche.

**Scénario Make final (construit le 02/09, directement via l'API Make — pas le plan initial
ci-dessous, gardé pour référence) :** pas de nouveau scénario séparé — contrainte du plan Make Free
(2 scénarios actifs max, déjà utilisés par la sync Sheets + le scénario "ecriture-magique"). À la
place : **Router** ajouté au scénario existant `Integration Webhooks, Anthropic Claude, JSON` (id
7194038), sur le **même webhook** que l'Écriture magique :
1. Module `CustomWebHook` : interface étendue avec `type` (text) et `fiches` (array de
   `{id, titre, ue, theme, contenu}`).
2. **Router** (`builtin:BasicRouter`) à 2 branches :
   - Branche A (Écriture magique) : filtre `type = ecriture-magique` **OU** `type` vide (compat.
     avec l'appel existant, qui n'envoie pas ce champ — voir `ecritureMagique.js`, non modifié).
   - Branche B (Sakura Flashcards) : filtre `type = sakura-flashcards`.
3. Branche B : **Anthropic Claude → Simple Text Prompt** — le tableau `{{2.fiches}}` est interpolé
   directement dans le prompt (Make le sérialise en JSON automatiquement, pas besoin d'un module
   "Transform to JSON string" séparé comme prévu initialement). `max_tokens: 2048`.
4. Branche B : **Webhooks → Webhook Response** dédiée (mêmes headers que l'Écriture magique :
   `Content-Type: application/json` + `Access-Control-Allow-Origin: *`, chacun en entrée séparée —
   voir Tâche 17-bis ci-dessous, l'erreur de header fusionné a été évitée ici dès la construction).
5. `src/utils/genererFlashcards.js` : ajout de `type: 'sakura-flashcards'` dans le payload envoyé.
6. `.env` : `VITE_MAKE_WEBHOOK_SAKURA_FLASHCARDS` pointe désormais vers la **même URL** que
   `VITE_MAKE_WEBHOOK_ECRITURE_MAGIQUE` (un seul webhook, dispatché par `type` côté Make).

**Vérifié :** 2 appels `curl` directs (avec/sans `type`) → chaque branche répond correctement sans
affecter l'autre ; test réel dans l'app (Sakura → "Je veux créer des flashcards" → par cours → 1
fiche) → 6 flashcards cohérentes générées et affichées en aperçu "à relire".

---

## Tâche 13-bis — Mode entraînement des decks
✅ terminé

**Retour utilisateur :** "les decks c'est chouette mais il faut pouvoir cliquer dessus et les
faire" — jusqu'ici "Mes decks" (Tâche 13) était en lecture seule par décision de cadrage initiale.

**Scope réalisé :**
1. `FlashcardTrainer.jsx` (nouveau — nom déjà anticipé dans `CLAUDE.md` §5) : une carte à la fois,
   clic pour retourner (Question ↔ Réponse), navigation Précédent/Suivant, barre de progression
   "Carte N / total", badge IA si `deck.generatedByAI`.
2. Dernière carte → le bouton "Suivant" est remplacé par "Recommencer" (repart à la carte 1).
3. `SakuraMesDecks.jsx` : chaque ligne devient un bouton cliquable (chevron `›` ajouté), désactivé si
   le deck n'a aucune carte ; ouvre le trainer sur ce deck.
4. `SakuraAssistant.jsx` : nouveau mode `trainer`, titre du panel dynamique (titre du deck au lieu de
   "Professeur Sakura" pendant l'entraînement), "← Retour à mes decks" ramène à la liste (pas au menu
   principal).
5. Purement local, aucun appel réseau : pas de suivi de score ni de répétition espacée aujourd'hui
   (hors scope de la demande), juste parcourir les cartes déjà générées/validées.

**Vérifié en preview :** deck de 3 cartes → clic → carte 1 affichée → clic pour retourner (réponse
visible) → Suivant × 2 → carte 3/3 → bouton "Recommencer" apparaît → "Retour à mes decks" fonctionne.

---

## Tâche 14 — Sakura → Génération de QCM IA
✅ terminé — bout en bout, testé en conditions réelles (Make + app)

**⚠️ Action IA — conforme Charte §4 :** mêmes garanties que la Tâche 13 (génération manuelle, "à
relire" avec badge IA, sauvegarde uniquement sur clic explicite).

**Scope réalisé (app) :**
1. Écran paramètres (`SakuraQcmFlow.jsx`) : nombre de questions (1-30), bascule "Y a-t-il une limite de
   temps ?" révélant un champ durée (minutes) si activée.
2. Même sélecteur de périmètre que les flashcards (UE ou cours, un ou plusieurs).
3. Appel synchrone au webhook Make (`src/utils/genererQcm.js`). Payload : fiches sélectionnées +
   `nombreQuestions` + `dureeLimiteMinutes` (`null` si pas de limite).
4. Réponse attendue : `{ questions: [{ enonce, options: [string], bonneReponseIndex, explication }] }` —
   l'app compose le record complet (titre/UE/périmètre/paramètres) côté client.
5. Relecture (`SakuraReviewQcm.jsx`) : questions + options affichées, bonne réponse marquée (✓), accept
   (Enregistrer) / reject (Annuler) / Régénérer sur l'ensemble du jeu de questions (pas d'édition
   question par question aujourd'hui — cadrage validé).
6. Liste "Mes QCM" (`SakuraMesQcm.jsx`) : titre, UE, nombre de questions, durée si définie — chaque
   QCM est cliquable et ouvre le mode "passer le QCM" (Tâche 14-bis ci-dessous).

**Critères de Done :**
- [x] Nombre de questions et limite de temps (avec/sans valeur) fonctionnels.
- [x] Sélection de périmètre identique aux flashcards.
- [x] Aperçu "à relire" avec bonnes réponses visibles, jamais appliqué automatiquement.
- [x] Confirmé : aucune UI de passage de QCM ajoutée par erreur.
- [x] Testé en conditions réelles (scénario Make + app) : 3 questions générées, bonne réponse
      marquée, explication cohérente avec le contenu de la fiche.

**Scénario Make final (construit le 02/09, directement via l'API Make — 3ᵉ branche du Router déjà
utilisé pour les Tâches 7/13, voir cette dernière pour le détail de l'approche) :**
- Branche filtrée sur `type = sakura-qcm`.
- `{{2.fiches}}` interpolé directement dans le prompt (sérialisation JSON automatique par Make).
- `{{2.nombreQuestions}}` interpolé dans la consigne ("Génère exactement N questions").
- `max_tokens: 3000` (plus élevé que les autres branches — un QCM de plusieurs questions produit
  plus de texte).
- `src/utils/genererQcm.js` : ajout de `type: 'sakura-qcm'` dans le payload.
- `.env` : `VITE_MAKE_WEBHOOK_SAKURA_QCM` pointe vers la même URL que les autres branches Sakura.

**Vérifié :** appel `curl` direct → 3 questions cohérentes avec bonnes réponses et explications ;
test réel dans l'app (Sakura → "Créer un QCM" → 3 questions → par cours → 1 fiche) → QCM généré,
bonne réponse marquée (✓), aperçu "à relire" correct.

---

## Tâche 14-bis — Mode "passer le QCM" avec correction
✅ terminé

**Retour utilisateur :** "il faut que on clique dessus et qu'on puisse répondre aux questions et
avoir la correction avec explication après chaque envoie de réponse" — même demande que la Tâche
13-bis, appliquée aux QCM (initialement hors périmètre, voir Tâche 14 ci-dessus).

**Scope réalisé :**
1. `QcmTrainer.jsx` (nouveau) : une question à la fois, options cliquables, bouton "Valider ma
   réponse" (désactivé tant qu'aucune option n'est choisie).
2. Après validation : correction immédiate — la bonne réponse s'affiche toujours en vert avec ✓,
   l'option choisie par l'utilisateur si elle est fausse s'affiche en rouge avec ✗, explication de la
   fiche `explication` affichée juste en dessous. Sélection verrouillée après validation (pas de
   changement de réponse a posteriori).
3. "Suivant" passe à la question suivante ; sur la dernière question, le bouton devient "Voir mon
   score".
4. Écran final : score `X / N` + pourcentage, bouton "Recommencer" (reprend à la question 1, score
   remis à zéro), "← Retour à mes QCM".
5. `SakuraMesQcm.jsx` : chaque ligne devient un bouton cliquable (chevron `›`), désactivé si le QCM
   n'a aucune question ; ouvre le trainer sur ce QCM.
6. `SakuraAssistant.jsx` : nouveau mode `qcmTrainer`, titre du panel dynamique (titre du QCM), retour
   dédié vers "Mes QCM" (pas le menu principal).
7. Purement local, aucun appel réseau, aucun historique de tentatives sauvegardé — seulement jouer un
   QCM déjà généré/validé et voir son score de la session en cours.

**Vérifié en preview :** QCM de 3 questions → réponse volontairement fausse à la Q1 → bonne réponse
affichée en vert (✓) + ma réponse en rouge (✗) + explication cohérente → Q2/Q3 jouées → dernier bouton
bien "Voir mon score" → écran final trophée + score exact (0/3, cohérent avec les réponses testées) +
"Recommencer" et "Retour à mes QCM" fonctionnels.

---

## Tâche 15 — Sakura → Discuter (chat libre)
✅ terminé — bout en bout, testé en conditions réelles (Make + app)

**⚠️ Action IA — conforme Charte §4 :** conversation initiée uniquement par l'utilisateur (aucun message
automatique de Sakura), pas de sauvegarde de contenu (le chat n'écrit rien dans les fiches/decks/QCM),
échec explicite à chaque message en erreur.

**Scope réalisé (app) :**
1. UI liste de messages + input (`SakuraChat.jsx`), bulles alignées par rôle (utilisateur/Sakura).
2. Appel synchrone au webhook Make par message (`src/utils/sakuraChat.js`). Payload : `message` +
   historique tronqué aux 6 derniers échanges (pas toute la conversation).
3. Réponse attendue : `{ reponse: "texte" }`.
4. Gestion explicite des 4 cas d'erreur, message affiché inline sans bloquer la saisie suivante.

**Critères de Done :**
- [x] Envoi d'un message sans webhook configuré → message d'erreur clair, input toujours utilisable.
- [x] Historique envoyé limité (vérifié en Network : 6 derniers échanges maximum).
- [x] Testé en conditions réelles (scénario Make + app) : message envoyé, réponse cohérente et bien
      formatée reçue et affichée.

**Scénario Make final (construit le 02/09, 4ᵉ et dernière branche du Router — voir Tâche 13) :**
- Branche filtrée sur `type = sakura-chat`.
- `{{2.historique}}` et `{{2.message}}` interpolés directement dans le prompt.
- `max_tokens: 1024` (une réponse de chat reste courte).
- `src/utils/sakuraChat.js` : ajout de `type: 'sakura-chat'` dans le payload.
- `.env` : `VITE_MAKE_WEBHOOK_SAKURA_CHAT` pointe vers la même URL que les autres branches Sakura.

**Vérifié :** appel `curl` direct → réponse JSON valide ; test réel dans l'app (Sakura → "Discuter" →
message envoyé) → réponse pédagogique cohérente affichée dans le fil de discussion.

**Bilan des 4 branches du Router (AUDIT.md Tâches 7/13/14/15) :** un seul scénario Make actif
(`Integration Webhooks, Anthropic Claude, JSON`, id 7194038) sert désormais l'intégralité des
fonctionnalités IA de l'app — Écriture magique, Sakura Flashcards, Sakura QCM, Sakura Discuter —
sans dépasser la limite de 2 scénarios actifs du plan Make Free (le 2ᵉ slot restant sert la sync
Google Sheets, Tâche 1). Dispatch par un champ `type` dans le payload JSON envoyé par l'app.

---

## Tâche 15-bis — Discuter connaît les vraies données (fiches/decks/QCM)
✅ terminé — bout en bout, testé en conditions réelles (Make + app)

**Demande utilisateur :** "avec tous ça au final on a pas d'agent IA d'actif [...] le but c'est de
créer un agent ia avec des tools et tout pour professeur Sakura." Juste — jusqu'ici les 4 branches du
Router (Tâches 7/13/14/15) sont des templates de prompts figés (payload fixe → 1 appel Claude → JSON),
pas un agent : aucune autonomie, aucun tool-calling.

**⚠️ Cadrage Charte §4 validé avec l'utilisateur avant construction :** les tools de l'agent sont
strictement **en lecture seule** (rechercher/lister). Aucun tool n'écrit en base — la génération
(flashcards/QCM/reformulation) reste inchangée, toujours soumise au circuit "à relire → Enregistrer"
existant, jamais autonome.

**Portée retenue (parmi 2 proposées) :** seul le mode "Discuter" devient un agent — Flashcards/QCM/
Écriture magique restent des boutons dédiés inchangés.

**Scope réalisé :**
1. Branche "sakura chat" (module id 15 du Router) remplacée : `anthropic-claude:simpleTextPrompt` →
   `ai-local-agent:RunLocalAIAgent` (le module "AI Agent" natif de Make, avec support de tools —
   déjà expérimenté par l'utilisateur dans un scénario à part, "Integration Make AI Agent", id
   7200755, inactif, servant de référence pour la structure `tools: [{name, description, flow}]`).
2. Connexion réutilisée : "Professeur Sakura" (id 10442789, `ai-provider`), créée par l'utilisateur
   mais jamais câblée jusqu'ici — trouvée via `connections_list`.
3. 3 tools en lecture seule, chacun un module `http:ActionSendData` (GET) vers la passerelle serveur
   déjà existante (`netlify/functions/data.js`, Tâche 17 — même chemin d'accès que l'app elle-même,
   aucune nouvelle clé/connexion Supabase créée dans Make) :
   - **Rechercher mes fiches de cours** → `?table=fiches`
   - **Lister mes decks de flashcards** → `?table=flashcards`
   - **Lister mes QCM** → `?table=qcm`
4. `outputType: "text"` + consigne stricte dans le `systemPrompt` (même recette JSON que les 3 autres
   branches) plutôt que `outputType: "make-schema"` (structuration native disponible sur ce module
   mais format `udtspec` non documenté ici — piste à explorer plus tard, plus robuste en théorie).
5. **Bug corrigé au passage :** `netlify/functions/data.js` ne renvoyait pas d'en-tête
   `Content-Type: application/json` (défaut Netlify Functions = `text/plain`) — corrigé
   explicitement sur toutes les réponses (fonction `json()` dédiée), déployé en prod. Bonne pratique
   indépendamment du blocage ci-dessous.

**🔴 Blocage rencontré puis résolu tout autrement — journal complet :**

Premier essai : module `ai-local-agent:RunLocalAIAgent` (l'"AI Agent" natif de Make, avec support
de tools — déjà expérimenté par l'utilisatrice dans un scénario à part, "Integration Make AI Agent",
id 7200755, servant de référence pour la structure `tools: [{name, description, flow}]`), connexion
"Professeur Sakura" (id 10442789, `ai-provider`, créée par l'utilisatrice mais jamais câblée jusqu'ici
— trouvée via `connections_list`), 3 tools en lecture seule (`http:ActionSendData` vers Supabase).
L'agent répondait correctement en conversation libre, mais dès qu'une question nécessitait un tool
("combien de fiches en UE1 Droit ?"), il répondait invariablement qu'il "rencontre un souci d'accès
aux données", sans jamais exploiter le résultat de l'outil.

6 hypothèses testées et éliminées une à une (captures d'écran du log Make fournies par l'utilisatrice
pour voir ce que l'API seule ne montre pas) :
1. `parseResponse: true/false` sur les modules HTTP tools → aucun changement.
2. Cold start de `netlify/functions/data.js` (mesuré ~1,8 s à froid) → remplacé par un appel direct à
   l'API REST Supabase (`~150 ms`, aucune variation) → aucun changement. **Bug réel corrigé au
   passage :** `netlify/functions/data.js` ne renvoyait pas `Content-Type: application/json` (défaut
   Netlify Functions = `text/plain`) — corrigé (fonction `json()` dédiée), déployé en prod.
3. **Bug réel trouvé et corrigé** : le log Make montrait `BundleValidationError — Validation failed
   for 6 parameter(s)` sur le module HTTP (paramètres avancés `shareCookies`, `rejectUnauthorized`,
   `followRedirect`, `useQuerystring`, `gzip`, `useMtls` — remplis automatiquement par l'éditeur
   visuel mais absents quand le module est créé via l'API blueprint). Complétés explicitement →
   l'erreur de validation a disparu, mais le symptôme (agent qui n'exploite pas le résultat) a
   persisté.
4. Consigne de retry ajoutée dans le `systemPrompt` de l'agent → aucun changement.
5. `handleErrors: false` sur les tools (pour qu'aucun état ne remonte comme "erreur") → aucun
   changement.
6. À ce stade, le log montrait un schéma stable et reproductible : le tool échoue une première fois
   ("An error has been caught during operation"), un retry interne à Make réussit (bulle verte), mais
   l'étape agent suivante ("The agent finished executing a tool") reste marquée en échec — comme si
   l'intégration Agent ↔ tool HTTP de Make ne récupérait pas le résultat du retry. Ni l'API (détail
   par module non exposé sur ce plan) ni l'éditeur visuel (bulle "Run an agent" sans plus de détail
   au clic) n'ont permis d'aller plus loin dans le diagnostic — limite de plateforme Make (fonctionnalité
   Agent IA récente), pas un bug de configuration de notre côté.

**Décision (validée avec l'utilisatrice) :** abandonner le tool-calling piloté par l'agent, revenir à
la recette éprouvée (`anthropic-claude:simpleTextPrompt`, comme les 3 autres branches) mais en
injectant directement les données dans le prompt plutôt que de laisser un agent décider de les
chercher :
1. Branche "sakura chat" : 3 modules `http:ActionSendData` (GET Supabase, fiches/flashcards/qcm)
   exécutés en séquence normale (pas des "tools"), puis un module Claude classique dont le prompt
   embarque les 3 jeux de données (`{{17.data}}`, `{{18.data}}`, `{{19.data}}`) + historique + message,
   avec instruction d'utiliser ces données si pertinent, sinon de répondre normalement.
2. Toujours conforme Charte §4 : lecture seule, aucune écriture, réponse "reponse" simple sans
   sauvegarde automatique de quoi que ce soit.
3. Connexion "Professeur Sakura" (ai-provider) laissée de côté pour l'instant, non supprimée —
   réutilisable si Make corrige un jour ce point sur l'Agent+tools.

**Vérifié en conditions réelles :** "combien de fiches en UE1 Droit ?" → 4 fiches listées avec titres
exacts et statuts ; "quels sont mes decks de flashcards ?" → 3 decks détaillés avec cartes et UE ;
question générale ("comment réviser avant un examen ?") → réponse pertinente intégrant naturellement
le contexte réel (nombre de fiches à repasser) sans être parasitée. Testé par `curl` puis dans l'app
en preview (bulle de réponse avec les vraies fiches affichée).

**Critères de Done :**
- [x] Sakura (mode Discuter) répond avec les vraies données de l'utilisatrice (fiches/decks/QCM).
- [x] Aucune écriture, lecture seule stricte (conforme Charte §4).
- [x] Question générale toujours possible, sans forcer l'usage des données.
- [x] Testé en conditions réelles (curl + app).

---

## Contexte J4

Publication du site sur Netlify (`edustudy-hub.netlify.app`) → limite de LocalStorage devenue visible :
aucune synchro entre appareils/navigateurs. Objectif : une vraie BDD applicative comme source de
vérité pour fiches/flashcards/QCM, cross-device.

## Tâche 16 — BDD Supabase (remplace LocalStorage comme source de vérité)
✅ terminé — testé en conditions réelles (lecture + écriture via l'UI, vérifié en base)

**Outil choisi et pourquoi :** Supabase (Postgres géré, gratuit) plutôt qu'un Data Store Make — le
compte Make (plan Free) est limité à 2 scénarios actifs (déjà utilisés : Tâche 1 + Sakura) et 1 seul
Data Store (1 Mo), insuffisant pour héberger la donnée applicative sans fragiliser l'existant. Le pont
Make → Google Sheets (Tâche 1) n'est pas touché — reste une BDD externe légère lue par Make sur
déclencheur planifié, pas la source de vérité de l'app.

**Scope réalisé :**
- Schéma générique volontaire, 3 tables (`fiches`, `flashcards`, `qcm`) : `{id text primary key, data
  jsonb, updated_at timestamptz}` — un enregistrement par élément de tableau, `data` porte exactement
  le même objet JS qu'avant en LocalStorage (voir `supabase/schema.sql`, à exécuter une fois dans le
  SQL Editor Supabase).
- `src/utils/supabaseClient.js` : client créé seulement si `.env` renseigné, sinon `null` (repli
  local silencieux, même philosophie que `makeWebhook.js`).
- `src/utils/useSupabaseStore.js` : remplace `useLocalStorage` dans `App.jsx` pour `fiches` /
  `flashcards` / `qcm` — même signature `[value, setValue]`. Lecture initiale Supabase (si table
  distante vide au premier lancement : on pousse le cache/mock local au lieu d'effacer l'écran) ;
  écriture = upsert/delete diffé, best-effort et non bloquant ; cache LocalStorage systématique en
  parallèle (offline, ou Supabase non configuré).
- `.env` / `.env.example` : `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (clé "anon", jamais
  "service_role").

**⚠️ Sécurité — RLS ouvertes :** pas de comptes utilisateurs dans l'app aujourd'hui → policies RLS
volontairement publiques (lecture + écriture via la clé anon). Choix assumé pour ce projet bootcamp à
données fictives (Charte §4), documenté dans `supabase/schema.sql` — à revoir (policies scoped par
utilisateur) si des comptes sont ajoutés un jour.

**Critères de Done :**
- [x] Fiche modifiée depuis l'UI → retrouvée à l'identique en base Supabase (vérifié par requête
      directe après clic "Enregistrer").
- [x] Tables absentes (avant exécution du SQL) → avertissement console clair, app fonctionnelle sur
      le cache local, aucun blocage.
- [x] Build de production propre (`npm run build`).

**Note :** cette approche (clé `anon` appelée directement depuis le front) a été remplacée par la
Tâche 17 juste après (passerelle serveur, clé `service_role`) — voir cette tâche pour l'état final.

---

## Tâche 17 — Verrouillage sécurité : plus aucune clé Supabase côté navigateur
✅ terminé — vérifié en conditions réelles (prod Netlify)

**Problème :** la clé `anon` (Tâche 16), bien que publique par design, donnait un accès direct en
lecture/écriture aux 3 tables depuis n'importe où (visible dans le bundle JS). Objectif : qu'aucune
clé Supabase, publique ou secrète, ne soit accessible depuis le navigateur.

**Solution :** passerelle serveur `netlify/functions/data.js` — seule à détenir la clé `service_role`
(secrète, jamais exposée), stockée en variable d'env **sans préfixe `VITE_`** (`SUPABASE_URL`,
`SUPABASE_SERVICE_ROLE_KEY`) donc jamais inlinée dans le bundle par Vite. Le front
(`useSupabaseStore.js`) ne fait plus que des `fetch` vers `/.netlify/functions/data?table=...` (GET =
lecture, POST = upsert/delete). RLS Supabase : policies publiques de la Tâche 16 supprimées
(`supabase/lock-down-rls.sql`), RLS reste activée sans aucune policy → deny-all pour `anon`, la clé
`service_role` contourne RLS par nature (seul chemin d'accès légitime).

**Fichiers :**
- `netlify/functions/data.js` — la passerelle, avec allowlist de tables (`fiches`/`flashcards`/`qcm`)
  pour empêcher tout accès à une table arbitraire.
- `src/utils/useSupabaseStore.js` — réécrit pour parler à la fonction, plus au client Supabase.
- `src/utils/supabaseClient.js` — supprimé (plus utilisé côté front).
- `netlify.toml` — déclare le dossier `functions`, + section `[dev]` pour `netlify dev` en local.
- `.claude/launch.json` — nouvelle config `edustudy-hub-dev-full` (`netlify dev`, port 8888) pour
  tester les fonctions en local ; l'ancienne config `edustudy-hub-dev` (Vite seul, port 5183) reste
  disponible pour l'itération UI rapide sans fonctions.
- `vite.config.js` — port fixé à 5183 (repris par `netlify.toml [dev] targetPort`).

**Vérifié en conditions réelles (prod, après redéploiement) :**
- [x] `curl` direct sur l'API REST Supabase avec la clé anon → `200` mais tableau vide en lecture,
      `401 row-level security policy` en écriture (RLS bloque bien tout accès direct).
- [x] `curl` sur `/.netlify/functions/data?table=fiches` (URL de prod) → données renvoyées
      normalement (la fonction, elle, a les droits via `service_role`).
- [x] Bundle JS de prod inspecté (`grep` sur `supabase.co` / motif JWT) → **0 occurrence**, aucune clé
      ni URL Supabase présente côté client.
- [x] Écriture bout en bout testée depuis l'UI (modification d'une fiche → "Enregistrer" → relue via
      la fonction) → conforme.
- [x] Variables `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` retirées de Netlify (`env:unset`) —
      plus aucune trace de l'ancienne approche en config.

---

## Tâche 18 — Retours formateur (revue UX, session du 14/09/2026)
✅ terminé — vérifié en preview (`edustudy-hub-dev`)

**Contexte :** liste de 11 observations remontées par le formateur après avoir manipulé l'outil
(clarté du bandeau d'accueil, filtres, Dictionnaire, accès aux flashcards/QCM, responsive mobile).
Chaque point a été traité en boucle ODCT ; détail ci-dessous par point.

**1. Bandeau ambigu (fiches en attente semblait lié au prochain cours) :** `WelcomeBanner.jsx`
restructuré en 2 blocs visuellement distincts (séparateur vertical), le second explicitement libellé
"toutes matières confondues".

**2. Clic sur "X fiches en attente" ne filtrait pas le Coin Study :** nouveau statut virtuel
"En attente" (Brouillon + À repasser) dans le filtre Statut de `StudyView.jsx`, déclenché depuis
`App.jsx` via un nonce (`studyStatutRequest`, même mécanique que `flashcardsRequest`).

**3. Badge du Header ambigu (compte total, pas filtré) :** libellé changé en "X fiches au total" /
"X définitions au total" (`App.jsx`) — pas de calcul du compte filtré remonté au Header, cohérent
avec la demande (clarifier le libellé plutôt que changer la donnée affichée).

**4. Pas de recherche par date dans le Coin Study :** `searchFilter.js` reconnaît maintenant les
dates (`formatDateVariants` : `JJ/MM/AAAA`, `JJ mois AAAA`, jour de la semaine...) via un champ
`date` optionnel dans le mapping `fields`, câblé sur `StudyView.jsx`/`DictionaryView.jsx`.

**5. Pas clair que la sélection multiple permet aussi de changer le statut (pas seulement
supprimer) :** ajout d'une action "Changer le statut vers :" dans la barre de sélection groupée de
`StudyView.jsx`, à côté de la suppression groupée existante (Tâche 10).

**6/7. Définitions du Dictionnaire non modifiables/supprimables, pas de création manuelle :**
nouveau composant `src/components/dictionary/DefinitionModal.jsx` (édition + création, fiche source
obligatoire) branché sur `DictionaryView.jsx` (icônes crayon/poubelle par entrée + bouton
"+ Nouvelle définition"). Une définition créée à la main est marquée `origin: 'manuel'` (badge
"Manuel" au lieu de "✨ IA" dans la liste) — conforme Charte §4 : le badge reflète la provenance
réelle du contenu, jamais présenté comme généré par l'IA s'il ne l'est pas. Une définition IA
existante corrigée pour une coquille garde son origine IA (l'édition ne change pas la provenance).

**8. Marge insuffisante en haut/bas des popups (contenu coupé au scroll) :** overlay des modales
(`NoteModal.jsx`, `CourseFicheModal.jsx`, `DefinitionModal.jsx`) passé de `items-center` fixe à
`items-start sm:items-center` + `overflow-y-auto py-8`, pour garantir une marge visible même quand
`100vh` est mal calculé par le navigateur mobile (barre d'adresse dynamique).

**9/10. Génération de flashcards ouvre l'agent (déroutant) / flashcards-QCM pas accessibles depuis
la fiche :** `NoteModal.jsx` affiche désormais, si présents, les decks/QCM déjà générés pour la fiche
courante (via `sourceFicheIds`) avec accès direct au mode entraînement — sans repasser par le menu
de Professeur Sakura. Mécanique généralisée côté `App.jsx`/`SakuraAssistant.jsx` :
`flashcardsRequest` renommé `sakuraRequest` avec un `mode` (`generate-flashcards` / `open-deck` /
`open-qcm`). La génération elle-même (appel IA) continue d'ouvrir Sakura — c'est la seule étape qui
en a réellement besoin.

**11. Vue Semaine peu lisible sur mobile (grille à défilement horizontal) :** `WeekView.jsx` bascule
sur mobile (`md:hidden`) vers des onglets Lundi→Vendredi + liste verticale du jour sélectionné (même
esprit que `DayView.jsx`) ; la grille horaire complète reste affichée telle quelle à partir de `md:`.

**Fichiers modifiés :** `WelcomeBanner.jsx`, `App.jsx`, `StudyView.jsx`, `DictionaryView.jsx`,
`NoteModal.jsx`, `CourseFicheModal.jsx`, `SakuraAssistant.jsx`, `WeekView.jsx`, `searchFilter.js`.
**Fichier créé :** `src/components/dictionary/DefinitionModal.jsx`.

**Vérifié en preview (`edustudy-hub-dev`, Vite seul — pas de Netlify functions, cf. Tâche 17) :**
- [x] Bandeau : blocs séparés, clic → Coin Study filtré sur "En attente".
- [x] Badge "X fiches au total" / "X définitions au total" affiché.
- [x] Recherche "19 août" retrouve la fiche correspondante dans le Coin Study.
- [x] Changement de statut groupé sur une sélection → statuts mis à jour, sélection réinitialisée.
- [x] Dictionnaire : création manuelle (badge "Manuel"), édition (fiche source verrouillée),
      suppression avec confirmation "Oui/Non" — toutes testées bout en bout.
- [x] Popup définition : marge visible en haut et en bas, y compris en scrollant jusqu'au bout.
- [x] Vue Semaine mobile (375px) : onglets jour + liste verticale, pas de défilement horizontal.
- [x] Aucune erreur console imputable à ces changements (les 404 sur
      `/.netlify/functions/data` en `POST` sont attendus en `vite` seul — voir Tâche 17 —, pas une
      régression de cette tâche).
- [ ] Génération réelle de flashcards/QCM depuis une fiche + accès direct au deck/QCM généré : pas
      testable dans cet environnement (webhook Make `VITE_MAKE_WEBHOOK_*` non configuré en local) —
      à revérifier par l'utilisateur en conditions réelles.

**Blocages / Questions :** aucun.

---

## Tâche 19 — Migration IA : Make → Gemini via api/ia.js (sortie du plan Make Free)

✅ terminé — vérifié en conditions réelles (prod Vercel, les 4 flux)

**Problème :** les 4 fonctionnalités IA (Écriture magique, Sakura Flashcards/QCM/Discuter)
passaient toutes par un scénario Make unique (plan Free : 1 000 opérations/mois, 2 scénarios actifs
max) — la limite d'opérations était atteinte trop vite pour un usage réel.

**Solution :** suppression de la dépendance à Make. Nouvelle fonction serverless Vercel
`api/ia.js` (même convention que `api/data.js`, portage de la fonction Netlify) qui construit le
prompt adapté selon un champ `type` (`ecriture-magique` / `sakura-flashcards` / `sakura-qcm` /
`sakura-chat`) et appelle directement l'API **Gemini** (offre gratuite Google AI Studio, sans carte
bancaire, `generationConfig.responseMimeType: "application/json"` pour un JSON garanti). La clé
(`GEMINI_API_KEY`, sans préfixe `VITE_`) n'est lue que côté serveur — jamais exposée au bundle
front, conforme Charte §4.

**Deux incidents rencontrés en vérifiant en conditions réelles, corrigés dans la même tâche :**
1. Le modèle initialement codé (`gemini-2.0-flash`) avait été retiré par Google entre l'écriture
   du code et son déploiement (erreur 404 explicite de l'API : *"is no longer available"*) — remplacé
   par l'alias `gemini-flash-latest` (`generativelanguage.googleapis.com`), qui pointe toujours vers
   le modèle flash courant sans avoir à retoucher ce fichier à chaque dépréciation.
2. `gemini-flash-latest` renvoyait parfois `503 UNAVAILABLE` ("high demand") sur le palier gratuit —
   passage à `gemini-flash-lite-latest` (moins sollicité) + retry automatique (2 tentatives, backoff
   court) sur les 503 uniquement, dans `api/ia.js`.

Contrat de sortie inchangé pour le front : `api/ia.js` renvoie le texte brut du modèle, les 4
fichiers `src/utils/*.js` gardent leur logique existante de nettoyage (balises ```json) et de
`JSON.parse` — seul `WEBHOOK_URL` change (pointe vers `/api/ia` au lieu des URLs Make), et le
garde-fou `not_configured` (URL Make vide) a été retiré, devenu impossible avec une URL interne
fixe.

Contrat de sortie inchangé pour le front : `api/ia.js` renvoie le texte brut du modèle, les 4
fichiers `src/utils/*.js` gardent leur logique existante de nettoyage (balises ```json) et de
`JSON.parse` — seul `WEBHOOK_URL` change (pointe vers `/api/ia` au lieu des URLs Make), et le
garde-fou `not_configured` (URL Make vide) a été retiré, devenu impossible avec une URL interne
fixe.

**Fichiers modifiés :**
- `api/ia.js` — créé (routeur IA + appel Gemini).
- `src/utils/ecritureMagique.js` / `genererFlashcards.js` / `genererQcm.js` / `sakuraChat.js` —
  `WEBHOOK_URL` repointé vers `/api/ia`, ajout de `type: 'ecriture-magique'` au payload (absent
  auparavant), suppression du garde-fou et du message `not_configured` devenus obsolètes.
- `.env.example` / `.env` — retrait des 4 `VITE_MAKE_WEBHOOK_*` et de `VITE_AI_API_KEY` (jamais
  utilisée), ajout de `GEMINI_API_KEY` (sans préfixe `VITE_`).

**Vérifié en conditions réelles (prod, `edustudy-hub.vercel.app`, appels directs à `/api/ia`) :**
- [x] Écriture magique → JSON structuré (titre/sections) reçu, statut 200.
- [x] Sakura Flashcards → deck avec cartes question/réponse reçu, statut 200.
- [x] Sakura QCM → questions à choix multiples reçues, statut 200.
- [x] Sakura Discuter → réponse conversationnelle reçue, statut 200.

**Reste à faire :**
- [ ] Retirer les anciennes variables `VITE_MAKE_WEBHOOK_*` des Environment Variables Vercel
      (obsolètes, ne sont plus lues par le code).
- [ ] Désactiver/supprimer le scénario Make côté make.com (plus utilisé).
- [x] (Sans rapport avec Make/Gemini, repéré en vérifiant) `/api/data` renvoyait 500 en prod —
      `TypeError: Cannot convert argument to a ByteString because the character at index 0 has a
      value of 65279`, c'est-à-dire un BOM UTF-8 en tête d'une variable d'env Supabase
      (`SUPABASE_URL` ou `SUPABASE_SERVICE_ROLE_KEY`). Corrigé par un `.trim()` défensif sur les
      deux variables dans `api/data.js`, redéployé et vérifié (l'erreur ByteString a disparu).
- [x] **Nouveau, révélé par le fix ci-dessus :** `/api/data` renvoyait `TypeError: fetch failed`
      (Supabase injoignable) — cause confirmée : projet Supabase gratuit mis en pause (trop de
      projets actifs sur le compte). Résolu en créant un **nouveau compte + projet** Supabase
      (`qolyuimrawzqvdmjbfaj`) plutôt que de réactiver l'ancien. `SUPABASE_URL` et
      `SUPABASE_SERVICE_ROLE_KEY` mis à jour dans Vercel (Production) via `vercel env`, schéma
      rejoué (`supabase/schema.sql` : 3 tables + RLS deny-all, `lock-down-rls.sql` pas nécessaire
      sur un projet neuf). Vérifié en prod : lecture (200, `rows: []` sur les 3 tables) et
      écriture/lecture/suppression bout en bout (upsert → relu → supprimé, tout à 200).

**Blocages / Questions :** confirmer l'URL réelle du déploiement Vercel du projet (l'URL
`les-recettes-famille.vercel.app` donnée en conversation pointe vers un autre projet — un site de
recettes, pas EduStudy Hub).

---

## Tâche 20 — Nouvelle charte graphique (DA bordeaux/argent/rose nude) + mode clair/sombre

✅ terminé — vérifié en preview (`edustudy-hub-dev`, clair et sombre, plusieurs vues)

**Contexte :** reprise de la DA du portfolio de l'utilisateur (bordeaux/argent/rose nude,
Montserrat + Inter + Source Code Pro) pour EduStudy Hub, avec ajout d'un mode sombre (l'app n'en
avait pas). L'app utilisait jusqu'ici uniquement la palette Tailwind par défaut (`rose-*`,
`stone-*`, `peach` custom) en dur dans ~29 composants, sans variables CSS ni notion de thème.

**Approche :**
- `tailwind.config.js` : `darkMode: 'class'` ; palette `rose` **remplacée** par le nouveau dégradé
  rose nude (10 teintes 50→950) — reskin immédiat de tous les usages `rose-*` existants sans
  toucher les fichiers ; tokens sémantiques (`app`, `surface`, `surface-muted`, `line`, `heading`,
  `body`, `muted`, `accent`, `accent-soft`, `on-accent`) mappés vers des variables CSS pour les
  rôles qui changent entre clair/sombre ; `fontFamily`/`boxShadow` ajoutés.
- `src/index.css` : variables `:root` / `:root.dark` (valeurs exactes de la DA), police par
  `@layer base` (`h1..h6` → Montserrat, `body` → Inter), halos radiaux discrets, transition douce.
- `index.html` : script inline avant le premier paint pour poser la classe `dark` (LocalStorage
  `edustudy-hub-theme`, sinon `prefers-color-scheme`) — évite le flash clair→sombre.
- `src/utils/useTheme.js` (nouveau) : hook bascule + persistance, utilisé par un bouton
  soleil/lune ajouté en bas de `Sidebar.jsx`.
- Remplacement systématique (`sed`, vérifié `grep` avant/après) des classes non mappées via la
  palette : `bg-white`→`bg-surface`, `bg-cream`→`bg-app`, `bg-stone-50/100`→`bg-surface-muted`,
  `text-rose-950`→`text-heading` (rôle "titre", doit s'inverser en sombre — contrairement au reste
  de la palette rose qui reste identique dans les deux modes), `text-stone-3/4/5/600`→`text-muted`,
  `border-rose-100/200`/`border-stone-200`→`border-line`.
- `peach`/`orange` (statuts "À repasser", actions IA) et le multi-couleurs de `ueColors.js`
  laissés tels quels — sémantique distincte de l'accent rose nude, hors scope de cette DA.

**Deux bugs de contraste trouvés et corrigés en vérifiant (pas visibles en clair, l'app n'ayant
jamais eu de mode sombre avant) :**
1. `bg-rose-300 text-heading` (boutons principaux, onglets actifs, bulle utilisateur du chat) —
   `bg-rose-300` reste volontairement identique dans les deux modes (DA : "bouton = rose nude
   constant"), mais `text-heading` s'inverse → texte illisible en sombre. 20 occurrences corrigées
   en `text-on-accent` (fixe, `--on-accent`, conforme DA "texte #2a0f17 sur bouton").
2. 19 champs de formulaire (`input`/`select`/`textarea` dans les modales et `SakuraChat`) n'avaient
   jamais eu de classe `bg-*` explicite (fond blanc par défaut du navigateur, invisible en clair
   sur fond clair) → readonly/vide en clair mais fond blanc criard en sombre. `bg-app` ajouté à
   chacun (effet "champ creusé" cohérent dans les deux modes). Même chose pour les labels en
   `text-rose-900` (fixe, illisible en sombre) → `text-muted`.
3. `WelcomeBanner.jsx` : dégradé clair fixe (`from-rose-200 via-rose-100 to-peach-100`, décoratif,
   volontairement identique dans les deux modes) + `text-heading` → illisible en sombre. Passé en
   `text-on-accent` (fixe) ; le bouton imbriqué gardé en `bg-white/60` littéral plutôt que
   `bg-surface` (qui aurait viré marron sale sur ce dégradé toujours clair en mode sombre).

**Fichiers modifiés :** `tailwind.config.js`, `src/index.css`, `index.html`, `src/components/**/*.jsx`
(~29 fichiers, classes de couleur uniquement), `src/components/StudyView.jsx` (correctif doublon
`bg-app`/`bg-surface` post-`sed`).
**Fichier créé :** `src/utils/useTheme.js`.

**Vérifié en preview (`edustudy-hub-dev`) :**
- [x] Bascule clair ↔ sombre depuis le bouton en bas de la Sidebar, persistée (LocalStorage),
      sans flash au rechargement.
- [x] Agenda (bannière, semaine), Coin Study (grille de fiches), une modale (Fiche de révision,
      tous les champs), le panneau Professeur Sakura (menu + chat) — contrôlés dans les deux modes.
- [x] `npm run build` sans erreur après chaque étape.

**Blocages / Questions :** aucun — DA appliquée à l'identique des valeurs fournies par l'utilisateur.

---

## Backlog (idées J2 hors Make, pas encore planifiées)

Discutées mais pas encore transformées en tâches — à valider avec l'utilisateur avant de les ajouter ici :
- Thème couleur (10 choix)
- Téléchargement du cours en PDF
- Rappels équivalents côté UI pure (sans Make), si besoin d'une version sans dépendance externe

---

## Tâche 2026-10-09 — Mode sombre, planning manuel, pièces jointes multiples, Écriture magique, Exercices & Livrables, DA cozy

- [x] **Mode sombre** : les palettes `rose/peach/orange/red/green/amber/fuchsia/stone` pointent vers des variables CSS (plugin dans `tailwind.config.js`) redéfinies en sombre → les `hover:bg-rose-50`, badges pêche, etc. ne restent plus clairs sur fond bordeaux. `color-scheme: dark` (listes déroulantes natives). Bandeau d'accueil : texte sombre sur fond sombre corrigé.
- [x] **Planning** : `mockCourses.json` ne contient plus que des créneaux vides (date + horaires) ; seuls les créneaux Entreprise restent pré-remplis. Les cours sont choisis à la main dans la liste déroulante (`catalogueCours.json`) via la modale du créneau, affectations persistées dans le store `creneaux` (`usePlanning.js`).
- [x] **Pièces jointes multiples** : `liens[]` + `fichiers[]` sur fiches (Agenda, Coin Study) et livrables — rétrocompatible avec l'ancien `lien`/`fichier` (`piecesJointes.js`).
- [x] **Écriture magique** : le prompt interdisait toute info absente des notes, donc aucun terme n'était défini si les notes ne le faisaient pas. Il exige maintenant de repérer et définir tous les termes techniques/sigles (connaissances générales autorisées pour les définitions uniquement), température 0.3. Charte §4 : nouvelle action IA documentée ici ; définitions toujours en état "à relire" + mention "expliqués par l'IA — à vérifier".
- [x] **Événements libres** : bouton "Nouvel événement" dans l'Agenda (nom, date, horaires, description), store `evenements`, affichés en bleu ciel ; éléments simultanés côte à côte en vue Semaine.
- [x] **Exercices & Livrables** : nouvel espace (type, UE, cours lié, date de rendu, statut, note, description, liens/fichiers), store `livrables`. Aucune IA.
- [x] **DA cozy** : typo Quicksand/Nunito, barres en verre dépoli, motif fleurs/étincelles en fond (couleurs inchangées).

**À faire par l'utilisateur :** exécuter `supabase/add-creneaux-livrables.sql` dans Supabase (sinon `creneaux`/`livrables` restent en LocalStorage seul, sans synchro cross-device).
