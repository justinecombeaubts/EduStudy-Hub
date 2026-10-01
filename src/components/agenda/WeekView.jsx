import { useState } from 'react'
import { FileText } from 'lucide-react'
import { JOURS_OUVRES, getWeekDates, getCoursesForDate, toISODate } from '../../utils/agendaDates'
import { getCourseStatus, STATUS_STYLES, STATUS_LABEL, STATUS_BADGE } from '../../utils/courseStatus'
import { getUeStyle } from '../../utils/ueColors'

const HEURE_DEBUT = 8
const HEURE_FIN = 20 // exclusif
const NB_SLOTS = (HEURE_FIN - HEURE_DEBUT) * 2 // pas de 30 min

function timeToSlot(time) {
  const [h, m] = time.split(':').map(Number)
  return (h - HEURE_DEBUT) * 2 + (m >= 30 ? 1 : 0)
}

// Grille horaire de la semaine (Lundi → Vendredi, 8h–20h), branchée sur mockCourses.json.
// Résout, pour chaque jour réel de la semaine affichée, les cours datés ou récurrents (Entreprise) qui s'y appliquent.
// Sur mobile (< md), la grille horaire à défilement horizontal est peu lisible (retour formateur,
// AUDIT.md J4) : on affiche à la place des onglets Lundi→Vendredi + une liste verticale du jour
// sélectionné (même esprit que DayView), la grille complète restant réservée aux écrans ≥ tablette.
function WeekView({ referenceDate, courses, fiches, onCourseClick }) {
  const heures = Array.from({ length: HEURE_FIN - HEURE_DEBUT }, (_, i) => HEURE_DEBUT + i)
  const semaineDates = getWeekDates(referenceDate).slice(0, 5) // Lundi → Vendredi
  const todayISO = toISODate(new Date())

  const coursSemaine = semaineDates.flatMap((jourDate, colIdx) =>
    getCoursesForDate(jourDate, courses).map((c) => ({ ...c, _col: colIdx }))
  )

  const indexAujourdhui = semaineDates.findIndex((d) => toISODate(d) === todayISO)
  const [jourSelectionne, setJourSelectionne] = useState(indexAujourdhui >= 0 ? indexAujourdhui : 0)
  const coursJourSelectionne = getCoursesForDate(semaineDates[jourSelectionne], courses).sort((a, b) =>
    a.heureDebut.localeCompare(b.heureDebut)
  )

  return (
    <div>
      {/* Vue mobile : onglets jour + liste verticale */}
      <div className="md:hidden">
        <div className="flex border-b border-line">
          {JOURS_OUVRES.map((jour, idx) => (
            <button
              key={jour}
              type="button"
              onClick={() => setJourSelectionne(idx)}
              className={`flex-1 py-2.5 text-center border-b-2 transition-colors ${
                jourSelectionne === idx
                  ? 'border-rose-400 text-heading font-semibold'
                  : 'border-transparent text-muted'
              }`}
            >
              <p className="text-xs">{jour.slice(0, 3)}</p>
              <p className="text-sm">{semaineDates[idx].getDate()}</p>
            </button>
          ))}
        </div>

        {coursJourSelectionne.length === 0 ? (
          <div className="p-8 text-center text-muted text-sm">Aucun cours ce jour-là. Journée libre ☕</div>
        ) : (
          <ol className="divide-y divide-rose-50">
            {coursJourSelectionne.map((cours) => {
              const fiche = fiches[cours.id]
              const ue = getUeStyle(cours.ue)
              const statut = getCourseStatus(cours, todayISO)
              return (
                <li key={cours.id}>
                  <button
                    type="button"
                    onClick={() => onCourseClick(cours.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-rose-50/60 transition-colors"
                  >
                    <div className="w-12 shrink-0 text-sm font-medium text-muted">{cours.heureDebut}</div>
                    <span className={`w-2 h-2 rounded-full shrink-0 ${ue.dot}`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-heading truncate">{cours.titre}</p>
                      <p className="text-xs text-muted truncate">
                        {cours.ue} · {cours.heureDebut}–{cours.heureFin}
                      </p>
                    </div>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full shrink-0 ${STATUS_BADGE[statut]}`}>
                      {STATUS_LABEL[statut]}
                    </span>
                    {fiche && <FileText className="w-4 h-4 text-rose-400 shrink-0" aria-label={`Fiche ${fiche.statut}`} />}
                  </button>
                </li>
              )
            })}
          </ol>
        )}
      </div>

      {/* Vue tablette/desktop : grille horaire complète */}
      <div className="hidden md:block overflow-x-auto">
        <div className="min-w-[640px]">
          {/* En-tête des jours */}
          <div className="grid grid-cols-[56px_repeat(5,1fr)] border-b border-line">
            <div />
            {JOURS_OUVRES.map((jour, idx) => (
              <div key={jour} className="px-2 py-3 text-center">
                <p className="text-sm font-medium text-muted">{jour}</p>
                <p className="text-xs text-muted">{semaineDates[idx].getDate()}</p>
              </div>
            ))}
          </div>

          {/* Grille horaire */}
          <div
            className="relative grid grid-cols-[56px_repeat(5,1fr)]"
            style={{ gridTemplateRows: `repeat(${NB_SLOTS}, 1.75rem)` }}
          >
            {/* Labels d'heure */}
            {heures.map((h, i) => (
              <div
                key={h}
                className="col-start-1 row-start-auto text-xs text-muted pr-2 text-right -translate-y-2"
                style={{ gridRow: `${i * 2 + 1} / span 2` }}
              >
                {String(h).padStart(2, '0')}h
              </div>
            ))}

            {/* Lignes horaires (une par heure) */}
            {heures.map((h, i) => (
              <div
                key={`ligne-${h}`}
                className="border-t border-rose-50"
                style={{ gridColumn: '2 / -1', gridRow: i * 2 + 1 }}
              />
            ))}

            {/* Séparateurs verticaux entre jours */}
            {JOURS_OUVRES.map((jour, idx) => (
              <div
                key={`sep-${jour}`}
                className="border-l border-rose-50"
                style={{ gridColumn: idx + 2, gridRow: `1 / span ${NB_SLOTS}` }}
              />
            ))}

            {/* Cours */}
            {coursSemaine.map((cours) => {
              const start = timeToSlot(cours.heureDebut)
              const end = timeToSlot(cours.heureFin)
              const fiche = fiches[cours.id]
              const statut = getCourseStatus(cours, todayISO)
              return (
                <button
                  key={cours.id}
                  type="button"
                  onClick={() => onCourseClick(cours.id)}
                  className={`relative m-0.5 rounded-xl border px-2 py-1 text-xs overflow-hidden text-left cursor-pointer hover:brightness-95 transition-[filter] ${STATUS_STYLES[statut]}`}
                  style={{
                    gridColumn: cours._col + 2,
                    gridRow: `${start + 1} / span ${end - start}`,
                  }}
                  title={`${cours.titre} (${STATUS_LABEL[statut]})`}
                >
                  {fiche && (
                    <FileText
                      className="absolute top-1 right-1 w-3 h-3 opacity-80"
                      aria-label={`Fiche ${fiche.statut}`}
                    />
                  )}
                  <p className="font-semibold truncate pr-3">{cours.titre}</p>
                  <p className="truncate opacity-80">
                    {cours.heureDebut} – {cours.heureFin}
                  </p>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default WeekView
