import { useEffect, useState } from 'react'
import { X, FolderCheck, Trash2 } from 'lucide-react'
import PieceJointeFields from '../shared/PieceJointeFields'
import { TYPES_LIVRABLE, STATUTS_LIVRABLE, TYPE_EMOJI } from '../../utils/livrables'

const CHAMP =
  'w-full px-3 py-2 rounded-xl bg-app border border-line text-sm text-heading placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-rose-300'

// Modale de création/édition d'un exercice / projet / livrable. État purement local.
// `livrable` : objet à éditer (nouveau ou existant) ; `estNouveau` masque la suppression.
function LivrableModal({ open, livrable, estNouveau, catalogue, onClose, onSave, onDelete }) {
  const [mounted, setMounted] = useState(open)
  const [visible, setVisible] = useState(false)
  const [form, setForm] = useState(livrable)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const ueOptions = Array.from(new Set(catalogue.map((c) => c.ue)))
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
    if (!open || !livrable) return
    setForm(livrable)
    setConfirmingDelete(false)
  }, [open, livrable])

  useEffect(() => {
    if (!open) return
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  const set = (champ) => (valeur) => setForm((f) => ({ ...f, [champ]: valeur }))

  function handleUeChange(ue) {
    // Un cours d'une autre UE n'a plus de sens : on le vide.
    setForm((f) => ({ ...f, ue, cours: catalogue.some((c) => c.ue === ue && c.titre === f.cours) ? f.cours : '' }))
  }

  function handleCoursChange(titre) {
    const cours = catalogue.find((c) => c.titre === titre)
    setForm((f) => ({ ...f, cours: titre, ue: cours?.ue ?? f.ue }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    onSave({
      ...form,
      titre: form.titre.trim() || 'Sans titre',
      note: form.note.trim(),
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
            <FolderCheck className="w-4 h-4 text-rose-300" />
            {estNouveau ? 'Nouveau rendu' : 'Modifier le rendu'}
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
          <div className="flex gap-2" role="radiogroup" aria-label="Type">
            {TYPES_LIVRABLE.map((type) => (
              <button
                key={type}
                type="button"
                role="radio"
                aria-checked={form.type === type}
                onClick={() => set('type')(type)}
                className={`flex-1 px-3 py-2 rounded-2xl text-sm font-semibold border transition-colors ${
                  form.type === type
                    ? 'bg-rose-100 border-rose-300 text-rose-800'
                    : 'border-line text-muted hover:bg-rose-50 hover:text-rose-700'
                }`}
              >
                <span aria-hidden="true">{TYPE_EMOJI[type]}</span> {type}
              </button>
            ))}
          </div>

          <div>
            <label htmlFor="livrable-titre" className="block text-sm font-medium text-muted mb-1">
              Titre
            </label>
            <input
              id="livrable-titre"
              type="text"
              value={form.titre}
              onChange={(e) => set('titre')(e.target.value)}
              placeholder="Ex. TP 2 — Automatisation n8n"
              className={CHAMP}
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="livrable-ue" className="block text-sm font-medium text-muted mb-1">
                UE
              </label>
              <select id="livrable-ue" value={form.ue} onChange={(e) => handleUeChange(e.target.value)} className={CHAMP}>
                <option value="">— Aucune —</option>
                {ueOptions.map((ue) => (
                  <option key={ue} value={ue}>
                    {ue}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="livrable-cours" className="block text-sm font-medium text-muted mb-1">
                Cours lié
              </label>
              <select id="livrable-cours" value={form.cours} onChange={(e) => handleCoursChange(e.target.value)} className={CHAMP}>
                <option value="">— Aucun —</option>
                {coursDeLUe.map((c) => (
                  <option key={`${c.ue}|${c.titre}`} value={c.titre}>
                    {c.titre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label htmlFor="livrable-date" className="block text-sm font-medium text-muted mb-1">
                Date de rendu
              </label>
              <input
                id="livrable-date"
                type="date"
                value={form.dateRendu}
                onChange={(e) => set('dateRendu')(e.target.value)}
                className={CHAMP}
              />
            </div>
            <div>
              <label htmlFor="livrable-statut" className="block text-sm font-medium text-muted mb-1">
                Statut
              </label>
              <select id="livrable-statut" value={form.statut} onChange={(e) => set('statut')(e.target.value)} className={CHAMP}>
                {STATUTS_LIVRABLE.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="livrable-note" className="block text-sm font-medium text-muted mb-1">
                Note
              </label>
              <input
                id="livrable-note"
                type="text"
                value={form.note}
                onChange={(e) => set('note')(e.target.value)}
                placeholder="Ex. 16/20"
                className={CHAMP}
              />
            </div>
          </div>

          <div>
            <label htmlFor="livrable-description" className="block text-sm font-medium text-muted mb-1">
              Description / consignes / retour du prof
            </label>
            <textarea
              id="livrable-description"
              value={form.description}
              onChange={(e) => set('description')(e.target.value)}
              rows={4}
              placeholder="Ce qui était demandé, ce que tu as rendu, les remarques reçues..."
              className={`${CHAMP} resize-none`}
            />
          </div>

          <PieceJointeFields
            liens={form.liens}
            onLiensChange={set('liens')}
            fichiers={form.fichiers}
            onFichiersChange={set('fichiers')}
          />

          {confirmingDelete ? (
            <div className="flex items-center justify-between gap-2 pt-2">
              <span className="text-xs text-red-600">Supprimer définitivement ce rendu ?</span>
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
                {!estNouveau && (
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

export default LivrableModal
