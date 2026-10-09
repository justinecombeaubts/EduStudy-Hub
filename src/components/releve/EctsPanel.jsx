import { useEffect, useState } from 'react'
import { Plus, GraduationCap, Sparkle, CheckCircle2, XCircle, Hourglass, Link2, Paperclip } from 'lucide-react'
import ActiviteEctsModal from './ActiviteEctsModal'
import { calculerEcts, formatEcts, nouvelleActivite, SEUIL_VALIDATION } from '../../utils/ects'
import { formatMoyenne, niveau } from '../../utils/releve'
import { getUeStyle } from '../../utils/ueColors'

const STATUT = {
  validee: { label: 'Validée', icon: CheckCircle2, style: 'text-green-600' },
  non_validee: { label: 'Non validée', icon: XCircle, style: 'text-red-600' },
  attente: { label: 'En attente de notes', icon: Hourglass, style: 'text-muted' },
}

const formatDate = (iso) =>
  iso ? new Date(`${iso}T00:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Sans date'

// Champ numérique validé à la sortie (pas une synchro BDD à chaque frappe).
function ChampEcts({ valeur, onCommit, label, className = '' }) {
  const [brouillon, setBrouillon] = useState(String(valeur))
  useEffect(() => setBrouillon(String(valeur)), [valeur])
  function commit() {
    const n = parseFloat(brouillon.replace(',', '.'))
    const propre = Number.isFinite(n) && n >= 0 ? n : 0
    setBrouillon(String(propre))
    if (propre !== valeur) onCommit(propre)
  }
  return (
    <input
      type="text"
      inputMode="decimal"
      aria-label={label}
      value={brouillon}
      onChange={(e) => setBrouillon(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
      className={`w-16 px-2 py-1 rounded-lg bg-app border border-line text-sm text-heading text-center focus:outline-none focus:ring-2 focus:ring-rose-300 ${className}`}
    />
  )
}

// Onglet ECTS de Notes & Observations : progression vers l'objectif (UE validées à ≥ 10/20),
// ECTS par UE saisis à la main, et ECTS d'activités ajoutés manuellement, comptés à part.
function EctsPanel({ ues, items, evaluations, onItemsChange }) {
  const [enEdition, setEnEdition] = useState(null) // { activite, estNouvelle }
  const [nouvelleUe, setNouvelleUe] = useState('')
  const calc = calculerEcts(ues, items, evaluations)
  const progression = Math.min((calc.acquisUe / calc.objectif) * 100, 100)
  const anneeValidee = calc.acquisUe >= calc.objectif

  function upsert(item) {
    onItemsChange(items.some((i) => i.id === item.id) ? items.map((i) => (i.id === item.id ? item : i)) : [...items, item])
  }

  function handleAjouterUe(e) {
    e.preventDefault()
    const ue = nouvelleUe.trim()
    if (!ue || ues.includes(ue)) return
    upsert({ id: `ue:${ue}`, kind: 'ue', ue, ects: 0 })
    setNouvelleUe('')
  }

  function handleSaveActivite(activite) {
    upsert(activite)
    setEnEdition(null)
  }

  function handleDeleteActivite(id) {
    onItemsChange(items.filter((i) => i.id !== id))
    setEnEdition(null)
  }

  return (
    <div className="space-y-5">
      {/* Progression vers l'objectif (UE uniquement) */}
      <section className="bg-surface rounded-3xl border border-line shadow-cozy p-5 space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="flex items-center gap-1.5 text-xs text-muted">
              <GraduationCap className="w-3.5 h-3.5" />
              ECTS des compétences (UE validées à {SEUIL_VALIDATION}/20 ou plus)
            </p>
            <p className="font-heading font-bold text-heading leading-tight">
              <span className={`text-4xl ${anneeValidee ? 'text-green-600' : ''}`}>{formatEcts(calc.acquisUe)}</span>
              <span className="text-lg text-muted"> / {formatEcts(calc.objectif)} ECTS</span>
            </p>
          </div>
          <label className="flex items-center gap-2 text-xs text-muted">
            Objectif de l'année
            <ChampEcts
              valeur={calc.objectif}
              label="Objectif d'ECTS de l'année"
              onCommit={(n) => upsert({ id: 'config', kind: 'config', objectif: n || 52 })}
            />
          </label>
        </div>

        <div className="h-3 rounded-full bg-surface-muted overflow-hidden" role="progressbar" aria-valuenow={calc.acquisUe} aria-valuemin={0} aria-valuemax={calc.objectif}>
          <div className={`h-full rounded-full transition-all ${anneeValidee ? 'bg-green-600' : 'bg-rose-300'}`} style={{ width: `${progression}%` }} />
        </div>

        <p className="text-sm text-body">
          {anneeValidee
            ? '🎉 Objectif atteint : ton année est validée côté compétences !'
            : `Il te manque ${formatEcts(calc.restant)} ECTS pour valider ton année.`}
        </p>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
          <span>⏳ {formatEcts(calc.enAttente)} ECTS en attente de notes</span>
          <span>✖ {formatEcts(calc.perdus)} ECTS sur des UE sous {SEUIL_VALIDATION}/20</span>
          <span>Σ {formatEcts(calc.totalUeConfigure)} ECTS renseignés sur les UE</span>
        </div>
        {calc.totalUeConfigure < calc.objectif && (
          <p className="text-xs text-orange-700">
            Les ECTS renseignés sur tes UE ({formatEcts(calc.totalUeConfigure)}) n'atteignent pas l'objectif : complète les valeurs ci-dessous à partir de ta maquette.
          </p>
        )}
      </section>

      {/* ECTS par UE */}
      <section className="bg-surface rounded-3xl border border-line shadow-cozy overflow-hidden">
        <header className="px-5 py-3 border-b border-line bg-rose-50/60">
          <h3 className="font-semibold text-heading">ECTS par UE</h3>
          <p className="text-xs text-muted">Saisis le nombre d'ECTS de chaque UE ; ils sont acquis dès que la moyenne de l'UE atteint {SEUIL_VALIDATION}/20.</p>
        </header>
        <ul className="divide-y divide-rose-50">
          {calc.lignes.map((l) => {
            const s = STATUT[l.statut]
            const Icone = s.icon
            return (
              <li key={l.ue} className="flex items-center gap-3 px-5 py-2.5">
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${getUeStyle(l.ue).dot}`} />
                <span className="flex-1 min-w-0 text-sm font-semibold text-heading truncate">{l.ue}</span>
                <span className={`hidden sm:inline text-sm font-semibold w-16 text-right ${niveau(l.moyenne)}`}>{formatMoyenne(l.moyenne)}</span>
                <span className={`hidden md:inline-flex items-center gap-1 text-xs w-40 ${s.style}`}>
                  <Icone className="w-3.5 h-3.5" />
                  {s.label}
                </span>
                <Icone className={`md:hidden w-4 h-4 shrink-0 ${s.style}`} aria-label={s.label} />
                <ChampEcts
                  valeur={l.ects}
                  label={`ECTS de ${l.ue}`}
                  onCommit={(n) => upsert({ id: `ue:${l.ue}`, kind: 'ue', ue: l.ue, ects: n })}
                />
                <span className="text-xs text-muted w-10">ECTS</span>
              </li>
            )
          })}
        </ul>
        <form onSubmit={handleAjouterUe} className="flex items-center gap-2 px-5 py-3 border-t border-line">
          <input
            type="text"
            value={nouvelleUe}
            onChange={(e) => setNouvelleUe(e.target.value)}
            placeholder="UE manquante ? Ex. UE3 - COMMUNICATION"
            aria-label="Nom de l'UE à ajouter"
            className="flex-1 min-w-0 px-3 py-1.5 rounded-xl bg-app border border-line text-sm text-heading placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-rose-300"
          />
          <button
            type="submit"
            disabled={!nouvelleUe.trim() || ues.includes(nouvelleUe.trim())}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Plus className="w-4 h-4" />
            Ajouter l'UE
          </button>
        </form>
      </section>

      {/* ECTS d'activités : comptés à part */}
      <section className="bg-surface rounded-3xl border border-line shadow-cozy overflow-hidden">
        <header className="flex flex-wrap items-center gap-3 px-5 py-3 border-b border-line bg-peach-50">
          <div className="flex-1 min-w-0">
            <h3 className="flex items-center gap-1.5 font-semibold text-heading">
              <Sparkle className="w-4 h-4 text-orange-400" />
              ECTS d'activités
              <span className="ml-1 px-2 py-0.5 rounded-full bg-peach-100 text-orange-800 text-xs font-bold">
                {formatEcts(calc.ectsActivites)} ECTS
              </span>
            </h3>
            <p className="text-xs text-muted">Activités proposées par l'école, ajoutées à la main — comptées à part de l'objectif des compétences.</p>
          </div>
          <button
            type="button"
            onClick={() => setEnEdition({ activite: nouvelleActivite(), estNouvelle: true })}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold bg-peach-100 text-orange-800 hover:bg-peach-200 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Ajouter des ECTS
          </button>
        </header>

        {calc.activites.length === 0 ? (
          <p className="px-5 py-6 text-sm text-muted text-center">Aucune activité pour l'instant.</p>
        ) : (
          <ul className="divide-y divide-rose-50">
            {calc.activites.map((a) => (
              <li key={a.id}>
                <button
                  type="button"
                  onClick={() => setEnEdition({ activite: a, estNouvelle: false })}
                  className="w-full flex items-start gap-4 px-5 py-3 text-left hover:bg-rose-50/60 transition-colors"
                >
                  <span className="w-14 shrink-0 text-right font-heading font-bold text-orange-700">+{formatEcts(parseFloat(a.ects))}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-heading truncate">{a.titre}</p>
                    <p className="text-xs text-muted">{formatDate(a.date)}</p>
                    <p className="mt-1 text-xs text-body line-clamp-2">{a.justification}</p>
                  </div>
                  <span className="flex items-center gap-2 text-xs text-muted shrink-0">
                    {a.liens?.length > 0 && (
                      <span className="inline-flex items-center gap-0.5">
                        <Link2 className="w-3.5 h-3.5" />
                        {a.liens.length}
                      </span>
                    )}
                    {a.fichiers?.length > 0 && (
                      <span className="inline-flex items-center gap-0.5">
                        <Paperclip className="w-3.5 h-3.5" />
                        {a.fichiers.length}
                      </span>
                    )}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ActiviteEctsModal
        open={Boolean(enEdition)}
        activite={enEdition?.activite ?? null}
        estNouvelle={enEdition?.estNouvelle ?? false}
        onClose={() => setEnEdition(null)}
        onSave={handleSaveActivite}
        onDelete={handleDeleteActivite}
      />
    </div>
  )
}

export default EctsPanel
