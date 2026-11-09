import { useState } from 'react'
import { Plus, Award, MessageSquareQuote } from 'lucide-react'
import catalogueCours from '../data/catalogueCours.json'
import EvaluationModal from './releve/EvaluationModal'
import EctsPanel from './releve/EctsPanel'
import { matchesSearch } from '../utils/searchFilter'
import { getUeStyle } from '../utils/ueColors'
import { nouvelleEvaluation, moyenne, surVingt, formatMoyenne, niveau } from '../utils/releve'

const EVAL_FIELDS = { titre: 'intitule', ue: 'ue', contenu: 'observation', date: 'date' }

const formatDate = (iso) =>
  iso ? new Date(`${iso}T00:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

// Espace "Notes & Observations" : relevé de notes saisi par l'étudiant, regroupé par UE, avec
// moyennes pondérées (sur 20) et une observation / appréciation par note. Onglet ECTS : suivi de
// l'objectif annuel (UE validées à ≥ 10/20) + ECTS d'activités à part (voir utils/ects.js). Aucune IA.
function ReleveView({ search, filterType, filterValue, evaluations, onEvaluationsChange, ectsItems, onEctsChange }) {
  const [enEdition, setEnEdition] = useState(null) // { evaluation, estNouvelle }
  const [onglet, setOnglet] = useState('notes')
  // UE suivies en ECTS : catalogue (hors Bootcamp) + UE ajoutées à la main (onglet ECTS) + UE du relevé.
  const uesManuelles = ectsItems.filter((i) => i.kind === 'ue').map((i) => i.ue)
  const uesEcts = Array.from(
    new Set([
      ...catalogueCours.map((c) => c.ue).filter((ue) => ue.startsWith('UE')),
      ...uesManuelles,
      ...evaluations.map((e) => e.ue).filter(Boolean),
    ])
  ).sort((a, b) => a.localeCompare(b, 'fr', { numeric: true }))

  const visibles = evaluations.filter((e) => matchesSearch(e, { search, filterType, filterValue }, EVAL_FIELDS))
  const parUe = new Map()
  for (const e of [...visibles].sort((a, b) => (b.date || '').localeCompare(a.date || ''))) {
    if (!parUe.has(e.ue)) parUe.set(e.ue, [])
    parUe.get(e.ue).push(e)
  }
  const ues = Array.from(parUe.keys()).sort((a, b) => a.localeCompare(b, 'fr', { numeric: true }))

  const moyenneGenerale = moyenne(visibles)
  const nbNotees = visibles.filter((e) => surVingt(e) !== null).length
  const moyennesUe = ues.map((ue) => ({ ue, m: moyenne(parUe.get(ue)) })).filter((x) => x.m !== null)
  const meilleure = moyennesUe.sort((a, b) => b.m - a.m)[0]

  function handleSave(evaluation) {
    const existe = evaluations.some((e) => e.id === evaluation.id)
    onEvaluationsChange(existe ? evaluations.map((e) => (e.id === evaluation.id ? evaluation : e)) : [...evaluations, evaluation])
    setEnEdition(null)
  }

  function handleDelete(id) {
    onEvaluationsChange(evaluations.filter((e) => e.id !== id))
    setEnEdition(null)
  }

  const onglets = (
    <div className="inline-flex gap-1 p-1 rounded-2xl bg-surface border border-line">
      {[
        { key: 'notes', label: '📊 Notes' },
        { key: 'ects', label: '🎓 ECTS' },
      ].map(({ key, label }) => (
        <button
          key={key}
          type="button"
          onClick={() => setOnglet(key)}
          className={`px-4 py-1.5 rounded-xl text-sm font-semibold transition-colors ${
            onglet === key ? 'bg-rose-300 text-on-accent' : 'text-muted hover:bg-rose-50 hover:text-rose-700'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )

  if (onglet === 'ects') {
    return (
      <div className="space-y-5">
        {onglets}
        <EctsPanel ues={uesEcts} items={ectsItems} evaluations={evaluations} onItemsChange={onEctsChange} />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {onglets}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-surface rounded-3xl border border-line shadow-cozy px-5 py-4">
          <p className="text-xs text-muted">Moyenne générale</p>
          <p className={`text-3xl font-heading font-bold leading-tight ${niveau(moyenneGenerale)}`}>
            {formatMoyenne(moyenneGenerale)}
            <span className="text-base text-muted font-semibold"> /20</span>
          </p>
          <p className="text-[11px] text-muted">pondérée par les coefficients</p>
        </div>
        <div className="bg-surface rounded-3xl border border-line shadow-cozy px-5 py-4">
          <p className="text-xs text-muted">Notes enregistrées</p>
          <p className="text-3xl font-heading font-bold leading-tight text-heading">{nbNotees}</p>
          <p className="text-[11px] text-muted">{visibles.length - nbNotees} épreuve(s) en attente de note</p>
        </div>
        <div className="bg-surface rounded-3xl border border-line shadow-cozy px-5 py-4 min-w-0">
          <p className="text-xs text-muted">Meilleure UE</p>
          <p className="text-lg font-heading font-bold leading-tight text-heading truncate">{meilleure?.ue ?? '—'}</p>
          {meilleure && <p className={`text-sm font-semibold ${niveau(meilleure.m)}`}>{formatMoyenne(meilleure.m)} /20</p>}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setEnEdition({ evaluation: nouvelleEvaluation(), estNouvelle: true })}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold bg-rose-300 text-on-accent hover:bg-rose-400 shadow-md transition-colors"
        >
          <Plus className="w-4 h-4" />
          Ajouter une note
        </button>
      </div>

      {ues.length === 0 ? (
        <div className="bg-surface rounded-3xl border border-dashed border-line p-10 flex flex-col items-center gap-2 text-center">
          <Award className="w-8 h-8 text-rose-300" />
          <p className="text-sm font-semibold text-heading">
            {evaluations.length === 0 ? 'Ton relevé de notes est encore vide' : 'Aucune note ne correspond'}
          </p>
          <p className="text-xs text-muted max-w-sm">
            {evaluations.length === 0
              ? 'Ajoute tes notes par UE avec leur coefficient et l’observation du prof : les moyennes se calculent toutes seules.'
              : 'Essaie un autre mot-clé ou réinitialise les filtres dans l’en-tête.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {ues.map((ue) => {
            const notes = parUe.get(ue)
            const m = moyenne(notes)
            const style = getUeStyle(ue)
            return (
              <section key={ue} className="bg-surface rounded-3xl border border-line shadow-cozy overflow-hidden">
                <header className="flex items-center gap-3 px-5 py-3 border-b border-line bg-rose-50/60">
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${style.dot}`} />
                  <h3 className="flex-1 min-w-0 font-semibold text-heading truncate">{ue}</h3>
                  <span className="text-xs text-muted shrink-0">{notes.length} note(s)</span>
                  <span className={`text-sm font-bold shrink-0 ${niveau(m)}`}>{formatMoyenne(m)} /20</span>
                </header>
                <ul className="divide-y divide-rose-50">
                  {notes.map((e) => {
                    const n20 = surVingt(e)
                    return (
                      <li key={e.id}>
                        <button
                          type="button"
                          onClick={() => setEnEdition({ evaluation: e, estNouvelle: false })}
                          className="w-full flex items-start gap-4 px-5 py-3 text-left hover:bg-rose-50/60 transition-colors"
                        >
                          <div className="w-16 shrink-0 text-right">
                            {e.note === '' ? (
                              <span className="text-xs text-muted">à venir</span>
                            ) : (
                              <>
                                <p className={`font-heading font-bold leading-tight ${niveau(n20)}`}>
                                  {e.note}
                                  <span className="text-xs text-muted font-semibold">/{e.sur}</span>
                                </p>
                                <p className="text-[10px] text-muted">{parseFloat(String(e.coefficient).replace(',', '.')) === 0 ? 'hors moyenne' : `coef. ${e.coefficient}`}</p>
                              </>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-heading truncate">{e.intitule || e.type}</p>
                            <p className="text-xs text-muted truncate">
                              {[e.intitule ? e.type : null, e.cours, e.date ? formatDate(e.date) : null].filter(Boolean).join(' · ') || 'Sans date'}
                            </p>
                            {e.observation && (
                              <p className="mt-1 flex items-start gap-1.5 text-xs text-body line-clamp-2">
                                <MessageSquareQuote className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-px" />
                                {e.observation}
                              </p>
                            )}
                          </div>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </section>
            )
          })}
        </div>
      )}

      <EvaluationModal
        open={Boolean(enEdition)}
        evaluation={enEdition?.evaluation ?? null}
        estNouvelle={enEdition?.estNouvelle ?? false}
        catalogue={catalogueCours}
        ues={uesEcts}
        onClose={() => setEnEdition(null)}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </div>
  )
}

export default ReleveView
