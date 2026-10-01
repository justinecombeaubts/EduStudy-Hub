import { useEffect, useState } from 'react'

const STORAGE_KEY = 'edustudy-hub-theme'

// Bascule clair/sombre + persistance LocalStorage — la classe `dark` est déjà posée avant le
// premier paint par le script inline de index.html (évite le flash), ce hook la garde synchronisée.
export function useTheme() {
  const [theme, setTheme] = useState(() => (document.documentElement.classList.contains('dark') ? 'dark' : 'light'))

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch {}
  }, [theme])

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))

  return { theme, toggleTheme }
}
