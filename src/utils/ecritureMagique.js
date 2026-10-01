// "Écriture magique" (AUDIT.md J2 — Tâche 7) : appel SYNCHRONE à /api/ia (fonction serverless
// Vercel, voir api/ia.js) qui met en forme le contenu d'une fiche via Gemini, et renvoie du JSON
// structuré (titre, définitions, sections, tags). Appel synchrone (pas fire-and-forget) : on a
// besoin de lire la réponse ici.
//
// Conforme Charte IA & Sécurité (CLAUDE.md §4) :
// - clé API (GEMINI_API_KEY) gérée côté serveur (api/ia.js), jamais dans ce repo ni le bundle front ;
// - seules les données de la fiche concernée sont envoyées (pas toute la base) ;
// - génération déclenchée manuellement par l'utilisateur (bouton dédié), jamais automatique ;
// - le résultat n'est jamais appliqué directement à la fiche : voir NoteModal (état "à relire").
const WEBHOOK_URL = '/api/ia'

// Contrat JSON attendu de api/ia.js (type "ecriture-magique") :
// { titre, sousTitre, definitions: [{terme, definition}], sections: [{emoji, titre, items: [string]}], tags: [string] }
function isReponseValide(data) {
  return Boolean(data) && typeof data === 'object' && Array.isArray(data.sections)
}

function normaliserReponse(data) {
  return {
    titre: data.titre ?? '',
    sousTitre: data.sousTitre ?? data.sous_titre ?? '',
    definitions: Array.isArray(data.definitions)
      ? data.definitions.map((d) => ({ terme: d?.terme ?? d?.term ?? '', definition: d?.definition ?? '' }))
      : [],
    sections: Array.isArray(data.sections)
      ? data.sections.map((s) => ({
          emoji: s?.emoji ?? '',
          titre: s?.titre ?? '',
          items: Array.isArray(s?.items) ? s.items : s?.contenu ? [s.contenu] : [],
        }))
      : [],
    tags: Array.isArray(data.tags) ? data.tags.filter(Boolean) : [],
  }
}

// Retourne toujours { ok, redaction } ou { ok: false, error } — jamais d'exception qui remonte
// silencieusement (voir Charte : comportement explicite en cas d'échec).
export async function genererEcritureMagique({ titre, ue, theme, contenu }) {
  let res
  try {
    res = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'ecriture-magique', titre, ue, theme, contenu }),
    })
  } catch {
    return { ok: false, error: 'network_error' }
  }

  if (!res.ok) return { ok: false, error: 'http_error' }

  // On lit du texte brut, pas du JSON directement : les modèles IA entourent parfois leur
  // réponse de balises ```json ... ``` malgré la consigne — plus simple et fiable de nettoyer
  // ça ici (JS) que de bricoler une fonction Make côté scénario.
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
  return { ok: true, redaction: normaliserReponse(data) }
}

export const ERREUR_MESSAGES = {
  network_error: 'Impossible de contacter le service de mise en forme — vérifie ta connexion.',
  http_error: 'Le service de mise en forme a répondu avec une erreur. Réessaie dans un instant.',
  invalid_response: 'Réponse inattendue du service IA — impossible de mettre en forme cette fois.',
}

// Bascule le JSON structuré en texte simple pour peupler le champ Contenu (source de vérité pour
// la recherche et l'édition manuelle) — la carte visuelle reste, elle, générée à partir du JSON.
export function aplatirRedaction(redaction) {
  const defs = redaction.definitions.map((d) => `${d.terme} : ${d.definition}`).join('\n')
  const sections = redaction.sections
    .map((s) => `${s.emoji ? s.emoji + ' ' : ''}${s.titre}\n${s.items.join('\n')}`.trim())
    .join('\n\n')
  return [defs, sections].filter(Boolean).join('\n\n')
}
