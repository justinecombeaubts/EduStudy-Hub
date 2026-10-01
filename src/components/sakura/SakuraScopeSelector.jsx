import { useEffect, useMemo, useState } from 'react'
import { Check } from 'lucide-react'
import { getUeStyle } from '../../utils/ueColors'

// Sélecteur de périmètre partagé par les flux flashcards et QCM (AUDIT.md J3, Tâches 13/14) :
// choix "Par UE" ou "Par cours/fiche", sélection d'un ou plusieurs éléments (cases à cocher).
// Seules les fiches avec du contenu sont proposables (rien à envoyer à l'IA sinon). Résout toujours
// vers une liste de `ficheIds` communiquée au parent via `onSelectionChange`.
function SakuraScopeSelector({ fiches, prefillFicheIds, onSelectionChange }) {
  const fichesAvecContenu = useMemo(() => fiches.filter((f) => f.contenu?.trim()), [fiches])
  const ueOptions = useMemo(
    () => Array.from(new Set(fichesAvecContenu.map((f) => f.ue))).sort(),
    [fichesAvecContenu]
  )

  const [par, setPar] = useState(prefillFicheIds?.length ? 'cours' : 'ue')
  const [uesSelectionnees, setUesSelectionnees] = useState(new Set())
  const [fichesSelectionnees, setFichesSelectionnees] = useState(new Set(prefillFicheIds ?? []))

  const ficheIdsResolus = useMemo(() => {
    if (par === 'ue') {
      return fichesAvecContenu.filter((f) => uesSelectionnees.has(f.ue)).map((f) => f.id)
    }
    return Array.from(fichesSelectionnees)
  }, [par, fichesAvecContenu, uesSelectionnees, fichesSelectionnees])

  useEffect(() => {
    onSelectionChange(ficheIdsResolus)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ficheIdsResolus])

  function toggleUe(ue) {
    setUesSelectionnees((prev) => {
      const next = new Set(prev)
      if (next.has(ue)) next.delete(ue)
      else next.add(ue)
      return next
    })
  }

  function toggleFiche(id) {
    setFichesSelectionnees((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (fichesAvecContenu.length === 0) {
    return (
      <p className="text-xs text-muted">
        Aucune fiche avec du contenu pour l'instant — rédige d'abord une fiche dans le Coin Study.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-1.5 p-1 bg-rose-50 rounded-xl w-fit">
        {[
          { key: 'ue', label: 'Par UE' },
          { key: 'cours', label: 'Par cours' },
        ].map((opt) => (
          <button
            key={opt.key}
            type="button"
            onClick={() => setPar(opt.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              par === opt.key ? 'bg-surface text-heading shadow-sm' : 'text-rose-500 hover:text-rose-700'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <p className="text-[11px] text-muted">Sélectionne un ou plusieurs éléments.</p>

      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
        {par === 'ue'
          ? ueOptions.map((ue) => {
              const style = getUeStyle(ue)
              const selected = uesSelectionnees.has(ue)
              return (
                <button
                  key={ue}
                  type="button"
                  onClick={() => toggleUe(ue)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl border text-sm text-left transition-colors ${
                    selected ? 'border-rose-300 bg-rose-50' : 'border-line hover:bg-rose-50/60'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                      selected ? 'bg-rose-400 border-rose-400 text-white' : 'border-rose-300'
                    }`}
                  >
                    {selected && <Check className="w-3 h-3" strokeWidth={3} />}
                  </span>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${style.badge}`}>{ue}</span>
                </button>
              )
            })
          : fichesAvecContenu.map((fiche) => {
              const style = getUeStyle(fiche.ue)
              const selected = fichesSelectionnees.has(fiche.id)
              return (
                <button
                  key={fiche.id}
                  type="button"
                  onClick={() => toggleFiche(fiche.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl border text-sm text-left transition-colors ${
                    selected ? 'border-rose-300 bg-rose-50' : 'border-line hover:bg-rose-50/60'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                      selected ? 'bg-rose-400 border-rose-400 text-white' : 'border-rose-300'
                    }`}
                  >
                    {selected && <Check className="w-3 h-3" strokeWidth={3} />}
                  </span>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium shrink-0 ${style.badge}`}>
                    {fiche.ue}
                  </span>
                  <span className="truncate text-heading">{fiche.titre}</span>
                </button>
              )
            })}
      </div>
    </div>
  )
}

export default SakuraScopeSelector
