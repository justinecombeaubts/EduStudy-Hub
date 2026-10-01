import { useState } from 'react'
import { Library, Pencil, Trash2, Plus, Sparkles } from 'lucide-react'
import NoteModal from './coinstudy/NoteModal'
import DefinitionModal from './dictionary/DefinitionModal'
import { matchesSearch } from '../utils/searchFilter'
import { getUeStyle } from '../utils/ueColors'

const NOTE_FIELDS = { titre: 'titre', ue: 'ue', theme: 'theme', contenu: 'contenu', date: 'date' }

// Dictionnaire (AUDIT.md J2 Tâche 6) : agrège les définitions déjà extraites par l'Écriture magique
// (`fiche.redactionIA.definitions`) sur toutes les fiches du Coin Study, + les définitions ajoutées
// ou corrigées manuellement ici (AUDIT.md J4 — retour formateur : édition/suppression/création).
// Recherche/filtres UE/Thème pilotés par le Header global, comme StudyView.
function DictionaryView({ search, filterType, filterValue, fiches, onFichesChange, onGenererFlashcards, flashcards, qcm, onOuvrirDeck, onOuvrirQcm }) {
  const [activeNoteId, setActiveNoteId] = useState(null)
  const [editingEntree, setEditingEntree] = useState(null) // entrée existante à éditer
  const [creatingDefinition, setCreatingDefinition] = useState(false)
  const [confirmingDeleteKey, setConfirmingDeleteKey] = useState(null)
  const ueOptions = Array.from(new Set(fiches.map((f) => f.ue))).sort()

  const fichesAvecDefinitions = fiches.filter(
    (f) => f.redactionIA?.definitions?.length > 0 && matchesSearch(f, { search, filterType, filterValue }, NOTE_FIELDS)
  )

  // Une entrée par définition (pas par fiche) — plusieurs fiches peuvent contribuer au dictionnaire.
  // `index` = position dans `fiche.redactionIA.definitions`, nécessaire pour éditer/supprimer précisément
  // (le terme seul ne suffit pas à identifier l'entrée : deux fiches peuvent définir le même mot).
  const entrees = fichesAvecDefinitions
    .flatMap((f) => f.redactionIA.definitions.map((d, index) => ({ ...d, fiche: f, index })))
    .sort((a, b) => a.terme.localeCompare(b.terme, 'fr'))

  const activeNote = fiches.find((f) => f.id === activeNoteId) ?? null

  function handleSaveNote(id, data) {
    onFichesChange(fiches.map((f) => (f.id === id ? { ...f, ...data } : f)))
    setActiveNoteId(null)
  }

  function handleDeleteNote(id) {
    onFichesChange(fiches.filter((f) => f.id !== id))
    setActiveNoteId(null)
  }

  // Écrit une définition (nouvelle ou éditée) sur la fiche ciblée. `origin: 'manuel'` uniquement à
  // la création — une définition IA corrigée pour une coquille reste d'origine IA (Charte §4 : le
  // badge reflète la provenance du contenu, pas son historique d'édition).
  function handleSaveDefinition({ ficheId, terme, definition }) {
    onFichesChange(
      fiches.map((f) => {
        if (f.id !== ficheId) return f
        const base = f.redactionIA ?? { titre: '', sousTitre: '', definitions: [], sections: [], tags: [] }
        const definitions = [...base.definitions]
        if (editingEntree && editingEntree.fiche.id === ficheId) {
          definitions[editingEntree.index] = { ...definitions[editingEntree.index], terme, definition }
        } else {
          definitions.push({ terme, definition, origin: 'manuel' })
        }
        return { ...f, redactionIA: { ...base, definitions } }
      })
    )
    setEditingEntree(null)
    setCreatingDefinition(false)
  }

  function handleDeleteDefinition(entree) {
    onFichesChange(
      fiches.map((f) => {
        if (f.id !== entree.fiche.id) return f
        return { ...f, redactionIA: { ...f.redactionIA, definitions: f.redactionIA.definitions.filter((_, i) => i !== entree.index) } }
      })
    )
    setConfirmingDeleteKey(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setCreatingDefinition(true)}
          disabled={fiches.length === 0}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium bg-peach-100 text-orange-700 hover:bg-peach-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nouvelle définition
        </button>
      </div>

      {entrees.length === 0 ? (
        <div className="bg-surface rounded-2xl border border-line shadow-sm shadow-rose-100/50 p-10 flex flex-col items-center gap-2 text-center">
          <Library className="w-8 h-8 text-rose-300" />
          <p className="text-sm font-medium text-heading">Aucune définition pour l'instant</p>
          <p className="text-xs text-muted">
            Passe une fiche du Coin Study par "✨ Écriture magique", ou ajoute une définition manuellement.
          </p>
        </div>
      ) : (
        <div className="bg-surface rounded-2xl border border-line shadow-sm shadow-rose-100/50 divide-y divide-rose-50">
          {entrees.map((entree) => {
            const ue = getUeStyle(entree.fiche.ue)
            const key = `${entree.fiche.id}-${entree.index}`
            const isManuel = entree.origin === 'manuel'
            return (
              <div key={key} className="px-4 py-3 flex items-start justify-between gap-4 hover:bg-rose-50/60 transition-colors">
                <button
                  type="button"
                  onClick={() => setActiveNoteId(entree.fiche.id)}
                  className="min-w-0 text-left flex-1"
                >
                  <p className="text-sm font-medium text-heading flex items-center gap-1.5">
                    {entree.terme}
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0 ${
                        isManuel ? 'bg-surface-muted text-muted' : 'bg-orange-100 text-orange-700'
                      }`}
                    >
                      {isManuel ? 'Manuel' : (<><Sparkles className="w-2.5 h-2.5" />IA</>)}
                    </span>
                  </p>
                  {entree.definition && <p className="text-xs text-muted mt-0.5">{entree.definition}</p>}
                </button>

                <div className="shrink-0 flex flex-col items-end gap-1.5">
                  <div className="flex items-center gap-1">
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${ue.badge}`}>{entree.fiche.ue}</span>
                    <button
                      type="button"
                      onClick={() => setEditingEntree(entree)}
                      aria-label="Modifier la définition"
                      className="p-1 rounded-lg text-rose-300 hover:bg-rose-100 hover:text-rose-600 transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmingDeleteKey(key)}
                      aria-label="Supprimer la définition"
                      className="p-1 rounded-lg text-rose-300 hover:bg-red-50 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {confirmingDeleteKey === key ? (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-red-600">Supprimer ?</span>
                      <button
                        type="button"
                        onClick={() => setConfirmingDeleteKey(null)}
                        className="text-[11px] text-muted hover:underline"
                      >
                        Non
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteDefinition(entree)}
                        className="text-[11px] font-medium text-red-600 hover:underline"
                      >
                        Oui
                      </button>
                    </div>
                  ) : (
                    <span className="text-[11px] text-muted truncate max-w-[160px]">{entree.fiche.titre}</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <NoteModal
        open={activeNoteId !== null}
        onClose={() => setActiveNoteId(null)}
        fiche={activeNote}
        ueOptions={ueOptions}
        onSave={handleSaveNote}
        onDelete={handleDeleteNote}
        onGenererFlashcards={onGenererFlashcards}
        flashcards={flashcards}
        qcm={qcm}
        onOuvrirDeck={onOuvrirDeck}
        onOuvrirQcm={onOuvrirQcm}
      />

      <DefinitionModal
        open={editingEntree !== null || creatingDefinition}
        onClose={() => {
          setEditingEntree(null)
          setCreatingDefinition(false)
        }}
        entree={editingEntree}
        fiches={fiches}
        onSave={handleSaveDefinition}
      />
    </div>
  )
}

export default DictionaryView
