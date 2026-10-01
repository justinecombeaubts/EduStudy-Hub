// "Professeur Sakura" — génération de QCM (AUDIT.md J3 — Tâche 14) : appel SYNCHRONE à /api/ia
// (fonction serverless Vercel, voir api/ia.js) qui génère des questions à choix multiples à
// partir du contenu d'une ou plusieurs fiches. Même recette que src/utils/ecritureMagique.js —
// voir ce fichier pour le détail de chaque choix.
//
// Conforme Charte IA & Sécurité (CLAUDE.md §4) : seules les fiches sélectionnées sont envoyées,
// génération manuelle uniquement, résultat toujours "à relire" avant sauvegarde (SakuraReviewQcm).
//
// Partage le même point d'entrée que l'Écriture magique/Flashcards/Chat : routeur côté serveur
// (api/ia.js) dispatché par `type: 'sakura-qcm'`.
const WEBHOOK_URL = '/api/ia'

// Contrat JSON attendu de api/ia.js (type "sakura-qcm") :
// { questions: [{ enonce, options: [string], bonneReponseIndex, explication }] }
function isReponseValide(data) {
  return (
    Boolean(data) &&
    typeof data === 'object' &&
    Array.isArray(data.questions) &&
    data.questions.every(
      (q) => typeof q?.enonce === 'string' && Array.isArray(q?.options) && Number.isInteger(q?.bonneReponseIndex)
    )
  )
}

function normaliserQuestions(questions) {
  return questions.map((q, i) => ({
    id: `q-${i}`,
    enonce: q.enonce,
    options: q.options.map((o) => String(o ?? '')),
    bonneReponseIndex: q.bonneReponseIndex,
    explication: q?.explication ?? '',
  }))
}

// Retourne toujours { ok, questions } ou { ok: false, error } — jamais d'exception qui remonte
// silencieusement (voir Charte : comportement explicite en cas d'échec). L'app compose ensuite le
// record complet (titre/ue/scope/paramètres) côté client — Make ne renvoie que la banque de questions.
export async function genererQcm({ fiches, nombreQuestions, dureeLimiteMinutes }) {
  let res
  try {
    res = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'sakura-qcm', fiches, nombreQuestions, dureeLimiteMinutes }),
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
  return { ok: true, questions: normaliserQuestions(data.questions) }
}

export const ERREUR_MESSAGES = {
  network_error: 'Impossible de contacter Professeur Sakura — vérifie ta connexion.',
  http_error: 'Le service de génération a répondu avec une erreur. Réessaie dans un instant.',
  invalid_response: 'Réponse inattendue de Professeur Sakura — impossible de générer le QCM cette fois.',
}
