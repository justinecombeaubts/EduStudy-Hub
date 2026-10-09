import { moyenne } from './releve'

// Suivi ECTS (principe européen) : une UE est validée — et rapporte ses ECTS — si sa moyenne
// pondérée est ≥ 10/20. L'année est validée avec OBJECTIF ECTS issus des UE uniquement ; les ECTS
// d'activités ajoutés à la main (proposées par l'école, avec justification) sont comptés à part
// et n'entrent PAS dans l'objectif (choix de l'étudiant).
//
// Store "ects" (un seul tableau, champ `kind`) :
// - { id: 'config', kind: 'config', objectif }
// - { id: 'ue:<UE>', kind: 'ue', ue, ects }                 ECTS rapportés par une UE (saisis à la main)
// - { id: 'act-…', kind: 'activite', titre, date, ects, justification, liens, fichiers }
export const OBJECTIF_DEFAUT = 52
export const SEUIL_VALIDATION = 10

const nombre = (v) => {
  const n = parseFloat(String(v ?? '').replace(',', '.'))
  return Number.isFinite(n) ? n : 0
}

export const formatEcts = (n) => String(Math.round(n * 10) / 10).replace('.', ',')

export function nouvelleActivite() {
  return { id: `act-${Date.now()}`, kind: 'activite', titre: '', date: '', ects: '', justification: '', liens: [], fichiers: [] }
}

// `ues` = liste des UE connues (catalogue + UE présentes dans le relevé).
export function calculerEcts(ues, items, evaluations) {
  const config = items.find((i) => i.kind === 'config')
  const objectif = nombre(config?.objectif) || OBJECTIF_DEFAUT
  const ectsParUe = Object.fromEntries(items.filter((i) => i.kind === 'ue').map((i) => [i.ue, nombre(i.ects)]))

  const lignes = ues.map((ue) => {
    const m = moyenne(evaluations.filter((e) => e.ue === ue))
    const ects = ectsParUe[ue] ?? 0
    const statut = m === null ? 'attente' : m >= SEUIL_VALIDATION ? 'validee' : 'non_validee'
    return { ue, ects, moyenne: m, statut, acquis: statut === 'validee' ? ects : 0 }
  })

  const activites = items
    .filter((i) => i.kind === 'activite')
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''))

  const acquisUe = lignes.reduce((t, l) => t + l.acquis, 0)
  return {
    objectif,
    lignes,
    activites,
    acquisUe,
    enAttente: lignes.filter((l) => l.statut === 'attente').reduce((t, l) => t + l.ects, 0),
    perdus: lignes.filter((l) => l.statut === 'non_validee').reduce((t, l) => t + l.ects, 0),
    totalUeConfigure: lignes.reduce((t, l) => t + l.ects, 0),
    ectsActivites: activites.reduce((t, a) => t + nombre(a.ects), 0),
    restant: Math.max(objectif - acquisUe, 0),
  }
}
