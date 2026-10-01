import { useEffect, useState } from 'react'
import { X, Library } from 'lucide-react'

// Regroupe les fiches par UE, dans l'ordre de première apparition (utile pour les <optgroup>).
function groupByUe(fiches) {
  const groups = new Map()
  for (const f of fiches) {
    if (!groups.has(f.ue)) groups.set(f.ue, [])
    groups.get(f.ue).push(f)
  }
  return groups
}

// Modale de création/édition d'une définition du Dictionnaire (AUDIT.md J4 — retour formateur).
// Édition : `entree` fournie (terme/définition/fiche/index déjà connus, fiche non modifiable).
// Création : `entree` absente, l'utilisateur choisit la fiche source (obligatoire — une définition
// reste rattachée à une fiche, cohérent avec le modèle `fiche.redactionIA.definitions`).
// Toute définition créée/éditée ici est marquée `origin: 'manuel'` à la création (jamais présentée
// comme "généré par IA" — Charte §4, transparence) ; une définition IA existante garde son origine
// IA même après une simple correction de coquille.
function DefinitionModal({ open, onClose, entree, fiches, onSave }) {
  const [mounted, setMounted] = useState(open)
  const [visible, setVisible] = useState(false)
  const [ficheId, setFicheId] = useState('')
  const [terme, setTerme] = useState('')
  const [definition, setDefinition] = useState('')

  const isEdition = Boolean(entree)
  const fichesParUe = groupByUe(fiches)

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
    setFicheId(entree ? entree.fiche.id : fiches[0]?.id ?? '')
    setTerme(entree?.terme ?? '')
    setDefinition(entree?.definition ?? '')
  }, [open, entree]) // eslint-disable-line react-hooks/exhaustive-deps

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
    if (!ficheId || !terme.trim()) return
    onSave({ ficheId, terme: terme.trim(), definition: definition.trim() })
  }

  if (!mounted) return null

  return (
    <div
      className={`fixed inset-0 z-[60] flex items-start sm:items-center justify-center overflow-y-auto p-4 py-8 transition-opacity duration-200 ${
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
            <Library className="w-4 h-4 text-rose-300" />
            {isEdition ? 'Modifier la définition' : 'Nouvelle définition'}
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
            <label htmlFor="def-fiche" className="block text-sm font-medium text-muted mb-1">
              Fiche source
            </label>
            <select
              id="def-fiche"
              value={ficheId}
              onChange={(e) => setFicheId(e.target.value)}
              disabled={isEdition}
              className="w-full px-3 py-2 rounded-xl bg-app border border-line text-sm text-heading focus:outline-none focus:ring-2 focus:ring-rose-300 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {Array.from(fichesParUe.entries()).map(([ue, fichesUe]) => (
                <optgroup key={ue} label={ue}>
                  {fichesUe.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.titre}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            {isEdition && <p className="text-xs text-muted mt-1">La fiche source d'une définition ne se change pas.</p>}
          </div>

          <div>
            <label htmlFor="def-terme" className="block text-sm font-medium text-muted mb-1">
              Terme
            </label>
            <input
              id="def-terme"
              type="text"
              value={terme}
              onChange={(e) => setTerme(e.target.value)}
              placeholder="Ex. Bloc de constitutionnalité"
              className="w-full px-3 py-2 rounded-xl bg-app border border-line text-sm text-heading placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-rose-300"
            />
          </div>

          <div>
            <label htmlFor="def-definition" className="block text-sm font-medium text-muted mb-1">
              Définition
            </label>
            <textarea
              id="def-definition"
              value={definition}
              onChange={(e) => setDefinition(e.target.value)}
              rows={4}
              placeholder="Explique ce terme en quelques mots..."
              className="w-full px-3 py-2 rounded-xl bg-app border border-line text-sm text-heading placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-rose-300 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium text-muted hover:bg-rose-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={!ficheId || !terme.trim()}
              className="px-4 py-2 rounded-full text-sm font-medium bg-rose-300 text-on-accent hover:bg-rose-400 shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default DefinitionModal
