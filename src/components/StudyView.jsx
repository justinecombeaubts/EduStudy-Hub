import { useEffect, useRef, useState } from 'react'
import { Coffee, CheckSquare, Trash2 } from 'lucide-react'
import FicheCard from './coinstudy/FicheCard'
import NoteModal from './coinstudy/NoteModal'
import { matchesSearch } from '../utils/searchFilter'
import { STATUTS } from '../utils/statuts'

const NOTE_FIELDS = { titre: 'titre', ue: 'ue', theme: 'theme', contenu: 'contenu', date: 'date' }

// Filtre statut "virtuel" : regroupe Brouillon + À repasser (tout ce qui n'est pas encore Rédigée).
// Utilisé par le bandeau d'accueil ("X fiches en attente") pour arriver sur le Coin Study déjà filtré.
const STATUT_EN_ATTENTE = 'En attente'

// Espace de révision : vue d'ensemble de TOUTES les fiches (créées depuis l'Agenda ou ici),
// recherche + filtres (UE/Thème/mot-clé) pilotés par le Header global, filtre Statut local
// (spécifique au Coin Study, non porté par le Header).
// `fiches`/`onFichesChange` sont possédés par App.jsx (persistés en localStorage, store unique
// partagé avec l'Agenda).
function StudyView({
  search,
  filterType,
  filterValue,
  fiches,
  onFichesChange,
  onGenererFlashcards,
  statutRequest,
  flashcards,
  qcm,
  onOuvrirDeck,
  onOuvrirQcm,
}) {
  const [statutFilter, setStatutFilter] = useState('Tous')
  const [activeNoteId, setActiveNoteId] = useState(null)
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [confirmingBulkDelete, setConfirmingBulkDelete] = useState(false)
  const [bulkStatutValue, setBulkStatutValue] = useState('')
  const dernierStatutNonce = useRef(null)

  // Le bandeau d'accueil ("X fiches en attente") demande ce filtre depuis l'extérieur (App.jsx) —
  // nonce unique à chaque clic pour ré-appliquer le filtre même s'il était déjà sur cette valeur.
  useEffect(() => {
    if (!statutRequest || statutRequest.nonce === dernierStatutNonce.current) return
    dernierStatutNonce.current = statutRequest.nonce
    setStatutFilter(statutRequest.statut)
  }, [statutRequest])

  const ueOptions = Array.from(new Set(fiches.map((f) => f.ue))).sort()

  const fichesFiltrees = fiches.filter((f) => {
    const matchGlobal = matchesSearch(f, { search, filterType, filterValue }, NOTE_FIELDS)
    const matchStatut =
      statutFilter === 'Tous' ||
      (statutFilter === STATUT_EN_ATTENTE ? f.statut !== 'Rédigée' : f.statut === statutFilter)
    return matchGlobal && matchStatut
  })

  const activeNote = fiches.find((f) => f.id === activeNoteId) ?? null

  function handleSaveNote(id, data) {
    onFichesChange(fiches.map((f) => (f.id === id ? { ...f, ...data } : f)))
    setActiveNoteId(null)
  }

  // Suppression locale uniquement (pas de scénario Make dédié à ce jour — voir AUDIT.md).
  function handleDeleteNote(id) {
    onFichesChange(fiches.filter((f) => f.id !== id))
    setActiveNoteId(null)
  }

  function toggleSelectionMode() {
    setSelectionMode((m) => !m)
    setSelectedIds(new Set())
    setConfirmingBulkDelete(false)
  }

  function handleToggleSelect(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
    setConfirmingBulkDelete(false)
  }

  const toutSelectionne = fichesFiltrees.length > 0 && fichesFiltrees.every((f) => selectedIds.has(f.id))

  function handleToggleSelectAll() {
    setSelectedIds(toutSelectionne ? new Set() : new Set(fichesFiltrees.map((f) => f.id)))
  }

  // Suppression groupée, locale uniquement (même limite que la suppression unitaire — voir AUDIT.md).
  function handleBulkDelete() {
    onFichesChange(fiches.filter((f) => !selectedIds.has(f.id)))
    setSelectedIds(new Set())
    setConfirmingBulkDelete(false)
    setSelectionMode(false)
  }

  // Changement de statut groupé — même sélection que la suppression, action distincte et non
  // destructive (pas de confirmation nécessaire, contrairement à la suppression).
  function handleBulkStatutChange(nouveauStatut) {
    if (!nouveauStatut) return
    onFichesChange(fiches.map((f) => (selectedIds.has(f.id) ? { ...f, statut: nouveauStatut } : f)))
    setBulkStatutValue('')
    setSelectedIds(new Set())
    setSelectionMode(false)
  }

  return (
    <div className="space-y-4">
      {/* Filtre local (spécifique au Coin Study) — recherche + UE/Thème pilotés par l'en-tête */}
      <div className="bg-surface rounded-2xl border border-line shadow-sm shadow-rose-100/50 p-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted">Recherche et filtres UE/Thème disponibles dans l'en-tête ↑</p>
        <div className="flex items-center gap-2">
          <select
            value={statutFilter}
            onChange={(e) => setStatutFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-line text-sm text-heading bg-surface focus:outline-none focus:ring-2 focus:ring-rose-300"
          >
            <option value="Tous">Tous les statuts</option>
            <option value={STATUT_EN_ATTENTE}>{STATUT_EN_ATTENTE}</option>
            {STATUTS.map((statut) => (
              <option key={statut} value={statut}>
                {statut}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={toggleSelectionMode}
            title="Sélectionner plusieurs fiches pour changer leur statut ou les supprimer d'un coup"
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
              selectionMode ? 'bg-rose-300 text-on-accent' : 'text-rose-500 hover:bg-rose-50'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            {selectionMode ? 'Annuler la sélection' : 'Sélectionner'}
          </button>
        </div>
      </div>

      {/* Barre d'actions groupées — apparaît uniquement en mode sélection */}
      {selectionMode && (
        <div className="bg-rose-50 border border-line rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-sm">
            <span className="font-medium text-muted">{selectedIds.size} sélectionnée(s)</span>
            <button type="button" onClick={handleToggleSelectAll} className="text-rose-600 hover:underline">
              {toutSelectionne ? 'Tout désélectionner' : 'Tout sélectionner'}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Changer le statut des fiches sélectionnées — action distincte de la suppression,
                pas assez visible auparavant (retour formateur) : libellé explicite plutôt qu'un
                simple select nu. */}
            <label className="flex items-center gap-1.5 text-xs text-rose-700">
              Changer le statut vers :
              <select
                value={bulkStatutValue}
                onChange={(e) => handleBulkStatutChange(e.target.value)}
                disabled={selectedIds.size === 0}
                className="px-2.5 py-1.5 rounded-lg border border-line text-xs text-heading bg-surface focus:outline-none focus:ring-2 focus:ring-rose-300 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <option value="" disabled>
                  Choisir…
                </option>
                {STATUTS.map((statut) => (
                  <option key={statut} value={statut}>
                    {statut}
                  </option>
                ))}
              </select>
            </label>

            {confirmingBulkDelete ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-red-600">Supprimer {selectedIds.size} fiche(s) définitivement ?</span>
                <button
                  type="button"
                  onClick={() => setConfirmingBulkDelete(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-muted hover:bg-surface transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleBulkDelete}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500 text-white hover:bg-red-600 transition-colors"
                >
                  Oui, supprimer
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmingBulkDelete(true)}
                disabled={selectedIds.size === 0}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium bg-surface text-red-500 border border-red-200 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Supprimer ({selectedIds.size})
              </button>
            )}
          </div>
        </div>
      )}

      {/* Grille de fiches / état vide */}
      {fichesFiltrees.length === 0 ? (
        <div className="bg-surface rounded-2xl border border-line shadow-sm shadow-rose-100/50 p-10 flex flex-col items-center gap-2 text-center">
          <Coffee className="w-8 h-8 text-rose-300" />
          <p className="text-sm font-medium text-heading">Aucune fiche ne correspond à ta recherche</p>
          <p className="text-xs text-muted">Essaie un autre mot-clé ou réinitialise les filtres.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {fichesFiltrees.map((fiche) => (
            <FicheCard
              key={fiche.id}
              fiche={fiche}
              onClick={() => setActiveNoteId(fiche.id)}
              selectionMode={selectionMode}
              selected={selectedIds.has(fiche.id)}
              onToggleSelect={handleToggleSelect}
            />
          ))}
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
    </div>
  )
}

export default StudyView
