import { Clock, Coffee, Sparkles, ArrowRight } from 'lucide-react'
import mockCourses from '../data/mockCourses.json'
import { toISODate, formatDateLong } from '../utils/agendaDates'

// Prochain cours daté (hors Entreprise récurrente, non pertinente à mettre en avant ici) :
// le plus proche dans le temps, aujourd'hui inclus s'il n'est pas encore terminé.
function getProchainCours(cours) {
  const now = new Date()
  const todayISO = toISODate(now)
  const minutesMaintenant = now.getHours() * 60 + now.getMinutes()

  const candidats = cours
    .filter((c) => c.date)
    .filter((c) => {
      if (c.date > todayISO) return true
      if (c.date < todayISO) return false
      const [h, m] = c.heureFin.split(':').map(Number)
      return h * 60 + m >= minutesMaintenant
    })
    .sort((a, b) => (a.date === b.date ? a.heureDebut.localeCompare(b.heureDebut) : a.date.localeCompare(b.date)))

  return candidats[0] ?? null
}

// Résume le prochain cours (mockCourses.json) et les fiches en attente (statut ≠ "Rédigée").
// Les deux informations sont volontairement présentées comme deux blocs distincts (séparateur
// vertical, icônes et libellés différents) : un retour formateur signalait qu'affichées côte à côte
// sur une seule ligne, elles laissaient croire que "fiches en attente" ne concernait que le prochain
// cours affiché à gauche — alors que le compte porte sur TOUTES les UE/matières (AUDIT.md J4).
function WelcomeBanner({ fiches, onVoirFichesEnAttente }) {
  const prochainCours = getProchainCours(mockCourses)
  const nbFichesEnAttente = fiches.filter((f) => f.statut !== 'Rédigée').length

  return (
    <div className="rounded-3xl bg-gradient-to-r from-rose-200 via-rose-100 to-peach-100 border border-line shadow-sm shadow-rose-100/50 text-on-accent p-6 flex flex-col sm:flex-row sm:items-stretch gap-4">
      <div className="flex-1 min-w-0">
        <p className="flex items-center gap-1.5 text-rose-500 text-sm mb-1">
          <Sparkles className="w-4 h-4" />
          Prochain cours
        </p>
        {prochainCours ? (
          <>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 shrink-0" />
              <p className="text-lg font-semibold">
                {prochainCours.titre} — {formatDateLong(new Date(`${prochainCours.date}T00:00:00`))} {prochainCours.heureDebut}
              </p>
            </div>
            <p className="text-rose-700 text-sm mt-1">{prochainCours.ue}</p>
          </>
        ) : (
          <p className="text-lg font-semibold">Aucun cours à venir</p>
        )}
      </div>

      <div className="hidden sm:block w-px bg-rose-300/40 shrink-0" />

      <button
        type="button"
        onClick={onVoirFichesEnAttente}
        title="Voir les fiches en attente, toutes UE/matières confondues"
        className="flex items-center gap-3 self-start sm:self-center bg-white/60 hover:bg-white/90 transition-colors px-4 py-3 rounded-xl shrink-0"
      >
        <Coffee className="w-5 h-5 text-rose-500 shrink-0" />
        <div className="text-left">
          <p className="text-2xl font-bold leading-none">{nbFichesEnAttente}</p>
          <p className="text-xs text-rose-700 mt-1">fiche(s) en attente<br />toutes matières confondues</p>
        </div>
        <ArrowRight className="w-4 h-4 shrink-0" />
      </button>
    </div>
  )
}

export default WelcomeBanner
