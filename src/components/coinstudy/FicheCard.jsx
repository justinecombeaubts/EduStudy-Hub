import { Check, Sparkles, Link2, Paperclip } from 'lucide-react'
import { getUeStyle } from '../../utils/ueColors'
import { compterPiecesJointes } from '../../utils/piecesJointes'

const STATUT_BADGE = {
  'Rédigée': 'bg-rose-100 text-rose-800',
  'À repasser': 'bg-peach-100 text-orange-800',
  'Brouillon': 'bg-surface-muted text-muted',
}

// Les fiches créées depuis l'Agenda mais liées à un créneau récurrent (ex. Entreprise) n'ont pas de date.
function formatDate(iso) {
  if (!iso) return 'Sans date'
  const d = new Date(iso)
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

// Carte résumée d'une fiche de cours : titre, UE, statut, date, résumé sur 2 lignes.
// En mode sélection (Coin Study), le clic bascule la sélection au lieu d'ouvrir la fiche.
function FicheCard({ fiche, onClick, selectionMode = false, selected = false, onToggleSelect }) {
  const ue = getUeStyle(fiche.ue)
  const { nbLiens, nbFichiers } = compterPiecesJointes(fiche)

  function handleClick() {
    if (selectionMode) onToggleSelect(fiche.id)
    else onClick()
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`text-left bg-surface border rounded-2xl shadow-sm shadow-rose-100/50 p-4 flex flex-col gap-2 hover:shadow-md hover:shadow-rose-100/60 hover:-translate-y-0.5 transition-all ${
        selected ? 'border-rose-400 ring-2 ring-rose-300' : 'border-line'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {selectionMode && (
            <span
              className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                selected ? 'bg-rose-400 border-rose-400 text-white' : 'border-rose-300'
              }`}
            >
              {selected && <Check className="w-3 h-3" strokeWidth={3} />}
            </span>
          )}
          <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium truncate ${ue.badge}`}>{fiche.ue}</span>
        </div>
        <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium shrink-0 ${STATUT_BADGE[fiche.statut]}`}>
          {fiche.statut}
        </span>
      </div>

      <h3 className="flex items-center gap-1.5 font-semibold text-heading leading-snug">
        {fiche.titre}
        {fiche.redactionIA && (
          <Sparkles className="w-3.5 h-3.5 text-orange-400 shrink-0" aria-label="Mise en forme par IA" />
        )}
      </h3>
      <p className="text-xs text-muted line-clamp-2">{fiche.contenu}</p>

      <div className="flex items-center gap-2 mt-auto pt-1">
        <p className="text-[11px] text-muted">{formatDate(fiche.date)}</p>
        {nbLiens > 0 && <Link2 className="w-3 h-3 text-muted" aria-label={`${nbLiens} lien(s)`} />}
        {nbFichiers > 0 && <Paperclip className="w-3 h-3 text-muted" aria-label={`${nbFichiers} fichier(s) joint(s)`} />}
      </div>
    </button>
  )
}

export default FicheCard
