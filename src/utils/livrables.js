// Espace "Exercices & Livrables" : rangement des exercices réalisés et des projets rendus.
// Données saisies uniquement par l'étudiant (aucune intervention IA dans cet espace).
export const TYPES_LIVRABLE = ['Exercice', 'Projet', 'Livrable']
export const STATUTS_LIVRABLE = ['À faire', 'En cours', 'Rendu', 'Corrigé']

export const TYPE_EMOJI = { Exercice: '✏️', Projet: '🚀', Livrable: '📦' }

export const STATUT_LIVRABLE_BADGE = {
  'À faire': 'bg-surface-muted text-muted',
  'En cours': 'bg-peach-100 text-orange-800',
  Rendu: 'bg-rose-100 text-rose-800',
  Corrigé: 'bg-green-100 text-green-800',
}

export const estTermine = (l) => l.statut === 'Rendu' || l.statut === 'Corrigé'

export function estEnRetard(livrable, todayISO) {
  return Boolean(livrable.dateRendu) && livrable.dateRendu < todayISO && !estTermine(livrable)
}

export function nouveauLivrable() {
  return {
    id: `livrable-${Date.now()}`,
    titre: '',
    type: 'Exercice',
    ue: '',
    cours: '',
    dateRendu: '',
    statut: 'À faire',
    note: '',
    description: '',
    liens: [],
    fichiers: [],
  }
}
