import { useState } from 'react'
import { Sparkles, X } from 'lucide-react'
import { getUeStyle } from '../../utils/ueColors'

// Relecture des decks générés par l'IA avant sauvegarde (AUDIT.md J3 Tâche 13) — jamais appliqué
// automatiquement (Charte IA §4) : chaque deck peut être retiré individuellement, seul le clic sur
// "Enregistrer" persiste les decks restants dans le store `edustudy-hub:flashcards`.
function SakuraReviewDecks({ decks, onEnregistrer, onAnnuler }) {
  const [retires, setRetires] = useState(new Set())

  const decksConserves = decks.filter((d) => !retires.has(d.id))

  function toggleRetire(id) {
    setRetires((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
        {decks.map((deck) => {
          const retire = retires.has(deck.id)
          const style = getUeStyle(deck.ue)
          return (
            <div
              key={deck.id}
              className={`rounded-2xl border p-3 space-y-2 transition-opacity ${
                retire ? 'border-line bg-surface-muted opacity-50' : 'border-orange-200 bg-orange-50/70'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-full font-medium bg-orange-100 text-orange-800 mb-1">
                    <Sparkles className="w-3 h-3" />
                    Généré par IA — à relire
                  </div>
                  <h4 className="font-semibold text-heading leading-snug truncate">{deck.titre}</h4>
                  {deck.ue && (
                    <span className={`inline-block mt-1 text-[11px] px-2 py-0.5 rounded-full font-medium ${style.badge}`}>
                      {deck.ue}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => toggleRetire(deck.id)}
                  title={retire ? 'Reprendre ce deck' : 'Retirer ce deck'}
                  className="p-1 rounded-lg text-muted hover:bg-surface hover:text-red-600 transition-colors shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {!retire && (
                <ul className="space-y-1">
                  {deck.cards.map((card) => (
                    <li key={card.id} className="text-xs leading-snug">
                      <span className="font-medium text-muted">{card.question}</span>
                      {card.reponse && <span className="text-muted"> — {card.reponse}</span>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )
        })}
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onAnnuler}
          className="px-4 py-2 rounded-xl text-sm font-medium text-muted hover:bg-rose-50 transition-colors"
        >
          Annuler
        </button>
        <button
          type="button"
          onClick={() => onEnregistrer(decksConserves)}
          disabled={decksConserves.length === 0}
          className="px-4 py-2 rounded-full text-sm font-medium bg-rose-300 text-on-accent hover:bg-rose-400 disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition-colors"
        >
          Enregistrer ({decksConserves.length})
        </button>
      </div>
    </div>
  )
}

export default SakuraReviewDecks
