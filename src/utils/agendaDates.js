// Utilitaires de dates pour les vues Jour/Semaine/Mois/Année de l'Agenda.
// Modèle hybride : un cours porte soit une `date` réelle (ex. session ponctuelle du programme B3),
// soit un `jour` récurrent sans date (ex. "Entreprise" — identique chaque semaine toute l'année).

export const JOURS_SEMAINE = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
export const JOURS_OUVRES = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi']
export const MOIS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

export function getJourLabel(date) {
  return JOURS_SEMAINE[date.getDay()]
}

export function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

// Date -> "YYYY-MM-DD" en heure locale (ne pas utiliser toISOString(), qui bascule en UTC et peut décaler le jour).
export function toISODate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// "YYYY-MM-DD" -> Date locale (évite le décalage UTC de `new Date("YYYY-MM-DD")`).
export function fromISODate(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function formatDateLong(date) {
  return `${JOURS_SEMAINE[date.getDay()]} ${date.getDate()} ${MOIS[date.getMonth()].toLowerCase()} ${date.getFullYear()}`
}

export function addDays(date, n) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

export function addMonths(date, n) {
  const d = new Date(date)
  d.setMonth(d.getMonth() + n)
  return d
}

export function addYears(date, n) {
  const d = new Date(date)
  d.setFullYear(d.getFullYear() + n)
  return d
}

// Lundi de la semaine contenant `date`.
export function startOfWeek(date) {
  const d = new Date(date)
  const day = d.getDay() // 0 = dimanche
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

// 7 dates (Lundi → Dimanche) de la semaine contenant `date`.
export function getWeekDates(date) {
  const monday = startOfWeek(date)
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i))
}

// Grille complète du mois (semaines entières, Lundi → Dimanche) contenant `date`.
export function getMonthGrid(date) {
  const firstOfMonth = new Date(date.getFullYear(), date.getMonth(), 1)
  const lastOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0)
  const start = startOfWeek(firstOfMonth)
  const end = addDays(startOfWeek(lastOfMonth), 6)
  const days = []
  let cur = start
  while (cur <= end) {
    days.push(cur)
    cur = addDays(cur, 1)
  }
  return days
}

// Un cours récurrent (sans `date`) s'applique-t-il à cette date ISO ? (bornes `startDate`/`endDate`
// incluses si présentes, et hors dates listées dans `excludeDates`.)
function recurringAppliesOn(course, iso) {
  if (course.startDate && iso < course.startDate) return false
  if (course.endDate && iso > course.endDate) return false
  return !(course.excludeDates ?? []).includes(iso)
}

// Cours rattachés à une date donnée : correspondance exacte sur `date` si présente,
// sinon récurrence hebdomadaire via `jour` (ex. Entreprise), bornée par `startDate`/`endDate`
// et exceptée sur `excludeDates` (ex. la semaine finale 5 jours école).
export function getCoursesForDate(date, courses) {
  const iso = toISODate(date)
  const jour = getJourLabel(date)
  return courses.filter((c) => {
    if (c.date) return c.date === iso
    return c.jour === jour && recurringAppliesOn(c, iso)
  })
}

// Tous les créneaux (datés ou récurrents) de la semaine (Lundi → Vendredi) contenant `referenceDate`.
export function getCoursesInWeek(referenceDate, courses) {
  return getWeekDates(referenceDate)
    .slice(0, 5)
    .flatMap((d) => getCoursesForDate(d, courses))
}

// Charge de travail estimée d'un mois : cours datés tombant dans le mois + occurrences des cours récurrents
// dans les bornes `startDate`/`endDate` (moins les dates exclues du mois, ex. semaine finale 5 jours école).
export function getMonthLoad(date, courses) {
  const year = date.getFullYear()
  const month = date.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  return courses.reduce((total, c) => {
    if (c.date) {
      const d = fromISODate(c.date)
      return d.getFullYear() === year && d.getMonth() === month ? total + 1 : total
    }
    const targetIndex = JOURS_SEMAINE.indexOf(c.jour)
    let occurrences = 0
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month, day)
      if (d.getDay() === targetIndex && recurringAppliesOn(c, toISODate(d))) occurrences += 1
    }
    return total + occurrences
  }, 0)
}
