import { useEffect, useState } from 'react'
import { Clock } from 'lucide-react'
import { JOURS_SEMAINE, MOIS } from '../utils/agendaDates'

const MOIS_COURT = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']
const deuxChiffres = (n) => String(n).padStart(2, '0')

// Date + heure courantes dans le Header (mise à jour chaque seconde pour basculer pile à la minute).
// Version longue ≥ lg ("Vendredi 9 octobre 2026 · 14:32"), courte en dessous ("Ven. 9 oct. · 14:32").
function Horloge() {
  const [maintenant, setMaintenant] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setMaintenant(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const jour = JOURS_SEMAINE[maintenant.getDay()]
  const mois = MOIS[maintenant.getMonth()].toLowerCase()
  const heure = `${deuxChiffres(maintenant.getHours())}:${deuxChiffres(maintenant.getMinutes())}`

  return (
    <time
      dateTime={maintenant.toISOString()}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface border border-line text-xs font-semibold text-heading shrink-0"
    >
      <Clock className="w-3.5 h-3.5 text-rose-400 shrink-0" />
      <span className="hidden lg:inline">
        {jour} {maintenant.getDate()} {mois} {maintenant.getFullYear()}
      </span>
      <span className="lg:hidden">
        {jour.slice(0, 3)}. {maintenant.getDate()} {MOIS_COURT[maintenant.getMonth()]}
      </span>
      <span className="text-muted" aria-hidden="true">·</span>
      <span className="tabular-nums">{heure}</span>
    </time>
  )
}

export default Horloge
