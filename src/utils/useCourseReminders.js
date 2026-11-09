import { useCallback, useEffect, useState } from 'react'
import { getCoursesForDate, toISODate } from './agendaDates'

// Rappels de cours (notifications Windows via l'API Notification + service worker).
// Fonctionne tant que l'app est ouverte, même réduite ou en arrière-plan : une vérification chaque
// minute envoie un rappel `minutesAvant` minutes avant chaque créneau du jour. Les créneaux
// "Entreprise" (récurrents, hors école) et les créneaux encore vides (sans cours affecté) sont ignorés ;
// les événements créés à la main sont rappelés comme les cours. Chaque rappel n'est envoyé qu'une fois
// (clé coursId + date mémorisée en LocalStorage).
const SETTINGS_KEY = 'edustudy-hub-rappels'
const SENT_KEY = 'edustudy-hub-rappels-envoyes'
const UE_IGNOREES = ['Entreprise']
const DEFAULT_SETTINGS = { actif: false, minutesAvant: 15 }

function lireJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback
  } catch {
    return fallback
  }
}

function ecrireJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {}
}

export function notificationsSupportees() {
  return typeof window !== 'undefined' && 'Notification' in window
}

// Affiche une notification via le service worker si disponible (requis par Chrome/Edge en app
// installée, et permet le clic → retour à la fenêtre), sinon via `new Notification`.
export async function afficherNotification(titre, options = {}) {
  const opts = { icon: '/icons/icon-192.png', badge: '/icons/icon-192.png', lang: 'fr', ...options }
  try {
    const reg = await navigator.serviceWorker?.getRegistration()
    if (reg) return reg.showNotification(titre, opts)
  } catch {}
  return new Notification(titre, opts)
}

function debutDuCours(date, heure) {
  const [h, m] = heure.split(':').map(Number)
  const d = new Date(date)
  d.setHours(h, m, 0, 0)
  return d
}

// Créneaux à rappeler maintenant : ceux du jour qui commencent dans moins de `minutesAvant` minutes.
export function coursARappeler(now, courses, minutesAvant) {
  return getCoursesForDate(now, courses)
    .filter((c) => c.titre && c.heureDebut && !UE_IGNOREES.includes(c.ue))
    .map((c) => ({ cours: c, debut: debutDuCours(now, c.heureDebut) }))
    .filter(({ debut }) => {
      const diffMin = (debut - now) / 60000
      return diffMin > 0 && diffMin <= minutesAvant
    })
}

export function useCourseReminders(courses) {
  const [settings, setSettings] = useState(() => lireJSON(SETTINGS_KEY, DEFAULT_SETTINGS))
  const [permission, setPermission] = useState(() => (notificationsSupportees() ? Notification.permission : 'unsupported'))

  useEffect(() => ecrireJSON(SETTINGS_KEY, settings), [settings])

  const verifier = useCallback(() => {
    if (!settings.actif || !notificationsSupportees() || Notification.permission !== 'granted') return
    const now = new Date()
    const envoyes = lireJSON(SENT_KEY, {})
    const aujourdhui = toISODate(now)
    // On ne garde que les rappels du jour (évite que la liste grossisse indéfiniment).
    const restants = Object.fromEntries(Object.entries(envoyes).filter(([k]) => k.endsWith(aujourdhui)))
    for (const { cours, debut } of coursARappeler(now, courses, settings.minutesAvant)) {
      const cle = `${cours.id}@${aujourdhui}`
      if (restants[cle]) continue
      const minutes = Math.max(1, Math.round((debut - now) / 60000))
      afficherNotification(`📚 ${cours.titre} dans ${minutes} min`, {
        body: [`${cours.heureDebut}–${cours.heureFin}`, cours.salle, cours.professeur].filter(Boolean).join(' · '),
        tag: cle,
        data: { url: '/?vue=agenda' },
      })
      restants[cle] = true
    }
    ecrireJSON(SENT_KEY, restants)
  }, [courses, settings])

  useEffect(() => {
    verifier()
    const id = setInterval(verifier, 60 * 1000)
    // Au retour de veille du PC, l'intervalle a pu être suspendu : on revérifie tout de suite.
    const onVisible = () => document.visibilityState === 'visible' && verifier()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [verifier])

  async function activer() {
    if (!notificationsSupportees()) return false
    const result = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission()
    setPermission(result)
    if (result !== 'granted') return false
    setSettings((s) => ({ ...s, actif: true }))
    afficherNotification('🔔 Rappels de cours activés', {
      body: `Tu seras prévenue ${settings.minutesAvant} min avant chaque cours, tant que l'app est ouverte.`,
      tag: 'rappels-actives',
    })
    return true
  }

  function desactiver() {
    setSettings((s) => ({ ...s, actif: false }))
  }

  function setMinutesAvant(minutesAvant) {
    setSettings((s) => ({ ...s, minutesAvant }))
  }

  return {
    supporte: notificationsSupportees(),
    permission,
    actif: settings.actif && permission === 'granted',
    minutesAvant: settings.minutesAvant,
    activer,
    desactiver,
    setMinutesAvant,
  }
}
