import { ChevronLeft, ChevronRight } from 'lucide-react'

// Navigation temporelle partagée par les 4 vues (Jour/Semaine/Mois/Année).
function AgendaNav({ label, onPrev, onNext, onToday }) {
  return (
    <div className="flex items-center justify-between gap-2 px-4 py-2 border-b border-line">
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onPrev}
          aria-label="Période précédente"
          className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={onNext}
          aria-label="Période suivante"
          className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={onToday}
          className="ml-1 px-3 py-1 rounded-lg text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 transition-colors"
        >
          Aujourd'hui
        </button>
      </div>
      <p className="text-sm font-medium text-heading truncate">{label}</p>
    </div>
  )
}

export default AgendaNav
