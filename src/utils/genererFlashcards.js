// "Professeur Sakura" — génération de flashcards (AUDIT.md J3 — Tâche 13) : appel SYNCHRONE à
// /api/ia (fonction serverless Vercel, voir api/ia.js) qui génère des cartes question/réponse à
// partir du contenu d'une ou plusieurs fiches. Même recette que src/utils/ecritureMagique.js
// (Écriture magique, J2 Tâche 7) — voir ce fichier pour le détail de chaque choix (Content-Type
// JSON, nettoyage des balises ```json, jamais d'exception).
//
// Partage le même point d'entrée que l'Écriture magique/QCM/Chat : un routeur côté serveur
// (api/ia.js) dispatche sur le champ `type: 'sakura-flashcards'` du payload.
//
// Conforme Charte IA & Sécurité (CLAUDE.md §4) :
// - clé API (GEMINI_API_KEY) gérée côté serveur (api/ia.js), jamais dans ce repo ni le bundle front ;
// - seules les fiches explicitement sélectionnées par l'utilisateur sont envoyées (pas toute la base) ;
// - génération déclenchée manuellement (bouton dédié), jamais automatique ;
// - le résultat n'est jamais enregistré directement : voir SakuraReviewDecks (état "à relire").
const WEBHOOK_URL = '/api/ia'

// Contrat JSON attendu de api/ia.js (type "sakura-flashcards") :
// { decks: [{ ficheId, titre, ue, theme, cards: [{ question, reponse }] }] }
function isReponseValide(data) {
  return Boolean(data) && typeof data === 'object' && Array.isArray(data.decks)
}

function normaliserDecks(decks) {
  const maintenant = Date.now()
  return decks.map((deck, i) => ({
    id: `deck-${maintenant}-${i}`,
    titre: deck?.titre ?? 'Deck sans titre',
    ue: deck?.ue ?? '',
    theme: deck?.theme ?? '',
    courseId: null,
    sourceFicheIds: deck?.ficheId ? [deck.ficheId] : [],
    cards: Array.isArray(deck?.cards)
      ? deck.cards.map((c, j) => ({
          id: `card-${j}`,
          question: c?.question ?? '',
          reponse: c?.reponse ?? c?.reponse_courte ?? '',
        }))
      : [],
    generatedByAI: true,
    createdAt: new Date(maintenant).toISOString(),
  }))
}

// Retourne toujours { ok, decks } ou { ok: false, error } — jamais d'exception qui remonte
// silencieusement (voir Charte : comportement explicite en cas d'échec).
export async function genererFlashcards({ fiches }) {
  let res
  try {
    res = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'sakura-flashcards', fiches }),
    })
  } catch {
    return { ok: false, error: 'network_error' }
  }

  if (!res.ok) return { ok: false, error: 'http_error' }

  // Nettoyage des balises ```json ... ``` éventuelles avant parsing (voir ecritureMagique.js).
  const texte = await res.text()
  const nettoye = texte
    .trim()
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/, '')
    .trim()

  let data
  try {
    data = JSON.parse(nettoye)
  } catch {
    return { ok: false, error: 'invalid_response' }
  }

  if (!isReponseValide(data)) return { ok: false, error: 'invalid_response' }
  return { ok: true, decks: normaliserDecks(data.decks) }
}

export const ERREUR_MESSAGES = {
  network_error: 'Impossible de contacter Professeur Sakura — vérifie ta connexion.',
  http_error: 'Le service de génération a répondu avec une erreur. Réessaie dans un instant.',
  invalid_response: 'Réponse inattendue de Professeur Sakura — impossible de générer les flashcards cette fois.',
}
