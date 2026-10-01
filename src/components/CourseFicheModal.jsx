import { useEffect, useState } from 'react'
import { X, Heart, Trash2 } from 'lucide-react'
import { STATUTS } from '../utils/statuts'
import PieceJointeFields from './shared/PieceJointeFields'

// Libellé du créneau : date réelle formatée si le cours en a une, sinon jour récurrent (ex. Entreprise).
function formatCreneau(c) {
  const quand = c.date ? c.date.split('-').reverse().join('/') : c.jour
  return `${quand} · ${c.heureDebut}–${c.heureFin}`
}

// Regroupe les cours par UE, dans l'ordre de première apparition (utile pour les <optgroup>).
function groupByUe(courses) {
  const groups = new Map()
  for (const c of courses) {
    if (!groups.has(c.ue)) groups.set(c.ue, [])
    groups.get(c.ue).push(c)
  }
  return groups
}

// Modale de création/édition d'une fiche de cours. État purement local (pas d'IA, pas d'appel externe).
function CourseFicheModal({ open, onClose, courses, fiches, initialCourseId, onSave, onDelete }) {
  const [mounted, setMounted] = useState(open)
  const [visible, setVisible] = useState(false)

  const [courseId, setCourseId] = useState('')
  const [titre, setTitre] = useState('')
  const [ue, setUe] = useState('')
  const [theme, setTheme] = useState('')
  const [notes, setNotes] = useState('')
  const [statut, setStatut] = useState('Brouillon')
  const [lien, setLien] = useState('')
  const [fichier, setFichier] = useState(null)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const ficheExistante = Boolean(fiches[courseId])

  const ueOptions = Array.from(new Set(courses.map((c) => c.ue)))
  const coursesParUe = groupByUe(courses)

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

  // Pré-remplit le formulaire à l'ouverture (fiche existante ou valeurs par défaut du cours).
  useEffect(() => {
    if (!open) return
    const defaultId = initialCourseId ?? courses[0]?.id ?? ''
    applyCourseSelection(defaultId)
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

  function applyCourseSelection(id) {
    const course = courses.find((c) => c.id === id)
    const fiche = fiches[id]
    setCourseId(id)
    setTitre(fiche?.titre ?? course?.titre ?? '')
    setUe(fiche?.ue ?? course?.ue ?? '')
    setTheme(fiche?.theme ?? '')
    setNotes(fiche?.contenu ?? '')
    setStatut(fiche?.statut ?? 'Brouillon')
    setLien(fiche?.lien ?? '')
    setFichier(fiche?.fichier ?? null)
    setConfirmingDelete(false)
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (courseId === '') return
    onSave(courseId, {
      titre: titre.trim() || 'Fiche sans titre',
      ue,
      theme: theme.trim(),
      contenu: notes,
      statut,
      lien: lien.trim(),
      fichier,
    })
  }

  function handleDelete() {
    onDelete(courseId)
  }

  if (!mounted) return null

  return (
    <div
      className={`fixed inset-0 z-50 flex items-start sm:items-center justify-center overflow-y-auto p-4 py-8 transition-opacity duration-200 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className="absolute inset-0 bg-rose-950/40" onClick={onClose} />

      <div
        className={`relative w-full max-w-md max-h-[85vh] overflow-y-auto bg-surface rounded-3xl border border-line shadow-xl shadow-rose-200/50 p-6 transition-all duration-200 ${
          visible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-2'
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="flex items-center gap-1.5 text-lg font-semibold text-heading">
            <Heart className="w-4 h-4 text-rose-300" />
            Fiche de cours
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
            <label htmlFor="fiche-cours" className="block text-sm font-medium text-muted mb-1">
              Cours / créneau
            </label>
            <select
              id="fiche-cours"
              value={courseId}
              onChange={(e) => applyCourseSelection(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-app border border-line text-sm text-heading focus:outline-none focus:ring-2 focus:ring-rose-300"
            >
              {Array.from(coursesParUe.entries()).map(([ue, coursUe]) => (
                <optgroup key={ue} label={ue}>
                  {coursUe.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.titre} — {formatCreneau(c)}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

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
              <label htmlFor="fiche-ue" className="block text-sm font-medium text-muted mb-1">
                UE / Matière
              </label>
              <select
                id="fiche-ue"
                value={ue}
                onChange={(e) => setUe(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-app border border-line text-sm text-heading focus:outline-none focus:ring-2 focus:ring-rose-300"
              >
                {ueOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
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

          <div>
            <label htmlFor="fiche-theme" className="block text-sm font-medium text-muted mb-1">
              Thème <span className="text-muted font-normal">(optionnel)</span>
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

          <PieceJointeFields lien={lien} onLienChange={setLien} fichier={fichier} onFichierChange={setFichier} />

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

          {confirmingDelete ? (
            <div className="flex items-center justify-between gap-2 pt-2">
              <span className="text-xs text-red-600">Supprimer définitivement cette fiche ?</span>
              <div className="flex gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-muted hover:bg-rose-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
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
                    Supprimer
                  </button>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-muted hover:bg-rose-50 transition-colors"
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
