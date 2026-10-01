import { FileText } from 'lucide-react'
import { getCoursesForDate, toISODate } from '../../utils/agendaDates'
import { getUeStyle } from '../../utils/ueColors'
import { getCourseStatus, STATUS_BADGE, STATUS_LABEL } from '../../utils/courseStatus'

// Fil d'actualité horaire (8h–19h) des cours du jour sélectionné, avec statut et fiche.
function DayView({ date, courses, fiches, onCourseClick }) {
  const coursJour = getCoursesForDate(date, courses).sort((a, b) => a.heureDebut.localeCompare(b.heureDebut))
  const todayISO = toISODate(new Date())

  if (coursJour.length === 0) {
    return <div className="p-10 text-center text-muted text-sm">Aucun cours ce jour-là. Journée libre ☕</div>
  }

  return (
    <ol className="divide-y divide-rose-50">
      {coursJour.map((cours) => {
        const fiche = fiches[cours.id]
        const ue = getUeStyle(cours.ue)
        const statut = getCourseStatus(cours, todayISO)
        return (
          <li key={cours.id}>
            <button
              type="button"
              onClick={() => onCourseClick(cours.id)}
              className="w-full flex items-center gap-3 md:gap-4 px-4 md:px-6 py-4 text-left hover:bg-rose-50/60 transition-colors"
            >
              <div className="w-14 md:w-16 shrink-0 text-sm font-medium text-muted">{cours.heureDebut}</div>
              <span className={`w-2 h-2 rounded-full shrink-0 ${ue.dot}`} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-heading truncate">{cours.titre}</p>
                <p className="text-xs text-muted truncate">
                  {cours.ue} · {cours.heureDebut}–{cours.heureFin}
                  {cours.salle ? ` · ${cours.salle}` : ''}
                </p>
              </div>
              <span className={`hidden sm:inline-block text-[11px] px-2 py-0.5 rounded-full shrink-0 ${STATUS_BADGE[statut]}`}>
                {STATUS_LABEL[statut]}
              </span>
              {fiche && (
                <FileText className="w-4 h-4 text-rose-400 shrink-0" aria-label={`Fiche ${fiche.statut}`} />
              )}
            </button>
          </li>
        )
      })}
    </ol>
  )
}

export default DayView
