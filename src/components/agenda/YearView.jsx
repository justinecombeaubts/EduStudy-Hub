import { Flame } from 'lucide-react'
import { MOIS, getMonthLoad } from '../../utils/agendaDates'

function heatClass(ratio) {
  if (ratio > 0.75) return 'bg-rose-300 text-on-accent'
  if (ratio > 0.4) return 'bg-rose-100 text-rose-800'
  if (ratio > 0) return 'bg-peach-50 text-orange-700'
  return 'bg-surface-muted text-muted'
}

// Aperçu synthétique des 12 mois de l'année, avec une "chaleur" de charge de travail
// (nombre de créneaux récurrents dans le mois, relatif au reste de l'année).
function YearView({ date, courses, onSelectMonth }) {
  const year = date.getFullYear()
  const mois = Array.from({ length: 12 }, (_, i) => new Date(year, i, 1))
  const charges = mois.map((m) => getMonthLoad(m, courses))
  const max = Math.max(...charges, 1)
  const min = Math.min(...charges)

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 p-4">
      {mois.map((m, i) => {
        const ratio = max === min ? 0.5 : (charges[i] - min) / (max - min)
        return (
          <button
            key={m.toISOString()}
            type="button"
            onClick={() => onSelectMonth(m)}
            className="rounded-2xl border border-line p-3 text-left hover:shadow-sm hover:shadow-rose-100/50 transition-shadow"
          >
            <p className="text-sm font-semibold text-heading mb-2">{MOIS[i]}</p>
            <span
              className={`inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-full ${heatClass(ratio)}`}
            >
              <Flame className="w-3 h-3" />
              {charges[i]} créneaux
            </span>
          </button>
        )
      })}
    </div>
  )
}

export default YearView
