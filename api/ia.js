// Point d'entrée IA unique (Vercel Serverless Function) — remplace le scénario Make partagé
// (AUDIT.md J2/J3, plan Make Free limité en opérations) par un appel direct à l'API Gemini
// (offre gratuite Google AI Studio, sans carte bancaire).
//
// Même contrat de sortie que les anciens webhooks Make : le texte brut renvoyé par le modèle
// (parsing/nettoyage ```json inchangé côté front, voir src/utils/*.js).
//
// Conforme Charte IA & Sécurité (CLAUDE.md §4) :
// - clé API (GEMINI_API_KEY, sans préfixe VITE_) lue uniquement ici, côté serveur — jamais
//   exposée au navigateur ;
// - seules les données explicitement transmises par le front (fiche(s) sélectionnée(s), message
//   du chat) sont envoyées au modèle — jamais toute la base ;
// - génération toujours déclenchée par une action utilisateur explicite côté front.
// Alias "-latest" plutôt qu'une version datée : évite de recoder ce fichier à chaque fois que
// Google déprécie un modèle (vécu avec gemini-2.0-flash, retiré depuis son introduction ici).
// Variante "lite" : moins demandée que le flash complet, donc moins de 503 "high demand" sur le
// palier gratuit en période de pointe (constaté en test sur gemini-flash-latest).
const GEMINI_MODEL = 'gemini-flash-lite-latest'
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`

function promptEcritureMagique({ titre, ue, theme, contenu }) {
  return `Tu es un assistant qui met en forme des notes de cours d'étudiant, en français.
Fiche source — titre : "${titre || '(sans titre)'}", UE : "${ue || ''}", thème : "${theme || ''}".
Contenu brut à mettre en forme :
"""
${contenu || ''}
"""

Réponds UNIQUEMENT avec un objet JSON strictement de cette forme (aucun texte ni balise markdown autour) :
{
  "titre": "titre clair et court de la fiche",
  "sousTitre": "sous-titre optionnel, ou chaîne vide",
  "definitions": [{ "terme": "...", "definition": "..." }],
  "sections": [{ "emoji": "un seul emoji pertinent", "titre": "titre de section", "items": ["point clé 1", "point clé 2"] }],
  "tags": ["mot-clé1", "mot-clé2"]
}

Règles pour "definitions" (OBLIGATOIRE, ne jamais laisser ce tableau vide s'il y a du vocabulaire technique) :
- Repère TOUS les termes techniques, notions clés, jargon métier, sigles et acronymes présents dans les notes (ex. "API", "no-code", "RGPD", "backlog", "webhook"...).
- Donne pour CHACUN une définition courte (1 à 2 phrases), claire et accessible à un étudiant, même si les notes ne la donnent pas : utilise alors tes connaissances générales, de façon factuelle et prudente.
- Pour un sigle, commence la définition par sa forme développée.
- "terme" = le mot tel qu'écrit dans les notes ; pas de doublon.

Règles pour "sections" et "tags" : base-toi uniquement sur le contenu fourni, sans ajouter d'information absente des notes.`
}

function promptFlashcards({ fiches }) {
  const fichesTexte = (fiches || [])
    .map((f) => `- Fiche id=${f.id}, titre="${f.titre}", UE="${f.ue}", thème="${f.theme}"\nContenu : ${f.contenu}`)
    .join('\n\n')
  return `Tu es "Professeur Sakura", un assistant pédagogique qui crée des flashcards de révision à partir de fiches de cours en français.

Fiches sources :
${fichesTexte}

Pour CHAQUE fiche, génère environ 6 flashcards question/réponse qui couvrent ses points clés.
Réponds UNIQUEMENT avec un objet JSON strictement de cette forme (aucun texte ni balise markdown autour) :
{
  "decks": [
    {
      "ficheId": <id de la fiche, nombre>,
      "titre": "titre du deck",
      "ue": "UE de la fiche",
      "theme": "thème de la fiche",
      "cards": [{ "question": "...", "reponse": "..." }]
    }
  ]
}`
}

function promptQcm({ fiches, nombreQuestions }) {
  const fichesTexte = (fiches || [])
    .map((f) => `- Fiche id=${f.id}, titre="${f.titre}", UE="${f.ue}", thème="${f.theme}"\nContenu : ${f.contenu}`)
    .join('\n\n')
  return `Tu es "Professeur Sakura", un assistant pédagogique qui crée des QCM de révision à partir de fiches de cours en français.

Fiches sources :
${fichesTexte}

Génère un total de ${nombreQuestions || 10} questions à choix multiples (4 options chacune, une seule bonne réponse) couvrant l'ensemble des fiches.
Réponds UNIQUEMENT avec un objet JSON strictement de cette forme (aucun texte ni balise markdown autour) :
{
  "questions": [
    {
      "enonce": "...",
      "options": ["option 1", "option 2", "option 3", "option 4"],
      "bonneReponseIndex": <index 0-3 de la bonne réponse>,
      "explication": "courte explication de la bonne réponse"
    }
  ]
}`
}

function promptChat({ message, historique }) {
  const historiqueTexte = (historique || [])
    .map((m) => `${m.role === 'user' ? 'Étudiant' : 'Sakura'} : ${m.contenu}`)
    .join('\n')
  return `Tu es "Professeur Sakura", un assistant pédagogique bienveillant qui aide un étudiant à réviser, en français. Réponds de façon claire et concise.

${historiqueTexte ? `Historique récent :\n${historiqueTexte}\n\n` : ''}Message de l'étudiant : "${message}"

Réponds UNIQUEMENT avec un objet JSON strictement de cette forme (aucun texte ni balise markdown autour) :
{ "reponse": "ta réponse ici" }`
}

const PROMPTS = {
  'ecriture-magique': promptEcritureMagique,
  'sakura-flashcards': promptFlashcards,
  'sakura-qcm': promptQcm,
  'sakura-chat': promptChat,
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' })

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'not_configured' })

  const buildPrompt = PROMPTS[req.body?.type]
  if (!buildPrompt) return res.status(400).json({ error: 'unknown_type' })

  const appelGemini = () =>
    fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: buildPrompt(req.body) }] }],
        // Mise en forme + définitions : température basse pour des définitions factuelles et stables.
        generationConfig: { responseMimeType: 'application/json', temperature: req.body.type === 'ecriture-magique' ? 0.3 : 0.7 },
      }),
    })

  // Le modèle Gemini gratuit répond parfois 503 "high demand" en pic de charge — transitoire,
  // donc on retente 2 fois avec un court délai avant d'abandonner (voir AUDIT.md Tâche 19).
  let geminiRes
  try {
    geminiRes = await appelGemini()
    for (let tentative = 0; geminiRes.status === 503 && tentative < 2; tentative++) {
      await new Promise((r) => setTimeout(r, 1000 * (tentative + 1)))
      geminiRes = await appelGemini()
    }
  } catch {
    return res.status(502).json({ error: 'ia_network_error' })
  }

  if (!geminiRes.ok) {
    const corpsErreur = await geminiRes.text().catch(() => '')
    console.error('[api/ia] Gemini a répondu en erreur', req.body?.type, geminiRes.status, corpsErreur)
    return res.status(502).json({ error: 'ia_http_error', status: geminiRes.status, detail: corpsErreur.slice(0, 300) })
  }

  const data = await geminiRes.json()
  const candidat = data?.candidates?.[0]
  const texte = candidat?.content?.parts?.[0]?.text
  if (typeof texte !== 'string') {
    console.error(
      '[api/ia] Réponse Gemini sans texte exploitable',
      req.body?.type,
      JSON.stringify({ finishReason: candidat?.finishReason, promptFeedback: data?.promptFeedback })
    )
    return res.status(502).json({ error: 'ia_invalid_response', finishReason: candidat?.finishReason ?? null })
  }

  res.setHeader('Content-Type', 'text/plain; charset=utf-8')
  return res.status(200).send(texte)
}
