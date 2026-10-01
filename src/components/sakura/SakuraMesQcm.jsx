import { Sparkles, ListChecks, ChevronRight } from 'lucide-react'
import { getUeStyle } from '../../utils/ueColors'

// Liste des QCM déjà enregistrés (AUDIT.md J3 Tâche 14-bis) : clic sur un QCM → ouvre le mode
// "passer le QCM" (QcmTrainer.jsx).
function SakuraMesQcm({ qcm, onSelectQcm }) {
  if (qcm.length === 0) {
    return <p className="text-xs text-muted">Aucun QCM enregistré pour l'instant — génère ton premier QCM !</p>
  }

  return (
    <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
      {qcm.map((q) => {
        const style = getUeStyle(q.ue)
        return (
          <button
            key={q.id}
            type="button"
            onClick={() => onSelectQcm(q)}
            disabled={q.questions.length === 0}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl border border-line text-left hover:bg-rose-50 hover:border-line disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-colors"
          >
            <ListChecks className="w-4 h-4 text-rose-300 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm text-heading truncate flex items-center gap-1.5">
                {q.titre}
                {q.generatedByAI && <Sparkles className="w-3 h-3 text-orange-400 shrink-0" aria-label="Généré par IA" />}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                {q.ue && <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${style.badge}`}>{q.ue}</span>}
                <span className="text-[11px] text-muted">
                  {q.questions.length} question(s){q.dureeLimiteMinutes ? ` · ${q.dureeLimiteMinutes} min` : ''}
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-rose-300 shrink-0" />
          </button>
        )
      })}
    </div>
  )
}

export default SakuraMesQcm
