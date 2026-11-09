import { CalendarDays, BookOpen, Library, GraduationCap, Sun, Moon } from 'lucide-react'
import { useTheme } from '../utils/useTheme'

const NAV_ITEMS = [
  { key: 'agenda', label: 'Agenda', icon: CalendarDays },
  { key: 'coin-study', label: 'Coin Study', icon: BookOpen },
  { key: 'dictionnaire', label: 'Dictionnaire', icon: Library },
]

// Navigation fixe à gauche. Collapse en icônes seules sur mobile (pas de hamburger — hors scope).
// `onOpenSakura` (optionnel) : bouton Professeur Sakura en bas de la même colonne que Agenda/Coin
// Study (AUDIT.md J3) — le `nav` en `flex-1` pousse ce bouton tout en bas de la colonne sans mt-auto.
function Sidebar({ activeItem, onSelect, onOpenSakura }) {
  const { theme, toggleTheme } = useTheme()

  return (
    <aside className="flex flex-col w-16 md:w-64 shrink-0 h-screen sticky top-0 border-r border-line bg-surface">
      <div className="flex items-center gap-2 px-3 md:px-6 h-16 border-b border-line">
        <GraduationCap className="w-6 h-6 text-rose-400 shrink-0" />
        <span className="hidden md:inline font-semibold text-heading">EduStudy Hub</span>
      </div>

      <nav className="flex-1 px-2 md:px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ key, label, icon: Icon }) => {
          const active = activeItem === key
          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelect(key)}
              className={`w-full flex items-center justify-center md:justify-start gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                active ? 'bg-rose-100 text-rose-800' : 'text-muted hover:bg-rose-50 hover:text-rose-700'
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
          <button
            type="button"
            onClick={onOpenSakura}
            aria-label="Ouvrir Professeur Sakura"
            className="w-full flex items-center justify-center md:justify-start gap-3 px-3 py-2 rounded-xl text-sm font-medium text-muted hover:bg-rose-50 hover:text-rose-700 transition-colors"
          >
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
          className="w-full flex items-center justify-center md:justify-start gap-3 px-3 py-2 rounded-xl text-sm font-medium text-muted hover:bg-rose-50 hover:text-rose-700 transition-colors"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 shrink-0" /> : <Moon className="w-4 h-4 shrink-0" />}
          <span className="hidden md:inline">{theme === 'dark' ? 'Mode clair' : 'Mode sombre'}</span>
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
