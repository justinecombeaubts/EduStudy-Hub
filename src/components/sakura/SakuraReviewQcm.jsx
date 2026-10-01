import { Sparkles } from 'lucide-react'

// Relecture du QCM généré par l'IA avant sauvegarde (AUDIT.md J3 Tâche 14) — jamais appliqué
// automatiquement (Charte IA §4) : accept/reject du jeu de questions entier (pas d'édition question
// par question aujourd'hui, cf. plan). "Enregistrer" persiste dans le store `edustudy-hub:qcm`.
function SakuraReviewQcm({ questions, onEnregistrer, onRegenerer, onAnnuler }) {
  return (
    <div className="space-y-3">
      <div className="inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-full font-medium bg-orange-100 text-orange-800">
        <Sparkles className="w-3 h-3" />
        Généré par IA — à relire
      </div>

      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
        {questions.map((q, i) => (
          <div key={q.id} className="rounded-2xl border border-orange-200 bg-orange-50/70 p-3 space-y-1.5">
            <p className="text-sm font-medium text-heading">
              {i + 1}. {q.enonce}
            </p>
            <ul className="space-y-1">
              {q.options.map((option, idx) => (
                <li
                  key={idx}
                  className={`text-xs px-2 py-1 rounded-lg ${
                    idx === q.bonneReponseIndex
                      ? 'bg-rose-100 text-muted font-medium'
                      : 'text-muted'
                  }`}
                >
                  {idx === q.bonneReponseIndex ? '✓ ' : ''}
                  {option}
                </li>
              ))}
            </ul>
            {q.explication && <p className="text-[11px] text-muted italic">{q.explication}</p>}
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onAnnuler}
          className="px-4 py-2 rounded-xl text-sm font-medium text-muted hover:bg-rose-50 transition-colors"
        >
          Annuler
        </button>
        {onRegenerer && (
          <button
            type="button"
            onClick={onRegenerer}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-peach-100 text-orange-700 hover:bg-peach-200 transition-colors"
          >
            Régénérer
          </button>
        )}
        <button
          type="button"
          onClick={onEnregistrer}
          className="px-4 py-2 rounded-full text-sm font-medium bg-rose-300 text-on-accent hover:bg-rose-400 shadow-md transition-colors"
        >
          Enregistrer
        </button>
      </div>
    </div>
  )
}

export default SakuraReviewQcm
