import { useEffect, useState } from 'react'
import { X, Award, Trash2 } from 'lucide-react'
import { TYPES_EPREUVE } from '../../utils/releve'

const CHAMP =
  'w-full px-3 py-2 rounded-xl bg-app border border-line text-sm text-heading placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-rose-300'

// Modale de création/édition d'une note du relevé (note, barème, coefficient, observation).
// `ues` (optionnel) : liste complète des UE proposées (catalogue + UE ajoutées à la main).
function EvaluationModal({ open, evaluation, estNouvelle, catalogue, ues, onClose, onSave, onDelete }) {
  const [mounted, setMounted] = useState(open)
  const [visible, setVisible] = useState(false)
  const [form, setForm] = useState(evaluation)
  const [erreur, setErreur] = useState(null)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const ueOptions = ues ?? Array.from(new Set(catalogue.map((c) => c.ue)))
  const coursDeLUe = catalogue.filter((c) => !form?.ue || c.ue === form.ue)

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
    if (!open || !evaluation) return
    setForm(evaluation)
    setErreur(null)
    setConfirmingDelete(false)
  }, [open, evaluation])

  useEffect(() => {
    if (!open) return
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  const set = (champ) => (e) => setForm((f) => ({ ...f, [champ]: e.target.value }))

  function handleUeChange(e) {
    const ue = e.target.value
    setForm((f) => ({ ...f, ue, cours: catalogue.some((c) => c.ue === ue && c.titre === f.cours) ? f.cours : '' }))
  }

  function handleCoursChange(e) {
    const cours = catalogue.find((c) => c.titre === e.target.value)
    setForm((f) => ({ ...f, cours: e.target.value, ue: cours?.ue ?? f.ue }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    const num = (v) => parseFloat(String(v).replace(',', '.'))
    if (!form.ue) return setErreur('Choisis une UE.')
    if (form.note !== '' && (Number.isNaN(num(form.note)) || num(form.note) < 0)) return setErreur('La note doit être un nombre positif.')
    if (Number.isNaN(num(form.sur)) || num(form.sur) <= 0) return setErreur('Le barème doit être supérieur à 0.')
    if (form.note !== '' && num(form.note) > num(form.sur)) return setErreur('La note ne peut pas dépasser le barème.')
    if (Number.isNaN(num(form.coefficient)) || num(form.coefficient) <= 0) return setErreur('Le coefficient doit être supérieur à 0.')
    onSave({ ...form, intitule: form.intitule.trim(), observation: form.observation.trim() })
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
            <Award className="w-4 h-4 text-rose-300" />
            {estNouvelle ? 'Nouvelle note' : 'Modifier la note'}
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="eval-ue" className="block text-sm font-medium text-muted mb-1">
                UE
              </label>
              <select id="eval-ue" value={form.ue} onChange={handleUeChange} className={CHAMP}>
                <option value="">— Choisir —</option>
                {ueOptions.map((ue) => (
                  <option key={ue} value={ue}>
                    {ue}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="eval-cours" className="block text-sm font-medium text-muted mb-1">
                Cours <span className="font-normal">(optionnel)</span>
              </label>
              <select id="eval-cours" value={form.cours} onChange={handleCoursChange} className={CHAMP}>
                <option value="">— Aucun —</option>
                {coursDeLUe.map((c) => (
                  <option key={`${c.ue}|${c.titre}`} value={c.titre}>
                    {c.titre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="eval-type" className="block text-sm font-medium text-muted mb-1">
                Type d'épreuve
              </label>
              <select id="eval-type" value={form.type} onChange={set('type')} className={CHAMP}>
                {TYPES_EPREUVE.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="eval-date" className="block text-sm font-medium text-muted mb-1">
                Date
              </label>
              <input id="eval-date" type="date" value={form.date} onChange={set('date')} className={CHAMP} />
            </div>
          </div>

          <div>
            <label htmlFor="eval-intitule" className="block text-sm font-medium text-muted mb-1">
              Intitulé <span className="font-normal">(optionnel)</span>
            </label>
            <input
              id="eval-intitule"
              type="text"
              value={form.intitule}
              onChange={set('intitule')}
              placeholder="Ex. Partiel S1, TP 2 — Webhooks n8n"
              className={CHAMP}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label htmlFor="eval-note" className="block text-sm font-medium text-muted mb-1">
                Note
              </label>
              <input id="eval-note" type="text" inputMode="decimal" value={form.note} onChange={set('note')} placeholder="Ex. 15,5" className={CHAMP} />
            </div>
            <div>
              <label htmlFor="eval-sur" className="block text-sm font-medium text-muted mb-1">
                Sur
              </label>
              <input id="eval-sur" type="text" inputMode="decimal" value={form.sur} onChange={set('sur')} className={CHAMP} />
            </div>
            <div>
              <label htmlFor="eval-coef" className="block text-sm font-medium text-muted mb-1">
                Coefficient
              </label>
              <input id="eval-coef" type="text" inputMode="decimal" value={form.coefficient} onChange={set('coefficient')} className={CHAMP} />
            </div>
          </div>
          <p className="text-xs text-muted -mt-2">Laisse la note vide si l'épreuve n'est pas encore notée (elle ne compte pas dans la moyenne).</p>

          <div>
            <label htmlFor="eval-observation" className="block text-sm font-medium text-muted mb-1">
              Observation / appréciation
            </label>
            <textarea
              id="eval-observation"
              value={form.observation}
              onChange={set('observation')}
              rows={4}
              placeholder="Retour du prof, points forts, ce que tu dois retravailler..."
              className={`${CHAMP} resize-none`}
            />
          </div>

          {erreur && <p className="text-xs text-red-600">{erreur}</p>}

          {confirmingDelete ? (
            <div className="flex items-center justify-between gap-2 pt-2">
              <span className="text-xs text-red-600">Supprimer définitivement cette note ?</span>
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

export default EvaluationModal
