const JOURS_SEMAINE = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']
const MOIS = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
]

// Variantes textuelles d'une date ISO ("YYYY-MM-DD") pour permettre une recherche par date sans
// connaître le format exact attendu (ex. "12/03", "mars", "12 mars 2026", "jeudi").
function formatDateVariants(iso) {
  if (!iso) return ''
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return ''
  const date = new Date(y, m - 1, d)
  return [
    iso,
    `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`,
    `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}`,
    `${d} ${MOIS[m - 1]} ${y}`,
    `${d} ${MOIS[m - 1]}`,
    JOURS_SEMAINE[date.getDay()],
  ]
    .join(' ')
    .toLowerCase()
}

// Filtrage générique partagé par la recherche globale du Header (Agenda + Coin Study).
// `fields` fait correspondre les clés logiques (titre/ue/theme/contenu/date) aux clés réelles de
// l'objet filtré ; `theme`/`contenu`/`date` sont optionnels (ex. mockCourses.json n'a pas de thème).
export function matchesSearch(item, { search, filterType, filterValue }, fields) {
  const { titre, ue, theme, contenu, date } = fields

  if (filterType === 'UE') {
    if (filterValue && item[ue] !== filterValue) return false
  } else if (filterType === 'Thème') {
    if (!theme) return false // jeu de données sans notion de thème (ex. Agenda)
    if (filterValue && item[theme] !== filterValue) return false
  }

  const term = (search ?? '').trim().toLowerCase()
  if (!term) return true

  if (filterType === 'Cours') {
    return (item[titre] ?? '').toLowerCase().includes(term)
  }

  const texte = [
    item[titre],
    item[ue],
    theme ? item[theme] : '',
    contenu ? item[contenu] : '',
    date ? formatDateVariants(item[date]) : '',
  ]
    .join(' ')
    .toLowerCase()
  return texte.includes(term)
}
