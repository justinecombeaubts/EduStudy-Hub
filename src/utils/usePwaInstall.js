import { useEffect, useState } from 'react'

// Installation de l'app (PWA) : Edge/Chrome sur Windows émettent `beforeinstallprompt` quand le site
// est installable (manifest + service worker). On garde l'événement pour proposer notre propre bouton
// "Installer l'app" dans la Sidebar, masqué une fois l'app installée ou ouverte dans sa propre fenêtre.
function isStandalone() {
  return window.matchMedia?.('(display-mode: standalone)').matches || window.matchMedia?.('(display-mode: window-controls-overlay)').matches
}

export function usePwaInstall() {
  const [promptEvent, setPromptEvent] = useState(null)
  const [installed, setInstalled] = useState(() => isStandalone())

  useEffect(() => {
    const onPrompt = (e) => {
      e.preventDefault()
      setPromptEvent(e)
    }
    const onInstalled = () => {
      setInstalled(true)
      setPromptEvent(null)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  async function install() {
    if (!promptEvent) return
    promptEvent.prompt()
    const { outcome } = await promptEvent.userChoice
    if (outcome === 'accepted') setInstalled(true)
    setPromptEvent(null)
  }

  return { canInstall: !!promptEvent && !installed, installed, install }
}
