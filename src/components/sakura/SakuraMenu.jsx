import { Layers, ListChecks, MessageCircle, BookOpen } from 'lucide-react'

// Menu d'accueil de Professeur Sakura (AUDIT.md J3 Tâche 12) : les 3 usages proposés + accès rapide
// aux decks/QCM déjà enregistrés (lecture seule, voir SakuraMesDecks/SakuraMesQcm).
function SakuraMenu({ onChoisir, flashcardsCount, qcmCount, onOuvrirMesDecks, onOuvrirMesQcm }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        🌸 Bonjour, je suis <span className="font-semibold">Professeur Sakura</span> ! Comment puis-je t'aider
        aujourd'hui ?
      </p>

      <div className="space-y-2">
        <button
          type="button"
          onClick={() => onChoisir('flashcards')}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl border border-line hover:bg-rose-50 transition-colors text-left"
        >
          <Layers className="w-5 h-5 text-rose-400 shrink-0" />
          <span className="text-sm font-medium text-heading">Je veux créer des flashcards</span>
        </button>

        <button
          type="button"
          onClick={() => onChoisir('qcm')}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl border border-line hover:bg-rose-50 transition-colors text-left"
        >
          <ListChecks className="w-5 h-5 text-rose-400 shrink-0" />
          <span className="text-sm font-medium text-heading">Je veux créer un QCM</span>
        </button>

        <button
          type="button"
          onClick={() => onChoisir('chat')}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl border border-line hover:bg-rose-50 transition-colors text-left"
        >
          <MessageCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span className="text-sm font-medium text-heading">Je veux juste discuter</span>
        </button>
      </div>

      <div className="flex items-center gap-3 pt-1 border-t border-line text-xs">
        <button type="button" onClick={onOuvrirMesDecks} className="flex items-center gap-1 text-rose-500 hover:underline pt-3">
          <BookOpen className="w-3.5 h-3.5" />
          Mes decks ({flashcardsCount})
        </button>
        <button type="button" onClick={onOuvrirMesQcm} className="flex items-center gap-1 text-rose-500 hover:underline pt-3">
          <ListChecks className="w-3.5 h-3.5" />
          Mes QCM ({qcmCount})
        </button>
      </div>
    </div>
  )
}

export default SakuraMenu
