// Relevé de notes : évaluations saisies par l'étudiant (aucune IA), moyennes pondérées.
// Une évaluation = { id, ue, cours, intitule, note, sur, coefficient, date, observation }.
// Toutes les moyennes sont ramenées sur 20, pondérées par le coefficient.

export const TYPES_EPREUVE = ['Partiel', 'Contrôle continu', 'TP', 'Projet', 'Oral', 'Soutenance', 'Autre']

export function nouvelleEvaluation() {
  return {
    id: `eval-${Date.now()}`,
    ue: '',
    cours: '',
    type: 'Contrôle continu',
    intitule: '',
    note: '',
    sur: '20',
    coefficient: '1',
    date: '',
    observation: '',
  }
}

const nombre = (v) => {
  const n = parseFloat(String(v).replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

// Note ramenée sur 20, ou null si incomplète (évaluation pas encore notée).
export function surVingt(e) {
  const note = nombre(e.note)
  const sur = nombre(e.sur)
  if (note === null || !sur) return null
  return (note / sur) * 20
}

export function moyenne(evaluations) {
  let total = 0
  let poids = 0
  for (const e of evaluations) {
    const n = surVingt(e)
    const coef = nombre(e.coefficient) ?? 1
    if (n === null || coef <= 0) continue
    total += n * coef
    poids += coef
  }
  return poids > 0 ? total / poids : null
}

export const formatMoyenne = (m) => (m === null ? '—' : m.toFixed(2).replace('.', ','))

// Teinte selon le niveau (seuils classiques 10 / 14).
export function niveau(m) {
  if (m === null) return 'text-muted'
  if (m >= 14) return 'text-green-600'
  if (m >= 10) return 'text-rose-700'
  return 'text-red-600'
}
