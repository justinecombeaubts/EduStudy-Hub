import { Sparkles, Layers, ChevronRight } from 'lucide-react'
import { getUeStyle } from '../../utils/ueColors'

// Liste des decks déjà enregistrés (AUDIT.md J3 Tâche 13-bis) : clic sur un deck → ouvre le mode
// entraînement (FlashcardTrainer.jsx). Simple confirmation visuelle + point d'entrée, pas de tri/
// filtre ici (liste courte par nature).
function SakuraMesDecks({ flashcards, onSelectDeck }) {
  if (flashcards.length === 0) {
    return (
      <p className="text-xs text-muted">Aucun deck enregistré pour l'instant — génère tes premières flashcards !</p>
    )
  }

  return (
    <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
      {flashcards.map((deck) => {
        const style = getUeStyle(deck.ue)
        return (
          <button
            key={deck.id}
            type="button"
            onClick={() => onSelectDeck(deck)}
            disabled={deck.cards.length === 0}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl border border-line text-left hover:bg-rose-50 hover:border-line disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-colors"
          >
            <Layers className="w-4 h-4 text-rose-300 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm text-heading truncate flex items-center gap-1.5">
                {deck.titre}
                {deck.generatedByAI && <Sparkles className="w-3 h-3 text-orange-400 shrink-0" aria-label="Généré par IA" />}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                {deck.ue && <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${style.badge}`}>{deck.ue}</span>}
                <span className="text-[11px] text-muted">{deck.cards.length} carte(s)</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-rose-300 shrink-0" />
          </button>
        )
      })}
    </div>
  )
}

export default SakuraMesDecks
