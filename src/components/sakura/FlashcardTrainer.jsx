import { useState } from 'react'
import { ArrowLeft, ArrowRight, RotateCcw, Sparkles } from 'lucide-react'

// Mode entraînement d'un deck de flashcards (AUDIT.md J3 Tâche 13-bis) : une carte à la fois,
// clic pour retourner (question ↔ réponse), navigation Précédent/Suivant, compteur de progression.
// Purement local (pas de suivi de score/répétition espacée aujourd'hui — juste parcourir le deck).
function FlashcardTrainer({ deck, onQuitter }) {
  const [index, setIndex] = useState(0)
  const [retournee, setRetournee] = useState(false)
  const carte = deck.cards[index]
  const dernieresCarte = index === deck.cards.length - 1

  function handleSuivant() {
    if (dernieresCarte) return
    setIndex((i) => i + 1)
    setRetournee(false)
  }

  function handlePrecedent() {
    if (index === 0) return
    setIndex((i) => i - 1)
    setRetournee(false)
  }

  function handleRecommencer() {
    setIndex(0)
    setRetournee(false)
  }

  if (!carte) {
    return <p className="text-xs text-muted">Ce deck ne contient aucune carte.</p>
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted">
          Carte {index + 1} / {deck.cards.length}
        </p>
        {deck.generatedByAI && (
          <span className="flex items-center gap-1 text-[10px] text-orange-500">
            <Sparkles className="w-3 h-3" />
            IA
          </span>
        )}
      </div>

      {/* Barre de progression */}
      <div className="h-1 rounded-full bg-rose-100 overflow-hidden">
        <div
          className="h-full bg-rose-300 transition-all duration-200"
          style={{ width: `${((index + 1) / deck.cards.length) * 100}%` }}
        />
      </div>

      <button
        type="button"
        onClick={() => setRetournee((v) => !v)}
        className={`w-full min-h-40 flex flex-col items-center justify-center gap-2 p-5 rounded-2xl border text-center transition-colors ${
          retournee ? 'bg-rose-50 border-line' : 'bg-surface border-line'
        }`}
      >
        <span className="text-[10px] font-medium uppercase tracking-wide text-rose-400">
          {retournee ? 'Réponse' : 'Question'}
        </span>
        <p className="text-sm text-heading leading-snug">{retournee ? carte.reponse : carte.question}</p>
        <span className="text-[11px] text-muted mt-1">Clique pour retourner la carte</span>
      </button>

      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={handlePrecedent}
          disabled={index === 0}
          className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-medium text-rose-500 hover:bg-rose-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Précédent
        </button>

        {dernieresCarte ? (
          <button
            type="button"
            onClick={handleRecommencer}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-rose-300 text-on-accent hover:bg-rose-400 shadow-md transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Recommencer
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSuivant}
            className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-medium text-rose-500 hover:bg-rose-50 transition-colors"
          >
            Suivant
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      <button type="button" onClick={onQuitter} className="text-xs text-rose-500 hover:underline">
        ← Retour à mes decks
      </button>
    </div>
  )
}

export default FlashcardTrainer
