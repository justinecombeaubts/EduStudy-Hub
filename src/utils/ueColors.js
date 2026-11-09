// Association déterministe UE → couleur pastel (dot + badge), pour les mini-badges des vues Mois/Année.
const UE_PALETTE = [
  { dot: 'bg-rose-300', badge: 'bg-rose-100 text-rose-800' },
  { dot: 'bg-peach-400', badge: 'bg-peach-100 text-orange-800' },
  { dot: 'bg-amber-300', badge: 'bg-amber-100 text-amber-800' },
  { dot: 'bg-fuchsia-300', badge: 'bg-fuchsia-100 text-fuchsia-800' },
  { dot: 'bg-orange-300', badge: 'bg-orange-100 text-orange-800' },
]

// "Entreprise" a sa propre teinte pêche distincte, cohérente avec courseStatus.js — pas de hash pour elle.
const ENTREPRISE_STYLE = { dot: 'bg-peach-400', badge: 'bg-peach-200 text-orange-900' }

function hashString(str) {
  let hash = 0
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0
  }
  return hash
}

// Événements libres créés par l'étudiant (voir usePlanning.js) : bleu ciel, distinct des cours.
const EVENEMENT_STYLE = { dot: 'bg-sky-300', badge: 'bg-sky-100 text-sky-800' }

// Créneau vide (pas encore de cours choisi) : contour pointillé neutre.
const LIBRE_STYLE = { dot: 'border border-dashed border-rose-300', badge: 'border border-dashed border-rose-300 text-muted' }

export function getUeStyle(ue) {
  if (!ue) return LIBRE_STYLE
  if (ue === 'Entreprise') return ENTREPRISE_STYLE
  if (ue === 'Événement') return EVENEMENT_STYLE
  const idx = hashString(ue) % UE_PALETTE.length
  return UE_PALETTE[idx]
}
