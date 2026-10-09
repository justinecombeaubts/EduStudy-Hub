import { moyenne } from './releve'

// Suivi ECTS (principe européen) : 1 cours = 1 ECTS par défaut ; une UE est validée — et rapporte
// TOUS ses ECTS — si sa moyenne pondérée est ≥ 10/20 (compensation : un cours sous 10 peut être
// rattrapé par les autres cours de l'UE). Deux objectifs :
// - compétences : OBJECTIF ECTS issus des UE uniquement (52 par défaut) ;
// - diplôme : OBJECTIF TOTAL = UE + ECTS d'activités ajoutés à la main (60 par défaut).
// Les ECTS d'activités (proposées par l'école, avec justification) restent affichés à part.
//
// Store "ects" (un seul tableau, champ `kind`) :
// - { id: 'config', kind: 'config', objectif, objectifTotal }
// - { id: 'ue:<UE>', kind: 'ue', ue, ects }                 ECTS d'une UE modifiés à la main (sinon défaut)
// - { id: 'act-…', kind: 'activite', titre, date, ects, justification, liens, fichiers }
export const OBJECTIF_DEFAUT = 52
export const OBJECTIF_TOTAL_DEFAUT = 60
export const SEUIL_VALIDATION = 10

const nombre = (v) => {
  const n = parseFloat(String(v ?? '').replace(',', '.'))
  return Number.isFinite(n) ? n : 0
}

export const formatEcts = (n) => String(Math.round(n * 10) / 10).replace('.', ',')

export function nouvelleActivite() {
  return { id: `act-${Date.now()}`, kind: 'activite', titre: '', date: '', ects: '', justification: '', liens: [], fichiers: [] }
}

// 1 cours = 1 ECTS : ECTS par défaut d'une UE = nombre de cours du catalogue rattachés à l'UE.
// "UE0 - HORS UE" (conférence, onboarding, partiels) ne rapporte rien par défaut.
export function ectsParDefaut(catalogue) {
  const parUe = {}
  for (const c of catalogue) {
    if (!c.ue.startsWith('UE') || c.ue.startsWith('UE0')) continue
    parUe[c.ue] = (parUe[c.ue] ?? 0) + 1
  }
  return parUe
}

// `ues` = liste des UE connues (catalogue + UE ajoutées + UE du relevé) ; `defauts` = ectsParDefaut().
export function calculerEcts(ues, items, evaluations, defauts = {}) {
  const config = items.find((i) => i.kind === 'config')
  const objectif = nombre(config?.objectif) || OBJECTIF_DEFAUT
  const objectifTotal = nombre(config?.objectifTotal) || OBJECTIF_TOTAL_DEFAUT
  const ectsParUe = Object.fromEntries(items.filter((i) => i.kind === 'ue').map((i) => [i.ue, nombre(i.ects)]))

  const lignes = ues.map((ue) => {
    const m = moyenne(evaluations.filter((e) => e.ue === ue))
    const ects = ectsParUe[ue] ?? defauts[ue] ?? 0
    const statut = m === null ? 'attente' : m >= SEUIL_VALIDATION ? 'validee' : 'non_validee'
    return { ue, ects, parDefaut: !(ue in ectsParUe), moyenne: m, statut, acquis: statut === 'validee' ? ects : 0 }
  })

  const activites = items
    .filter((i) => i.kind === 'activite')
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''))

  const acquisUe = lignes.reduce((t, l) => t + l.acquis, 0)
  const ectsActivites = activites.reduce((t, a) => t + nombre(a.ects), 0)
  return {
    objectif,
    objectifTotal,
    total: acquisUe + ectsActivites,
    restantTotal: Math.max(objectifTotal - acquisUe - ectsActivites, 0),
    lignes,
    activites,
    acquisUe,
    enAttente: lignes.filter((l) => l.statut === 'attente').reduce((t, l) => t + l.ects, 0),
    perdus: lignes.filter((l) => l.statut === 'non_validee').reduce((t, l) => t + l.ects, 0),
    totalUeConfigure: lignes.reduce((t, l) => t + l.ects, 0),
    ectsActivites,
    restant: Math.max(objectif - acquisUe, 0),
  }
}
