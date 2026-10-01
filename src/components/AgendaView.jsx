import { useState } from 'react'
import { Plus, Coffee } from 'lucide-react'
import mockCourses from '../data/mockCourses.json'
import CourseFicheModal from './CourseFicheModal'
import AgendaNav from './agenda/AgendaNav'
import WeekView from './agenda/WeekView'
import DayView from './agenda/DayView'
import MonthView from './agenda/MonthView'
import YearView from './agenda/YearView'
import { addDays, addMonths, addYears, getWeekDates, JOURS_SEMAINE, MOIS } from '../utils/agendaDates'
import { matchesSearch } from '../utils/searchFilter'

const VUES = ['Jour', 'Semaine', 'Mois', 'Année']
const COURSE_FIELDS = { titre: 'titre', ue: 'ue' } // mockCourses.json n'a pas de champ thème

function formatLabel(vue, date) {
  if (vue === 'Jour') {
    return `${JOURS_SEMAINE[date.getDay()]} ${date.getDate()} ${MOIS[date.getMonth()].toLowerCase()} ${date.getFullYear()}`
  }
  if (vue === 'Semaine') {
    const [debut, , , , fin] = getWeekDates(date) // Lundi → Vendredi
    return debut.getMonth() === fin.getMonth()
      ? `${debut.getDate()} – ${fin.getDate()} ${MOIS[fin.getMonth()].toLowerCase()} ${fin.getFullYear()}`
      : `${debut.getDate()} ${MOIS[debut.getMonth()].toLowerCase()} – ${fin.getDate()} ${MOIS[fin.getMonth()].toLowerCase()} ${fin.getFullYear()}`
  }
  if (vue === 'Mois') {
    return `${MOIS[date.getMonth()]} ${date.getFullYear()}`
  }
  return `${date.getFullYear()}`
}

// Interface centrale : onglets de vues + navigation temporelle + vue dédiée (Jour/Semaine/Mois/Année).
// Porte aussi la création/édition de fiches de cours (bouton "+" et clic sur un cours), et applique
// la recherche/le filtre globaux (Header) sur les cours affichés dans les 4 vues.
// `fiches` est le tableau unifié (même donnée que le Coin Study, voir App.jsx) : on en dérive ici
// un lookup par courseId (une fiche de cours a `id === courseId`) pour les vues et la modale.
function AgendaView({ search, filterType, filterValue, fiches, onFichesChange }) {
  const [vueActive, setVueActive] = useState('Semaine')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [modalOpen, setModalOpen] = useState(false)
  const [activeCourseId, setActiveCourseId] = useState(null)

  const coursesFiltres = mockCourses.filter((c) =>
    matchesSearch(c, { search, filterType, filterValue }, COURSE_FIELDS)
  )
  const filtreActif = search.trim() !== '' || Boolean(filterValue) || filterType === 'Thème'
  const aucunResultat = filtreActif && coursesFiltres.length === 0

  const fichesByCourseId = Object.fromEntries(
    fiches.filter((f) => f.courseId).map((f) => [f.courseId, f])
  )

  function handleOpenCreate() {
    setActiveCourseId(null)
    setModalOpen(true)
  }

  function handleOpenCourse(coursId) {
    setActiveCourseId(coursId)
    setModalOpen(true)
  }

  function handleSaveFiche(coursId, data) {
    const course = mockCourses.find((c) => c.id === coursId)
    const existing = fichesByCourseId[coursId]
    // CourseFicheModal ne connaît pas l'Écriture magique (Coin Study uniquement, AUDIT.md J2
    // Tâche 7) : on préserve la mise en forme IA déjà validée, sauf si le contenu a changé ici
    // (elle ne correspondrait alors plus au texte source).
    const redactionIA = existing?.contenu === data.contenu ? (existing?.redactionIA ?? null) : null
    const ficheAJour = {
      id: coursId,
      courseId: coursId,
      titre: data.titre,
      ue: data.ue,
      theme: data.theme ?? existing?.theme ?? '',
      statut: data.statut,
      contenu: data.contenu,
      date: course?.date ?? existing?.date ?? null,
      redactionIA,
      // Toujours pris tels quels depuis la modale (déjà pré-remplis depuis la fiche existante à
      // l'ouverture) — pas de repli sur `existing`, sinon un fichier retiré (mis à `null`) serait
      // silencieusement restauré par le `??`.
      lien: data.lien,
      fichier: data.fichier,
    }

    onFichesChange(
      existing ? fiches.map((f) => (f.id === coursId ? ficheAJour : f)) : [...fiches, ficheAJour]
    )
    setModalOpen(false)
  }

  // Suppression locale uniquement (pas de scénario Make dédié à ce jour — voir AUDIT.md).
  function handleDeleteFiche(coursId) {
    onFichesChange(fiches.filter((f) => f.id !== coursId))
    setModalOpen(false)
  }

  function handlePrev() {
    if (vueActive === 'Jour') setCurrentDate((d) => addDays(d, -1))
    else if (vueActive === 'Semaine') setCurrentDate((d) => addDays(d, -7))
    else if (vueActive === 'Mois') setCurrentDate((d) => addMonths(d, -1))
    else setCurrentDate((d) => addYears(d, -1))
  }

  function handleNext() {
    if (vueActive === 'Jour') setCurrentDate((d) => addDays(d, 1))
    else if (vueActive === 'Semaine') setCurrentDate((d) => addDays(d, 7))
    else if (vueActive === 'Mois') setCurrentDate((d) => addMonths(d, 1))
    else setCurrentDate((d) => addYears(d, 1))
  }

  function handleToday() {
    setCurrentDate(new Date())
  }

  function handleSelectDay(day) {
    setCurrentDate(day)
    setVueActive('Jour')
  }

  function handleSelectMonth(month) {
    setCurrentDate(month)
    setVueActive('Mois')
  }

  return (
    <div className="relative">
      <section className="bg-surface rounded-2xl border border-line shadow-sm shadow-rose-100/50 overflow-hidden">
        <div className="flex items-center gap-1 p-2 border-b border-line bg-rose-50/60">
          {VUES.map((vue) => (
            <button
              key={vue}
              type="button"
              onClick={() => setVueActive(vue)}
              className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-colors ${
                vueActive === vue ? 'bg-rose-300 text-on-accent' : 'text-muted hover:bg-surface hover:text-rose-700'
              }`}
            >
              {vue}
            </button>
          ))}
        </div>

        <AgendaNav
          label={formatLabel(vueActive, currentDate)}
          onPrev={handlePrev}
          onNext={handleNext}
          onToday={handleToday}
        />

        {aucunResultat ? (
          <div className="p-10 flex flex-col items-center gap-2 text-center">
            <Coffee className="w-8 h-8 text-rose-300" />
            <p className="text-sm font-medium text-heading">Aucun cours ne correspond à ta recherche</p>
            <p className="text-xs text-muted">Essaie un autre mot-clé ou réinitialise les filtres dans l'en-tête.</p>
          </div>
        ) : (
          <>
            {vueActive === 'Semaine' && (
              <WeekView referenceDate={currentDate} courses={coursesFiltres} fiches={fichesByCourseId} onCourseClick={handleOpenCourse} />
            )}
            {vueActive === 'Jour' && (
              <DayView date={currentDate} courses={coursesFiltres} fiches={fichesByCourseId} onCourseClick={handleOpenCourse} />
            )}
            {vueActive === 'Mois' && (
              <MonthView date={currentDate} courses={coursesFiltres} onCourseClick={handleOpenCourse} onSelectDay={handleSelectDay} />
            )}
            {vueActive === 'Année' && (
              <YearView date={currentDate} courses={coursesFiltres} onSelectMonth={handleSelectMonth} />
            )}
          </>
        )}
      </section>

      <button
        type="button"
        onClick={handleOpenCreate}
        aria-label="Créer une fiche de cours"
        title="Créer une fiche de cours"
        className="absolute bottom-4 right-4 w-12 h-12 flex items-center justify-center rounded-full bg-rose-300 text-on-accent hover:bg-rose-400 shadow-md transition-colors"
      >
        <Plus className="w-6 h-6" />
      </button>

      <CourseFicheModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        courses={mockCourses}
        fiches={fichesByCourseId}
        initialCourseId={activeCourseId}
        onSave={handleSaveFiche}
        onDelete={handleDeleteFiche}
      />
    </div>
  )
}

export default AgendaView
