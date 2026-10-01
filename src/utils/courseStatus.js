// Statut visuel d'un cours dérivé de sa date réelle (plus de champ `statut` statique dans les données) :
// Entreprise (récurrent, hors campus), Terminé (passé), Aujourd'hui, ou À venir.
export function getCourseStatus(course, todayISO) {
  if (course.ue === 'Entreprise') return 'entreprise'
  if (!course.date) return 'a_venir' // filet de sécurité si un cours récurrent est ajouté sans date
  if (course.date < todayISO) return 'passe'
  if (course.date === todayISO) return 'aujourdhui'
  return 'a_venir'
}

export const STATUS_LABEL = {
  entreprise: 'Entreprise',
  passe: 'Terminé',
  aujourdhui: "Aujourd'hui",
  a_venir: 'À venir',
}

// Styles pastel cohérents avec la DA Cozy — l'Entreprise a une teinte pêche distincte du rose des cours.
export const STATUS_STYLES = {
  entreprise: 'bg-peach-200 border-peach-400 text-orange-900',
  passe: 'bg-stone-100 border-stone-200 text-stone-500',
  aujourdhui: 'bg-rose-300 border-rose-400 text-rose-950',
  a_venir: 'bg-rose-50 border-rose-200 text-rose-800',
}

export const STATUS_BADGE = STATUS_STYLES // même palette pour les badges texte (DayView)
