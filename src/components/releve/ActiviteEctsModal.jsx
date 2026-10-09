import { useEffect, useState } from 'react'
import { X, Sparkle, Trash2 } from 'lucide-react'
import PieceJointeFields from '../shared/PieceJointeFields'

const CHAMP =
  'w-full px-3 py-2 rounded-xl bg-app border border-line text-sm text-heading placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-rose-300'

// Formulaire d'ajout manuel d'ECTS obtenus via une activité proposée par l'école.
// La justification est obligatoire ; justificatifs (liens / fichiers) optionnels.
function ActiviteEctsModal({ open, activite, estNouvelle, onClose, onSave, onDelete }) {
  const [mounted, setMounted] = useState(open)
  const [visible, setVisible] = useState(false)
  const [form, setForm] = useState(activite)
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
    if (!open || !activite) return
    setForm(activite)
    setErreur(null)
    setConfirmingDelete(false)
  }, [open, activite])

  useEffect(() => {
    if (!open) return
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  const set = (champ) => (valeur) => setForm((f) => ({ ...f, [champ]: valeur }))

  function handleSubmit(e) {
    e.preventDefault()
    const ects = parseFloat(String(form.ects).replace(',', '.'))
    if (!form.titre.trim()) return setErreur("Indique le nom de l'activité.")
    if (!Number.isFinite(ects) || ects <= 0) return setErreur("Le nombre d'ECTS doit être supérieur à 0.")
    if (!form.justification.trim()) return setErreur("La justification est obligatoire pour ajouter des ECTS.")
    onSave({
      ...form,
      titre: form.titre.trim(),
      ects: String(ects),
      justification: form.justification.trim(),
      liens: form.liens.map((l) => l.trim()).filter(Boolean),
    })
  }

  if (!mounted || !form) return null

  return (
    <div
      className={`fixed inset-0 z-50 flex items-start sm:items-center justify-center overflow-y-auto p-4 py-8 transition-opacity duration-200 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className="absolute inset-0 bg-rose-950/40 backdrop-blur-[2px]" onClick={onClose} />

      <div
        className={`relative w-full max-w-lg max-h-[85vh] overflow-y-auto bg-surface rounded-3xl border border-line shadow-xl shadow-rose-200/50 p-6 transition-all duration-200 ${
          visible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-2'
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="flex items-center gap-1.5 text-lg font-semibold text-heading">
            <Sparkle className="w-4 h-4 text-rose-300" />
            {estNouvelle ? 'Ajouter des ECTS additionnels' : "Modifier l'activité"}
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
            <label htmlFor="act-titre" className="block text-sm font-medium text-muted mb-1">
              Activité proposée par l'école
            </label>
            <input
              id="act-titre"
              type="text"
              value={form.titre}
              onChange={(e) => set('titre')(e.target.value)}
              placeholder="Ex. Conférence S1, Conférence S2, journée portes ouvertes..."
              className={CHAMP}
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="act-date" className="block text-sm font-medium text-muted mb-1">
                Date
              </label>
              <input id="act-date" type="date" value={form.date} onChange={(e) => set('date')(e.target.value)} className={CHAMP} />
            </div>
            <div>
              <label htmlFor="act-ects" className="block text-sm font-medium text-muted mb-1">
                ECTS obtenus
              </label>
              <input
                id="act-ects"
                type="text"
                inputMode="decimal"
                value={form.ects}
                onChange={(e) => set('ects')(e.target.value)}
                placeholder="Ex. 1"
                className={CHAMP}
              />
            </div>
          </div>

          <div>
            <label htmlFor="act-justification" className="block text-sm font-medium text-muted mb-1">
              Justification <span className="text-red-600">*</span>
            </label>
            <textarea
              id="act-justification"
              value={form.justification}
              onChange={(e) => set('justification')(e.target.value)}
              rows={4}
              placeholder="Pourquoi ces ECTS t'ont été attribués : ce que tu as fait, qui l'a validé, référence de l'activité..."
              className={`${CHAMP} resize-none`}
            />
          </div>

          <PieceJointeFields
            liens={form.liens}
            onLiensChange={set('liens')}
            fichiers={form.fichiers}
            onFichiersChange={set('fichiers')}
          />

          {erreur && <p className="text-xs text-red-600">{erreur}</p>}

          {confirmingDelete ? (
            <div className="flex items-center justify-between gap-2 pt-2">
              <span className="text-xs text-red-600">Supprimer cette activité et ses ECTS ?</span>
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
                  onClick={() => onDelete(form.id)}
                  className="px-4 py-2 rounded-full text-sm font-medium bg-red-500 text-white hover:bg-red-600 shadow-md transition-colors"
                >
                  Oui, supprimer
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2 pt-2">
              <div>
                {!estNouvelle && (
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

export default ActiviteEctsModal
