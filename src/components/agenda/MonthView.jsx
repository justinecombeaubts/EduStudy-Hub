import { getMonthGrid, getCoursesForDate, isSameDay } from '../../utils/agendaDates'
import { getUeStyle } from '../../utils/ueColors'

const JOURS_COURT = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const MAX_VISIBLE = 3

// Grille calendaire mensuelle : mini-badges pastel par UE pour chaque jour.
function MonthView({ date, courses, onCourseClick, onSelectDay }) {
  const jours = getMonthGrid(date)
  const today = new Date()

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[640px]">
        <div className="grid grid-cols-7 border-b border-line">
          {JOURS_COURT.map((j) => (
            <div key={j} className="px-2 py-2 text-center text-xs font-medium text-muted">
              {j}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {jours.map((jour) => {
            const dansLeMois = jour.getMonth() === date.getMonth()
            const coursJour = getCoursesForDate(jour, courses)
            const estAujourdhui = isSameDay(jour, today)

            return (
              <div
                key={jour.toISOString()}
                className={`min-h-[92px] border-b border-r border-rose-50 p-1.5 ${dansLeMois ? '' : 'bg-rose-50/30'}`}
              >
                <button
                  type="button"
                  onClick={() => onSelectDay(jour)}
                  className={`text-xs mb-1 inline-flex items-center justify-center w-6 h-6 rounded-full transition-colors ${
                    estAujourdhui
                      ? 'bg-rose-300 text-on-accent font-semibold'
                      : dansLeMois
                        ? 'text-muted hover:bg-rose-50'
                        : 'text-muted hover:bg-rose-50/60'
                  }`}
                >
                  {jour.getDate()}
                </button>

                <div className="space-y-0.5">
                  {coursJour.slice(0, MAX_VISIBLE).map((cours) => {
                    const ue = getUeStyle(cours.ue)
                    return (
                      <button
                        key={cours.id}
                        type="button"
                        onClick={() => onCourseClick(cours.id)}
                        title={`${cours.titre ?? 'Créneau libre'} — ${cours.heureDebut}`}
                        className={`w-full truncate text-left text-[10px] px-1.5 py-0.5 rounded-md ${ue.badge}`}
                      >
                        {cours.heureDebut} {cours.titre ?? 'Créneau libre'}
                      </button>
                    )
                  })}
                  {coursJour.length > MAX_VISIBLE && (
                    <p className="text-[10px] text-muted px-1.5">+{coursJour.length - MAX_VISIBLE} de plus</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default MonthView
