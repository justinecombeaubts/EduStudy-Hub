import { createClient } from '@supabase/supabase-js'

// Portage Vercel de netlify/functions/data.js (migration Netlify → Vercel).
// Même contrat : seule cette fonction détient la clé Supabase "service_role" (variables d'env
// SANS préfixe VITE_, jamais injectées dans le bundle navigateur). Le front ne parle jamais
// directement à Supabase, il passe uniquement par /api/data.
const ALLOWED_TABLES = ['fiches', 'flashcards', 'qcm', 'creneaux', 'livrables', 'evenements']

// .trim() défensif : une variable d'env Vercel collée avec un BOM UTF-8 en tête (fréquent en
// copiant depuis un fichier édité sous Windows) fait planter fetch/Supabase avec une erreur
// ByteString peu explicite ("character at index 0 has a value of 65279") — voir AUDIT.md Tâche 19.
const supabaseAdmin = createClient(process.env.SUPABASE_URL?.trim(), process.env.SUPABASE_SERVICE_ROLE_KEY?.trim())

export default async function handler(req, res) {
  const table = req.query.table

  if (!ALLOWED_TABLES.includes(table)) {
    return res.status(400).json({ error: 'unknown_table' })
  }

  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin.from(table).select('id, data')
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ rows: data.map((row) => row.data) })
  }

  if (req.method === 'POST') {
    const payload = req.body || {}
    const upsert = Array.isArray(payload.upsert) ? payload.upsert : []
    const del = Array.isArray(payload.delete) ? payload.delete : []

    if (upsert.length) {
      const rows = upsert
        .filter((item) => item?.id)
        .map((item) => ({ id: item.id, data: item, updated_at: new Date().toISOString() }))
      const { error } = await supabaseAdmin.from(table).upsert(rows)
      if (error) return res.status(500).json({ error: error.message })
    }

    if (del.length) {
      const { error } = await supabaseAdmin.from(table).delete().in('id', del)
      if (error) return res.status(500).json({ error: error.message })
    }

    return res.status(200).json({ ok: true })
  }

  return res.status(405).json({ error: 'method_not_allowed' })
}
