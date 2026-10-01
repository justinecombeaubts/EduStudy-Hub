import { Search, Sparkles, X } from 'lucide-react'

// En-tête : titre de page, recherche globale + filtres avancés (type + valeur), badge de statut.
// Purement contrôlé par le parent (App.jsx) — pas de logique de filtrage ici.
function Header({
  title,
  badgeText,
  search,
  onSearchChange,
  filterType,
  onFilterTypeChange,
  availableFilterTypes,
  filterValue,
  onFilterValueChange,
  filterValueOptions,
}) {
  const showValueSelect = filterType === 'UE' || filterType === 'Thème'

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between gap-3 h-16 px-4 md:px-8 bg-surface border-b border-line">
      <h1 className="text-lg md:text-xl font-semibold text-heading shrink-0">{title}</h1>

      <div className="hidden sm:flex flex-1 items-center gap-2 min-w-0">
        <div className="relative flex-1 max-w-xs flex items-center gap-2 px-3 py-2 rounded-xl bg-rose-50 border border-line">
          <Search className="w-4 h-4 shrink-0 text-rose-300" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Rechercher un cours, une UE..."
            className="w-full bg-transparent text-sm text-heading placeholder:text-muted focus:outline-none"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label="Effacer la recherche"
              className="shrink-0 text-rose-300 hover:text-rose-600 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <select
          value={filterType}
          onChange={(e) => onFilterTypeChange(e.target.value)}
          className="shrink-0 px-2.5 py-2 rounded-xl border border-line bg-surface text-heading text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
        >
          {availableFilterTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>

        {showValueSelect && (
          filterValueOptions.length > 0 ? (
            <select
              value={filterValue ?? ''}
              onChange={(e) => onFilterValueChange(e.target.value || null)}
              className="shrink-0 max-w-[150px] px-2.5 py-2 rounded-xl border border-line bg-surface text-heading text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
            >
              <option value="">{filterType === 'UE' ? 'Toutes les UE' : 'Tous les thèmes'}</option>
              {filterValueOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          ) : (
            <span className="shrink-0 text-xs text-muted px-1">Non applicable ici</span>
          )
        )}
      </div>

      <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-peach-100 text-orange-800 text-xs font-medium shrink-0">
        <Sparkles className="w-3.5 h-3.5" />
        {badgeText}
      </span>
    </header>
  )
}

export default Header
