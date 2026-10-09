import { CalendarDays, BookOpen, Library, FolderCheck, GraduationCap, Sun, Moon } from 'lucide-react'
import { useTheme } from '../utils/useTheme'

const NAV_ITEMS = [
  { key: 'agenda', label: 'Agenda', icon: CalendarDays },
  { key: 'coin-study', label: 'Coin Study', icon: BookOpen },
  { key: 'dictionnaire', label: 'Dictionnaire', icon: Library },
  { key: 'livrables', label: 'Exercices & Livrables', icon: FolderCheck },
]

const BOUTON_SECONDAIRE =
  'w-full flex items-center justify-center md:justify-start gap-3 px-3 py-2 rounded-2xl text-sm font-semibold text-muted hover:bg-rose-50 hover:text-rose-700 transition-colors'

// Navigation fixe à gauche. Collapse en icônes seules sur mobile (pas de hamburger — hors scope).
// `onOpenSakura` (optionnel) : bouton Professeur Sakura en bas de la même colonne que Agenda/Coin
// Study (AUDIT.md J3) — le `nav` en `flex-1` pousse ce bouton tout en bas de la colonne sans mt-auto.
function Sidebar({ activeItem, onSelect, onOpenSakura }) {
  const { theme, toggleTheme } = useTheme()

  return (
    <aside className="glass flex flex-col w-16 md:w-64 shrink-0 h-screen sticky top-0 border-r border-line">
      <div className="flex items-center gap-2.5 px-3 md:px-5 h-16 border-b border-line">
        <span className="w-9 h-9 flex items-center justify-center rounded-2xl bg-rose-100 shrink-0">
          <GraduationCap className="w-5 h-5 text-rose-500" />
        </span>
        <span className="hidden md:inline font-heading font-bold text-heading">EduStudy Hub</span>
      </div>

      <nav className="flex-1 px-2 md:px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ key, label, icon: Icon }) => {
          const active = activeItem === key
          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelect(key)}
              title={label}
              className={`w-full flex items-center justify-center md:justify-start gap-3 px-3 py-2 rounded-2xl text-sm font-semibold transition-colors ${
                active ? 'bg-rose-100 text-rose-800 shadow-sm' : 'text-muted hover:bg-rose-50 hover:text-rose-700'
              }`}
              aria-current={active ? 'page' : undefined}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="hidden md:inline">{label}</span>
            </button>
          )
        })}
      </nav>

      {onOpenSakura && (
        <div className="px-2 md:px-3 py-3 border-t border-line">
          <button type="button" onClick={onOpenSakura} aria-label="Ouvrir Professeur Sakura" className={BOUTON_SECONDAIRE}>
            <span className="text-base leading-none shrink-0" aria-hidden="true">🌸</span>
            <span className="hidden md:inline">Professeur Sakura</span>
          </button>
        </div>
      )}

      <div className="px-2 md:px-3 py-3 border-t border-line">
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
          className={BOUTON_SECONDAIRE}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 shrink-0" /> : <Moon className="w-4 h-4 shrink-0" />}
          <span className="hidden md:inline">{theme === 'dark' ? 'Mode clair' : 'Mode sombre'}</span>
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
