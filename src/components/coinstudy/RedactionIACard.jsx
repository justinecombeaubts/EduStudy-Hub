import { Sparkles } from 'lucide-react'

// Rendu 2 colonnes d'une fiche mise en forme par l'IA (Écriture magique, AUDIT.md J2 Tâche 7) :
// colonne gauche "Définitions" + tags, colonne droite sections thématiques avec émoji.
// `variant="apercu"` (orange, "à relire") = pas encore validé par l'utilisateur ;
// `variant="validee"` (rose, badge permanent) = déjà accepté et enregistré sur la fiche.
function RedactionIACard({ redaction, variant = 'validee' }) {
  const isApercu = variant === 'apercu'

  return (
    <div
      className={`rounded-2xl border p-4 space-y-3 ${
        isApercu ? 'border-orange-200 bg-orange-50/70' : 'border-line bg-rose-50/70'
      }`}
    >
      <div
        className={`inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-full font-medium ${
          isApercu ? 'bg-orange-100 text-orange-800' : 'bg-rose-100 text-rose-800'
        }`}
      >
        <Sparkles className="w-3 h-3" />
        {isApercu ? 'Généré par IA — à relire' : 'Reformulé automatiquement par IA — Écriture Magique'}
      </div>

      {(redaction.titre || redaction.sousTitre) && (
        <div>
          {redaction.titre && <h4 className="font-semibold text-heading leading-snug">{redaction.titre}</h4>}
          {redaction.sousTitre && <p className="text-xs text-rose-600 mt-0.5">{redaction.sousTitre}</p>}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] gap-4">
        <div className="space-y-3 min-w-0">
          {redaction.definitions.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-rose-800">📖 Définitions</p>
              <p className="text-[10px] text-muted mb-1.5">Termes techniques expliqués par l’IA — à vérifier</p>
              <ul className="space-y-1.5">
                {redaction.definitions.map((d, i) => (
                  <li key={i} className="text-xs leading-snug">
                    <span className="font-semibold text-heading">{d.terme}</span>
                    {d.definition && <span className="text-muted"> — {d.definition}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {redaction.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 sm:border-t sm:border-line sm:pt-3">
              {redaction.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] px-1.5 py-0.5 rounded-full bg-surface border border-line text-rose-600 font-medium"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3 min-w-0">
          {redaction.sections.map((s, i) => (
            <div key={i}>
              <p className="text-xs font-semibold text-rose-800 mb-1">
                {s.emoji} {s.titre}
              </p>
              {s.items.length > 0 && (
                <ul className="space-y-1 list-disc list-inside">
                  {s.items.map((item, j) => (
                    <li key={j} className="text-xs text-muted leading-snug">
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default RedactionIACard
