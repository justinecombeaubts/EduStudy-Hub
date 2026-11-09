import { CalendarDays, BookOpen, Library, GraduationCap, Sun, Moon, Bell, BellOff, Download } from 'lucide-react'
import { useTheme } from '../utils/useTheme'

const NAV_ITEMS = [
  { key: 'agenda', label: 'Agenda', icon: CalendarDays },
  { key: 'coin-study', label: 'Coin Study', icon: BookOpen },
  { key: 'dictionnaire', label: 'Dictionnaire', icon: Library },
]

// Navigation fixe à gauche. Collapse en icônes seules sur mobile (pas de hamburger — hors scope).
// `onOpenSakura` (optionnel) : bouton Professeur Sakura en bas de la même colonne que Agenda/Coin
// Study (AUDIT.md J3) — le `nav` en `flex-1` pousse ce bouton tout en bas de la colonne sans mt-auto.
// `rappels` / `pwa` (optionnels) : app Windows — rappels de cours en notification
// (useCourseReminders) et bouton "Installer l'app" (usePwaInstall), affiché seulement si installable.
const DELAIS_RAPPEL = [5, 10, 15, 30, 60]

function Sidebar({ activeItem, onSelect, onOpenSakura, rappels, pwa }) {
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

      {(rappels?.supporte || pwa?.canInstall) && (
        <div className="px-2 md:px-3 py-3 border-t border-line space-y-1">
          {pwa?.canInstall && (
            <button
              type="button"
              onClick={pwa.install}
              aria-label="Installer EduStudy Hub sur cet ordinateur"
              className="w-full flex items-center justify-center md:justify-start gap-3 px-3 py-2 rounded-xl text-sm font-medium text-muted hover:bg-rose-50 hover:text-rose-700 transition-colors"
            >
              <Download className="w-4 h-4 shrink-0" />
              <span className="hidden md:inline">Installer l'app</span>
            </button>
          )}
          {rappels?.supporte && (
            <>
              <button
                type="button"
                onClick={rappels.actif ? rappels.desactiver : rappels.activer}
                aria-pressed={rappels.actif}
                aria-label={rappels.actif ? 'Désactiver les rappels de cours' : 'Activer les rappels de cours'}
                title={
                  rappels.permission === 'denied'
                    ? 'Notifications bloquées : autorise-les dans les paramètres du site (cadenas à gauche de l’adresse) ou de Windows.'
                    : undefined
                }
                className="w-full flex items-center justify-center md:justify-start gap-3 px-3 py-2 rounded-xl text-sm font-medium text-muted hover:bg-rose-50 hover:text-rose-700 transition-colors"
              >
                {rappels.actif ? <Bell className="w-4 h-4 shrink-0 text-rose-500" /> : <BellOff className="w-4 h-4 shrink-0" />}
                <span className="hidden md:inline">{rappels.actif ? 'Rappels activés' : 'Activer les rappels'}</span>
              </button>
              {rappels.actif && (
                <label className="hidden md:flex items-center gap-2 px-3 text-xs text-muted">
                  Prévenir
                  <select
                    value={rappels.minutesAvant}
                    onChange={(e) => rappels.setMinutesAvant(Number(e.target.value))}
                    className="px-1.5 py-1 rounded-lg border border-line bg-surface text-heading text-xs focus:outline-none focus:ring-2 focus:ring-rose-300"
                  >
                    {DELAIS_RAPPEL.map((m) => (
                      <option key={m} value={m}>
                        {m} min
                      </option>
                    ))}
                  </select>
                  avant
                </label>
              )}
              {rappels.permission === 'denied' && (
                <p className="hidden md:block px-3 text-[11px] leading-snug text-muted">Notifications bloquées par le navigateur.</p>
              )}
            </>
          )}
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
