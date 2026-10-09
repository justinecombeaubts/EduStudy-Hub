import { useState } from 'react'
import { Plus, FolderOpen } from 'lucide-react'
import catalogueCours from '../data/catalogueCours.json'
import LivrableCard from './livrables/LivrableCard'
import LivrableModal from './livrables/LivrableModal'
import { matchesSearch } from '../utils/searchFilter'
import { toISODate } from '../utils/agendaDates'
import { STATUTS_LIVRABLE, nouveauLivrable, estEnRetard, estTermine } from '../utils/livrables'

const ONGLETS = [
  { key: 'Tous', label: 'Tout' },
  { key: 'Exercice', label: '✏️ Exercices' },
  { key: 'Projet', label: '🚀 Projets' },
  { key: 'Livrable', label: '📦 Livrables' },
]
const LIVRABLE_FIELDS = { titre: 'titre', ue: 'ue', contenu: 'description', date: 'dateRendu' }

// Espace "Exercices & Livrables" : l'étudiant y range ses exercices réalisés et ses projets rendus
// (liens + fichiers multiples, note, statut). Recherche / filtre UE globaux du Header appliqués.
// Tri : à rendre d'abord (par échéance), puis terminés (plus récents d'abord).
function LivrablesView({ search, filterType, filterValue, livrables, onLivrablesChange }) {
  const [onglet, setOnglet] = useState('Tous')
  const [statutFiltre, setStatutFiltre] = useState(null)
  const [enEdition, setEnEdition] = useState(null) // { livrable, estNouveau }
  const todayISO = toISODate(new Date())

  const visibles = livrables
    .filter((l) => onglet === 'Tous' || l.type === onglet)
    .filter((l) => !statutFiltre || l.statut === statutFiltre)
    .filter((l) => matchesSearch(l, { search, filterType, filterValue }, LIVRABLE_FIELDS))
    .sort((a, b) => {
      if (estTermine(a) !== estTermine(b)) return estTermine(a) ? 1 : -1
      const da = a.dateRendu || '9999'
      const db = b.dateRendu || '9999'
      return estTermine(a) ? db.localeCompare(da) : da.localeCompare(db)
    })

  const nbARendre = livrables.filter((l) => !estTermine(l)).length
  const nbEnRetard = livrables.filter((l) => estEnRetard(l, todayISO)).length
  const nbTermines = livrables.length - nbARendre

  function handleSave(livrable) {
    const existe = livrables.some((l) => l.id === livrable.id)
    onLivrablesChange(existe ? livrables.map((l) => (l.id === livrable.id ? livrable : l)) : [...livrables, livrable])
    setEnEdition(null)
  }

  function handleDelete(id) {
    onLivrablesChange(livrables.filter((l) => l.id !== id))
    setEnEdition(null)
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'À rendre', valeur: nbARendre, emoji: '🗂️' },
          { label: 'En retard', valeur: nbEnRetard, emoji: '⏰' },
          { label: 'Rendus', valeur: nbTermines, emoji: '🌷' },
        ].map((stat) => (
          <div key={stat.label} className="bg-surface rounded-3xl border border-line shadow-cozy px-4 py-3 flex items-center gap-3">
            <span className="text-xl" aria-hidden="true">{stat.emoji}</span>
            <div>
              <p className="text-xl font-heading font-bold text-heading leading-none">{stat.valeur}</p>
              <p className="text-xs text-muted mt-1">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1 p-1 rounded-2xl bg-surface border border-line">
          {ONGLETS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setOnglet(key)}
              className={`px-3 py-1.5 rounded-xl text-sm font-semibold transition-colors ${
                onglet === key ? 'bg-rose-300 text-on-accent' : 'text-muted hover:bg-rose-50 hover:text-rose-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <select
          value={statutFiltre ?? ''}
          onChange={(e) => setStatutFiltre(e.target.value || null)}
          aria-label="Filtrer par statut"
          className="px-3 py-2 rounded-full border border-line bg-surface text-heading text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
        >
          <option value="">Tous les statuts</option>
          {STATUTS_LIVRABLE.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => setEnEdition({ livrable: nouveauLivrable(), estNouveau: true })}
          className="ml-auto flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold bg-rose-300 text-on-accent hover:bg-rose-400 shadow-md transition-colors"
        >
          <Plus className="w-4 h-4" />
          Ajouter un rendu
        </button>
      </div>

      {visibles.length === 0 ? (
        <div className="bg-surface rounded-3xl border border-dashed border-line p-10 flex flex-col items-center gap-2 text-center">
          <FolderOpen className="w-8 h-8 text-rose-300" />
          <p className="text-sm font-semibold text-heading">
            {livrables.length === 0 ? 'Ton espace de rendus est encore vide' : 'Aucun rendu ne correspond'}
          </p>
          <p className="text-xs text-muted max-w-sm">
            {livrables.length === 0
              ? 'Range ici tes exercices réalisés et tes projets rendus : liens, fichiers, note et retour du prof.'
              : 'Essaie un autre onglet, statut ou mot-clé.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {visibles.map((l) => (
            <LivrableCard key={l.id} livrable={l} todayISO={todayISO} onClick={() => setEnEdition({ livrable: l, estNouveau: false })} />
          ))}
        </div>
      )}

      <LivrableModal
        open={Boolean(enEdition)}
        livrable={enEdition?.livrable ?? null}
        estNouveau={enEdition?.estNouveau ?? false}
        catalogue={catalogueCours}
        onClose={() => setEnEdition(null)}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </div>
  )
}

export default LivrablesView
