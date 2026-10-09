import { CalendarDays, Link2, Paperclip, Award, AlertCircle } from 'lucide-react'
import { getUeStyle } from '../../utils/ueColors'
import { TYPE_EMOJI, STATUT_LIVRABLE_BADGE, estEnRetard } from '../../utils/livrables'

function formatDate(iso) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

// Carte résumée d'un exercice / projet / livrable.
function LivrableCard({ livrable, todayISO, onClick }) {
  const ue = getUeStyle(livrable.ue || null)
  const enRetard = estEnRetard(livrable, todayISO)

  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full text-left bg-surface rounded-3xl border border-line shadow-cozy p-5 flex flex-col gap-3 hover:-translate-y-0.5 hover:border-rose-300 transition-all"
    >
      <div className="flex items-start gap-3">
        <span className="w-10 h-10 flex items-center justify-center rounded-2xl bg-rose-50 text-lg shrink-0" aria-hidden="true">
          {TYPE_EMOJI[livrable.type] ?? '📁'}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] uppercase tracking-wide font-semibold text-muted">{livrable.type}</p>
          <h3 className="font-semibold text-heading leading-snug line-clamp-2">{livrable.titre || 'Sans titre'}</h3>
        </div>
        <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold shrink-0 ${STATUT_LIVRABLE_BADGE[livrable.statut]}`}>
          {livrable.statut}
        </span>
      </div>

      {(livrable.ue || livrable.cours) && (
        <div className="flex flex-wrap gap-1.5">
          {livrable.ue && <span className={`text-[11px] px-2 py-0.5 rounded-full ${ue.badge}`}>{livrable.ue}</span>}
          {livrable.cours && <span className="text-[11px] px-2 py-0.5 rounded-full bg-surface-muted text-muted truncate max-w-full">{livrable.cours}</span>}
        </div>
      )}

      {livrable.description && <p className="text-sm text-muted line-clamp-2">{livrable.description}</p>}

      <div className="mt-auto flex items-center gap-3 text-xs text-muted pt-1">
        {livrable.dateRendu && (
          <span className={`inline-flex items-center gap-1 ${enRetard ? 'text-red-600 font-semibold' : ''}`}>
            {enRetard ? <AlertCircle className="w-3.5 h-3.5" /> : <CalendarDays className="w-3.5 h-3.5" />}
            {enRetard ? 'En retard · ' : 'Rendu '}
            {formatDate(livrable.dateRendu)}
          </span>
        )}
        {livrable.note && (
          <span className="inline-flex items-center gap-1 text-rose-700 font-semibold">
            <Award className="w-3.5 h-3.5" />
            {livrable.note}
          </span>
        )}
        <span className="ml-auto inline-flex items-center gap-2">
          {livrable.liens?.length > 0 && (
            <span className="inline-flex items-center gap-0.5" aria-label={`${livrable.liens.length} lien(s)`}>
              <Link2 className="w-3.5 h-3.5" />
              {livrable.liens.length}
            </span>
          )}
          {livrable.fichiers?.length > 0 && (
            <span className="inline-flex items-center gap-0.5" aria-label={`${livrable.fichiers.length} fichier(s)`}>
              <Paperclip className="w-3.5 h-3.5" />
              {livrable.fichiers.length}
            </span>
          )}
        </span>
      </div>
    </button>
  )
}

export default LivrableCard
