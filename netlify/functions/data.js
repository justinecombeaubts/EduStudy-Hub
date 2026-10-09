import { createClient } from '@supabase/supabase-js'

// Passerelle serveur pour la BDD applicative (AUDIT.md J4 — Tâche 17 : verrouillage sécurité).
// Seule cette fonction détient la clé Supabase "service_role" (variable d'env SANS préfixe
// VITE_ → jamais injectée dans le bundle envoyé au navigateur, contrairement à VITE_SUPABASE_*
// avant ce correctif). Le front (useSupabaseStore.js) ne parle plus jamais directement à Supabase :
// il passe uniquement par /.netlify/functions/data. Les policies RLS côté Supabase n'autorisent
// plus rien pour la clé anon — cette fonction (service_role) contourne RLS par nature, c'est le
// seul chemin d'accès légitime.
const ALLOWED_TABLES = ['fiches', 'flashcards', 'qcm', 'creneaux', 'livrables', 'evenements', 'releve']

const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

// Netlify Functions ne mettent PAS `Content-Type: application/json` par défaut (text/plain sinon) —
// explicite ici, nécessaire pour les clients qui décident du parsing sur ce header (ex. le module
// HTTP d'un outil d'agent Make, voir AUDIT.md Tâche 15-bis).
function json(statusCode, body) {
  return { statusCode, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
}

export const handler = async (event) => {
  const table = event.queryStringParameters?.table

  if (!ALLOWED_TABLES.includes(table)) {
    return json(400, { error: 'unknown_table' })
  }

  if (event.httpMethod === 'GET') {
    const { data, error } = await supabaseAdmin.from(table).select('id, data')
    if (error) return json(500, { error: error.message })
    return json(200, { rows: data.map((row) => row.data) })
  }

  if (event.httpMethod === 'POST') {
    let payload
    try {
      payload = JSON.parse(event.body || '{}')
    } catch {
      return json(400, { error: 'invalid_json' })
    }

    const upsert = Array.isArray(payload.upsert) ? payload.upsert : []
    const del = Array.isArray(payload.delete) ? payload.delete : []

    if (upsert.length) {
      const rows = upsert
        .filter((item) => item?.id)
        .map((item) => ({ id: item.id, data: item, updated_at: new Date().toISOString() }))
      const { error } = await supabaseAdmin.from(table).upsert(rows)
      if (error) return json(500, { error: error.message })
    }

    if (del.length) {
      const { error } = await supabaseAdmin.from(table).delete().in('id', del)
      if (error) return json(500, { error: error.message })
    }

    return json(200, { ok: true })
  }

  return json(405, { error: 'method_not_allowed' })
}
