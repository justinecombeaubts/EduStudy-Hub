import { useEffect, useState } from 'react'
import { X, PartyPopper, Trash2 } from 'lucide-react'

const CHAMP =
  'w-full px-3 py-2 rounded-xl bg-app border border-line text-sm text-heading placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-rose-300'

// Modale de création/édition d'un événement libre de l'agenda (nom, date, horaires, description).
// `evenement` : objet existant, ou null pour en créer un (pré-daté sur `dateParDefaut`).
function EvenementModal({ open, evenement, dateParDefaut, onClose, onSave, onDelete }) {
  const [mounted, setMounted] = useState(open)
  const [visible, setVisible] = useState(false)
  const [titre, setTitre] = useState('')
  const [date, setDate] = useState('')
  const [heureDebut, setHeureDebut] = useState('09:00')
  const [heureFin, setHeureFin] = useState('10:00')
  const [description, setDescription] = useState('')
  const [erreur, setErreur] = useState(null)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

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

  useEffect(() => {
    if (!open) return
    setTitre(evenement?.titre ?? '')
    setDate(evenement?.date ?? dateParDefaut ?? '')
    setHeureDebut(evenement?.heureDebut ?? '09:00')
    setHeureFin(evenement?.heureFin ?? '10:00')
    setDescription(evenement?.description ?? '')
    setErreur(null)
    setConfirmingDelete(false)
  }, [open, evenement, dateParDefaut])

  useEffect(() => {
    if (!open) return
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  function handleSubmit(e) {
    e.preventDefault()
    if (!titre.trim()) return setErreur('Donne un nom à ton événement.')
    if (!date) return setErreur('Choisis une date.')
    if (heureFin <= heureDebut) return setErreur("L'heure de fin doit être après l'heure de début.")
    onSave({
      id: evenement?.id ?? `evt-${Date.now()}`,
      titre: titre.trim(),
      date,
      heureDebut,
      heureFin,
      description: description.trim(),
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
            <PartyPopper className="w-4 h-4 text-rose-300" />
            {evenement ? "Modifier l'événement" : 'Nouvel événement'}
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
            <label htmlFor="evt-titre" className="block text-sm font-medium text-muted mb-1">
              Nom de l'événement
            </label>
            <input
              id="evt-titre"
              type="text"
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              placeholder="Ex. Soutenance, réunion de groupe, salon étudiant..."
              className={CHAMP}
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="evt-date" className="block text-sm font-medium text-muted mb-1">
              Date
            </label>
            <input id="evt-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className={CHAMP} />
          </div>

          <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="evt-debut" className="block text-sm font-medium text-muted mb-1">
                  Début
                </label>
                <input id="evt-debut" type="time" value={heureDebut} onChange={(e) => setHeureDebut(e.target.value)} className={CHAMP} />
              </div>
              <div>
                <label htmlFor="evt-fin" className="block text-sm font-medium text-muted mb-1">
                  Fin
                </label>
                <input id="evt-fin" type="time" value={heureFin} onChange={(e) => setHeureFin(e.target.value)} className={CHAMP} />
              </div>
          </div>

          <div>
            <label htmlFor="evt-description" className="block text-sm font-medium text-muted mb-1">
              Description <span className="font-normal">(optionnelle)</span>
            </label>
            <textarea
              id="evt-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Lieu, choses à préparer, personnes présentes..."
              className={`${CHAMP} resize-none`}
            />
          </div>

          {erreur && <p className="text-xs text-red-600">{erreur}</p>}

          {confirmingDelete ? (
            <div className="flex items-center justify-between gap-2 pt-2">
              <span className="text-xs text-red-600">Supprimer cet événement ?</span>
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
                  onClick={() => onDelete(evenement.id)}
                  className="px-4 py-2 rounded-full text-sm font-medium bg-red-500 text-white hover:bg-red-600 shadow-md transition-colors"
                >
                  Oui, supprimer
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2 pt-2">
              <div>
                {evenement && (
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

export default EvenementModal
