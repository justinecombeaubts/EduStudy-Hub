import { useEffect, useRef, useState } from 'react'

// Remplace `useLocalStorage` comme source de vérité pour les données app (AUDIT.md J4/J17 — fiches,
// flashcards, QCM), cross-device via Supabase — mais SANS jamais parler à Supabase directement
// depuis le navigateur. Tout passe par la fonction serveur `/api/data.js` (portage Vercel de
// l'ancienne fonction Netlify), seule à détenir la clé Supabase "service_role" (jamais exposée au
// client, voir ce fichier pour le détail). Cette séparation est le correctif sécurité de la
// Tâche 17 : avant, la clé "anon" — bien que publique par design — donnait un accès direct en
// lecture/écriture depuis n'importe où ; désormais aucune clé Supabase, publique ou privée, ne
// quitte le serveur.
//
// Toujours un repli LocalStorage, jamais de blocage :
// - lecture instantanée du cache local au montage (pas d'écran vide le temps du fetch réseau) ;
// - écriture du cache à chaque changement ;
// - si la fonction serveur est injoignable (offline, pas encore déployée), l'app continue avec le
//   cache seul.
const FUNCTION_URL = '/api/data'

export function useSupabaseStore(table, initialValue) {
  const cacheKey = `edustudy-hub:cache:${table}`
  const [value, setValueState] = useState(() => {
    try {
      const cached = window.localStorage.getItem(cacheKey)
      return cached !== null ? JSON.parse(cached) : initialValue
    } catch {
      return initialValue
    }
  })
  // Dernier tableau connu comme synchronisé avec Supabase, pour calculer le diff (upsert/delete)
  // à chaque écriture — jamais lu par l'UI, seulement par syncToServer.
  const previousRef = useRef(value)

  // Lecture initiale via la fonction serveur (une fois par montage). Si la table distante est vide
  // (premier lancement du projet Supabase), on part du cache local et on le pousse côté serveur
  // plutôt que d'effacer les données de démo déjà visibles à l'écran.
  useEffect(() => {
    let cancelled = false

    fetch(`${FUNCTION_URL}?table=${table}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`http_${res.status}`))))
      .then(({ rows }) => {
        if (cancelled) return
        if (rows.length > 0) {
          previousRef.current = rows
          setValueState(rows)
        } else {
          setValueState((current) => {
            syncToServer(table, [], current)
            previousRef.current = current
            return current
          })
        }
      })
      .catch((error) => {
        if (cancelled) return
        console.warn(`[BDD] Lecture "${table}" impossible, repli sur le cache local :`, error.message)
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table])

  // Cache local systématique (offline / repli), à chaque changement de valeur — même mécanique que
  // useLocalStorage.js.
  useEffect(() => {
    try {
      window.localStorage.setItem(cacheKey, JSON.stringify(value))
    } catch {
      // Stockage indisponible : on continue en mémoire seulement.
    }
  }, [cacheKey, value])

  function setValue(next) {
    setValueState((prev) => {
      const resolved = typeof next === 'function' ? next(prev) : next
      syncToServer(table, previousRef.current, resolved)
      previousRef.current = resolved
      return resolved
    })
  }

  return [value, setValue]
}

// Best-effort, non bloquant : le state React est
// déjà mis à jour par setValue avant même que cette fonction ne parte — un échec réseau ici n'affecte
// jamais l'UI, seulement la synchro cross-device (avertissement console).
async function syncToServer(table, previous, next) {
  const prevIds = new Set(previous.map((item) => item.id))
  const nextIds = new Set(next.map((item) => item.id))
  const upsert = next.filter((item) => item?.id)
  const del = [...prevIds].filter((id) => !nextIds.has(id))

  if (!upsert.length && !del.length) return

  try {
    const res = await fetch(`${FUNCTION_URL}?table=${table}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ upsert, delete: del }),
    })
    if (!res.ok) throw new Error(`http_${res.status}`)
  } catch (error) {
    console.warn(`[BDD] Échec de synchronisation "${table}" (la donnée locale n'est pas affectée) :`, error.message)
  }
}
