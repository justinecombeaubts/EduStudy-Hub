import { useEffect, useState } from 'react'

// State React persisté dans localStorage (survit aux rafraîchissements de page).
// Tolérant : navigation privée / quota dépassé / JSON invalide → repli silencieux sur `initialValue`.
export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = window.localStorage.getItem(key)
      return stored !== null ? JSON.parse(stored) : initialValue
    } catch {
      return initialValue
    }
  })

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // Stockage indisponible : on continue avec le state en mémoire seulement.
    }
  }, [key, value])

  return [value, setValue]
}
