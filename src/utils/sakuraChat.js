// "Professeur Sakura" — mode discussion libre (AUDIT.md J3 — Tâche 15) : appel SYNCHRONE à
// /api/ia (fonction serverless Vercel, voir api/ia.js) à chaque message envoyé. Même recette que
// src/utils/ecritureMagique.js.
//
// Conforme Charte IA & Sécurité (CLAUDE.md §4) : pas de données réelles/personnelles envoyées côté
// app (l'utilisateur écrit librement, comme pour n'importe quel chatbot) ; historique volontairement
// court (pas toute la conversation) ; échec explicite, jamais silencieux.
//
// Partage le même point d'entrée que l'Écriture magique/Flashcards/QCM : routeur côté serveur
// (api/ia.js) dispatché par `type: 'sakura-chat'`.
const WEBHOOK_URL = '/api/ia'

// Nombre d'échanges précédents envoyés avec chaque message, pour donner du contexte à l'IA sans faire
// grossir indéfiniment le payload.
const HISTORIQUE_MAX = 6

// Contrat JSON attendu du module Webhook Response côté Make : { reponse: "texte" }
function isReponseValide(data) {
  return Boolean(data) && typeof data === 'object' && typeof data.reponse === 'string'
}

// Retourne toujours { ok, reponse } ou { ok: false, error } — jamais d'exception qui remonte
// silencieusement (voir Charte : comportement explicite en cas d'échec).
export async function envoyerMessageSakura({ message, historique = [] }) {
  const historiqueTronque = historique.slice(-HISTORIQUE_MAX).map((m) => ({ role: m.role, contenu: m.contenu }))

  let res
  try {
    res = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'sakura-chat', message, historique: historiqueTronque }),
    })
  } catch {
    return { ok: false, error: 'network_error' }
  }

  if (!res.ok) return { ok: false, error: 'http_error' }

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
  return { ok: true, reponse: data.reponse }
}

export const ERREUR_MESSAGES = {
  network_error: 'Impossible de contacter Professeur Sakura — vérifie ta connexion.',
  http_error: 'Le service de discussion a répondu avec une erreur. Réessaie dans un instant.',
  invalid_response: 'Réponse inattendue de Professeur Sakura — réessaie dans un instant.',
}
