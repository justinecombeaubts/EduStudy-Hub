import { useEffect, useState } from 'react'
import { X, Heart, Trash2, CalendarClock } from 'lucide-react'
import { STATUTS } from '../utils/statuts'
import { MOIS, toISODate } from '../utils/agendaDates'
import { lirePiecesJointes } from '../utils/piecesJointes'
import PieceJointeFields from './shared/PieceJointeFields'

const LIBRE = ''
const coursKey = (c) => (c?.titre ? `${c.ue}|${c.titre}` : LIBRE)

// Libellé du créneau : date réelle formatée si le cours en a une, sinon jour récurrent (ex. Entreprise).
function formatCreneau(c) {
  const quand = c.date ? c.date.split('-').reverse().join('/') : c.jour
  return `${quand} · ${c.heureDebut}–${c.heureFin}`
}

// Regroupe des éléments dans l'ordre de première apparition (utile pour les <optgroup>).
function groupBy(items, keyFn) {
  const groups = new Map()
  for (const item of items) {
    const k = keyFn(item)
    if (!groups.has(k)) groups.set(k, [])
    groups.get(k).push(item)
  }
  return groups
}

const moisLabel = (c) => {
  if (!c.date) return 'Récurrent'
  const [y, m] = c.date.split('-').map(Number)
  return `${MOIS[m - 1]} ${y}`
}

// Modale d'un créneau de l'agenda : l'étudiant choisit lui-même le cours qui occupe le créneau
// (liste déroulante du catalogue, `catalogueCours.json`) puis, optionnellement, rédige la fiche
// associée (notes, liens, fichiers). État purement local (pas d'IA, pas d'appel externe).
function CourseFicheModal({ open, onClose, courses, catalogue, fiches, initialCourseId, onSave, onDelete }) {
  const [mounted, setMounted] = useState(open)
  const [visible, setVisible] = useState(false)

  const [courseId, setCourseId] = useState('')
  const [choixCours, setChoixCours] = useState(LIBRE)
  const [titre, setTitre] = useState('')
  const [theme, setTheme] = useState('')
  const [notes, setNotes] = useState('')
  const [statut, setStatut] = useState('Brouillon')
  const [liens, setLiens] = useState([])
  const [fichiers, setFichiers] = useState([])
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const creneau = courses.find((c) => c.id === courseId)
  const estEntreprise = creneau?.ue === 'Entreprise'
  const ficheExistante = Boolean(fiches[courseId])
  const coursChoisi = catalogue.find((c) => coursKey(c) === choixCours) ?? null

  // Créneaux datés triés chronologiquement (l'Entreprise récurrente à la fin).
  const creneauxTries = courses.filter((c) => c.ue !== 'Événement').sort((a, b) =>
    (a.date ?? '9999').localeCompare(b.date ?? '9999') || a.heureDebut.localeCompare(b.heureDebut)
  )
  const creneauxParMois = groupBy(creneauxTries, moisLabel)
  const catalogueParUe = groupBy(catalogue, (c) => c.ue)

  // Anime l'ouverture/fermeture : garde le composant monté le temps de la transition de sortie.
  useEffect(() => {
    if (open) {
      setMounted(true)
      const frame = requestAnimationFrame(() => setVisible(true))
      return () => cancelAnimationFrame(frame)
    }
    setVisible(false)
    const timer = setTimeout(() => setMounted(false), 200)
    return () => clearTimeout(timer)
  }, [open])

  // À l'ouverture via "+" : premier créneau libre à venir (sinon le premier de la liste).
  useEffect(() => {
    if (!open) return
    const todayISO = toISODate(new Date())
    const defaultId =
      initialCourseId ??
      creneauxTries.find((c) => !c.titre && c.date && c.date >= todayISO)?.id ??
      creneauxTries[0]?.id ??
      ''
    applySlotSelection(defaultId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialCourseId])

  useEffect(() => {
    if (!open) return
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  function applySlotSelection(id) {
    const slot = courses.find((c) => c.id === id)
    const fiche = fiches[id]
    const pj = lirePiecesJointes(fiche)
    setCourseId(id)
    setChoixCours(coursKey(slot))
    setTitre(fiche?.titre ?? slot?.titre ?? '')
    setTheme(fiche?.theme ?? '')
    setNotes(fiche?.contenu ?? '')
    setStatut(fiche?.statut ?? 'Brouillon')
    setLiens(pj.liens)
    setFichiers(pj.fichiers)
    setConfirmingDelete(false)
  }

  function handleCoursChange(key) {
    const nouveau = catalogue.find((c) => coursKey(c) === key)
    // Le titre de fiche suit le cours tant que l'étudiant ne l'a pas personnalisé.
    if (!titre.trim() || titre === coursChoisi?.titre) setTitre(nouveau?.titre ?? '')
    setChoixCours(key)
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (courseId === '') return
    const aDuContenu =
      notes.trim() || theme.trim() || liens.some((l) => l.trim()) || fichiers.length > 0 || statut !== 'Brouillon'
    const ueFiche = estEntreprise ? 'Entreprise' : coursChoisi?.ue ?? fiches[courseId]?.ue ?? ''
    onSave(courseId, {
      cours: estEntreprise ? undefined : coursChoisi,
      fiche:
        ficheExistante || aDuContenu
          ? {
              titre: titre.trim() || coursChoisi?.titre || 'Fiche sans titre',
              ue: ueFiche,
              theme: theme.trim(),
              contenu: notes,
              statut,
              liens,
              fichiers,
            }
          : null,
    })
  }

  if (!mounted) return null

  return (
    <div
      className={`fixed inset-0 z-50 flex items-start sm:items-center justify-center overflow-y-auto p-4 py-8 transition-opacity duration-200 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className="absolute inset-0 bg-rose-950/40 backdrop-blur-[2px]" onClick={onClose} />

      <div
        className={`relative w-full max-w-md max-h-[85vh] overflow-y-auto bg-surface rounded-3xl border border-line shadow-xl shadow-rose-200/50 p-6 transition-all duration-200 ${
          visible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-2'
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="flex items-center gap-1.5 text-lg font-semibold text-heading">
            <Heart className="w-4 h-4 text-rose-300" />
            Créneau &amp; fiche de cours
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="p-1 rounded-lg text-rose-300 hover:bg-rose-50 hover:text-rose-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="fiche-creneau" className="flex items-center gap-1.5 text-sm font-medium text-muted mb-1">
              <CalendarClock className="w-3.5 h-3.5" />
              Créneau
            </label>
            <select
              id="fiche-creneau"
              value={courseId}
              onChange={(e) => applySlotSelection(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-app border border-line text-sm text-heading focus:outline-none focus:ring-2 focus:ring-rose-300"
            >
              {Array.from(creneauxParMois.entries()).map(([mois, slots]) => (
                <optgroup key={mois} label={mois}>
                  {slots.map((c) => (
                    <option key={c.id} value={c.id}>
                      {formatCreneau(c)} — {c.titre ?? 'Créneau libre'}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="fiche-cours" className="block text-sm font-medium text-muted mb-1">
              Cours
            </label>
            {estEntreprise ? (
              <p className="px-3 py-2 rounded-xl bg-peach-100 text-orange-800 text-sm">Mission Entreprise (alternance)</p>
            ) : (
              <select
                id="fiche-cours"
                value={choixCours}
                onChange={(e) => handleCoursChange(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-app border border-line text-sm text-heading focus:outline-none focus:ring-2 focus:ring-rose-300"
              >
                <option value={LIBRE}>— Créneau libre (aucun cours) —</option>
                {Array.from(catalogueParUe.entries()).map(([ue, coursUe]) => (
                  <optgroup key={ue} label={ue}>
                    {coursUe.map((c) => (
                      <option key={coursKey(c)} value={coursKey(c)}>
                        {c.titre}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            )}
            {coursChoisi && <p className="text-xs text-muted mt-1">UE : {coursChoisi.ue}</p>}
          </div>

          <div className="border-t border-line pt-4 space-y-4">
            <p className="text-xs text-muted">
              Fiche de cours <span className="font-normal">(optionnelle — remplis-la quand tu veux)</span>
            </p>

            <div>
              <label htmlFor="fiche-titre" className="block text-sm font-medium text-muted mb-1">
                Titre de la fiche
              </label>
              <input
                id="fiche-titre"
                type="text"
                value={titre}
                onChange={(e) => setTitre(e.target.value)}
                placeholder="Ex. Chapitre 3 — Récursivité"
                className="w-full px-3 py-2 rounded-xl bg-app border border-line text-sm text-heading placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-rose-300"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="fiche-theme" className="block text-sm font-medium text-muted mb-1">
                  Thème
                </label>
                <input
                  id="fiche-theme"
                  type="text"
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  placeholder="Ex. Droit du travail"
                  className="w-full px-3 py-2 rounded-xl bg-app border border-line text-sm text-heading placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-rose-300"
                />
              </div>

              <div>
                <label htmlFor="fiche-statut" className="block text-sm font-medium text-muted mb-1">
                  Statut
                </label>
                <select
                  id="fiche-statut"
                  value={statut}
                  onChange={(e) => setStatut(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-app border border-line text-sm text-heading focus:outline-none focus:ring-2 focus:ring-rose-300"
                >
                  {STATUTS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <PieceJointeFields liens={liens} onLiensChange={setLiens} fichiers={fichiers} onFichiersChange={setFichiers} />

            <div>
              <label htmlFor="fiche-notes" className="block text-sm font-medium text-muted mb-1">
                Notes mises au propre
              </label>
              <textarea
                id="fiche-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={5}
                placeholder="Recopie et organise tes notes de cours ici..."
                className="w-full px-3 py-2 rounded-xl bg-app border border-line text-sm text-heading placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-rose-300 resize-none"
              />
            </div>
          </div>

          {confirmingDelete ? (
            <div className="flex items-center justify-between gap-2 pt-2">
              <span className="text-xs text-red-600">Supprimer définitivement cette fiche ?</span>
              <div className="flex gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-muted hover:bg-rose-50 hover:text-rose-700 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(courseId)}
                  className="px-4 py-2 rounded-full text-sm font-medium bg-red-500 text-white hover:bg-red-600 shadow-md transition-colors"
                >
                  Oui, supprimer
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2 pt-2">
              <div>
                {ficheExistante && (
                  <button
                    type="button"
                    onClick={() => setConfirmingDelete(true)}
                    className="flex items-center gap-1.5 px-3 py-2 -ml-3 rounded-xl text-sm font-medium text-rose-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Supprimer la fiche
                  </button>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-muted hover:bg-rose-50 hover:text-rose-700 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-full text-sm font-medium bg-rose-300 text-on-accent hover:bg-rose-400 shadow-md transition-colors"
                >
                  Enregistrer
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}

export default CourseFicheModal
