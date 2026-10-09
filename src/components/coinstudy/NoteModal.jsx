import { useEffect, useState } from 'react'
import { X, BookOpen, Sparkles, Trash2, Loader2, AlertCircle, Pencil, Eye, Layers, ListChecks, ChevronRight } from 'lucide-react'
import { STATUTS } from '../../utils/statuts'
import { genererEcritureMagique, aplatirRedaction, ERREUR_MESSAGES } from '../../utils/ecritureMagique'
import RedactionIACard from './RedactionIACard'
import PieceJointeFields from '../shared/PieceJointeFields'
import { lirePiecesJointes } from '../../utils/piecesJointes'

// Modale de lecture/édition complète d'une fiche du Coin Study. État purement local.
// `flashcards`/`qcm` + `onOuvrirDeck`/`onOuvrirQcm` (AUDIT.md J4 — retour formateur) : accès direct
// aux decks/QCM déjà générés pour CETTE fiche (via `sourceFicheIds`), sans repasser par le menu de
// Professeur Sakura — seule la génération d'un nouveau contenu ouvre encore l'agent (appel IA requis).
function NoteModal({ open, onClose, fiche, ueOptions, onSave, onDelete, onGenererFlashcards, flashcards = [], qcm = [], onOuvrirDeck, onOuvrirQcm }) {
  const [mounted, setMounted] = useState(open)
  const [visible, setVisible] = useState(false)

  const [titre, setTitre] = useState('')
  const [ue, setUe] = useState('')
  const [theme, setTheme] = useState('')
  const [statut, setStatut] = useState('Brouillon')
  const [contenu, setContenu] = useState('')
  const [liens, setLiens] = useState([])
  const [fichiers, setFichiers] = useState([])
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  // Écriture magique (AUDIT.md J2 Tâche 7) : `redactionIA` = version déjà validée et enregistrée
  // sur la fiche ; `apercuIA` = résultat fraîchement généré, en attente d'acceptation/rejet par
  // l'utilisateur (jamais appliqué automatiquement — Charte IA §4). C'est aussi la source des
  // définitions affichées dans le Dictionnaire (AUDIT.md Tâche 6, voir DictionaryView.jsx) —
  // `redactionIA.definitions`, pas de webhook dédié pour ça.
  const [redactionIA, setRedactionIA] = useState(null)
  const [apercuIA, setApercuIA] = useState(null)
  const [genererEnCours, setGenererEnCours] = useState(false)
  const [erreurGeneration, setErreurGeneration] = useState(null)
  // Bascule manuelle vers le texte source (édition brute), demandée explicitement par l'utilisateur.
  // Tant qu'une mise en forme IA existe (validée ou en attente de révision) et que ce flag est
  // à false, on n'affiche QUE la carte reformulée — jamais le cadre de saisie brut à côté.
  const [forceEdition, setForceEdition] = useState(false)
  const editeurVisible = forceEdition || (!redactionIA && !apercuIA)

  useEffect(() => {
    if (open) {
      setMounted(true)
      const frame = requestAnimationFrame(() => setVisible(true))
      return () => cancelAnimationFrame(frame)
    }
    setVisible(false)
    const timer = setTimeout(() => setMounted(false), 200)
    return () => clearTimeout(timer)
  }, [open])

  useEffect(() => {
    if (!open || !fiche) return
    setTitre(fiche.titre ?? '')
    setUe(fiche.ue ?? ueOptions[0] ?? '')
    setTheme(fiche.theme ?? '')
    setStatut(fiche.statut ?? 'Brouillon')
    setContenu(fiche.contenu ?? '')
    const pj = lirePiecesJointes(fiche)
    setLiens(pj.liens)
    setFichiers(pj.fichiers)
    setConfirmingDelete(false)
    setRedactionIA(fiche.redactionIA ?? null)
    setApercuIA(null)
    setErreurGeneration(null)
    setGenererEnCours(false)
    setForceEdition(false)
  }, [open, fiche]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) return
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  function handleSubmit(e) {
    e.preventDefault()
    if (!fiche) return
    onSave(fiche.id, {
      titre: titre.trim() || 'Fiche sans titre',
      ue,
      theme: theme.trim(),
      statut,
      contenu,
      redactionIA,
      liens,
      fichiers,
    })
  }

  function handleDelete() {
    if (!fiche) return
    onDelete(fiche.id)
  }

  // Une édition manuelle du contenu invalide toute mise en forme IA en cours ou déjà validée :
  // on évite d'afficher une carte qui ne correspond plus au texte source.
  function handleContenuChange(value) {
    setContenu(value)
    if (redactionIA) setRedactionIA(null)
    if (apercuIA) setApercuIA(null)
  }

  async function handleGenererEcritureMagique() {
    setGenererEnCours(true)
    setErreurGeneration(null)
    const resultat = await genererEcritureMagique({ titre, ue, theme, contenu })
    setGenererEnCours(false)

    if (!resultat.ok) {
      setErreurGeneration(ERREUR_MESSAGES[resultat.error] ?? ERREUR_MESSAGES.invalid_response)
      return
    }
    setApercuIA(resultat.redaction)
    setForceEdition(false) // on affiche tout de suite l'aperçu généré, pas le cadre de texte
  }

  function handleAccepterApercu() {
    if (!apercuIA) return
    setContenu(aplatirRedaction(apercuIA))
    setRedactionIA(apercuIA)
    setApercuIA(null)
    setStatut('Rédigée') // la fiche est mise au propre et validée par l'utilisateur : plus un brouillon
  }

  function handleRejeterApercu() {
    setApercuIA(null)
  }

  if (!mounted || !fiche) return null

  const decksLies = flashcards.filter((d) => d.sourceFicheIds?.includes(fiche.id))
  const qcmLies = qcm.filter((q) => q.sourceFicheIds?.includes(fiche.id))

  return (
    <div
      className={`fixed inset-0 z-50 flex items-start sm:items-center justify-center overflow-y-auto p-4 py-8 transition-opacity duration-200 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className="absolute inset-0 bg-rose-950/40" onClick={onClose} />

      <div
        className={`relative w-full max-w-lg max-h-[85vh] overflow-y-auto bg-surface rounded-3xl border border-line shadow-xl shadow-rose-200/50 p-6 transition-all duration-200 ${
          visible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-2'
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="flex items-center gap-1.5 text-lg font-semibold text-heading">
            <BookOpen className="w-4 h-4 text-rose-300" />
            Fiche de révision
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="p-1 rounded-lg text-rose-300 hover:bg-rose-50 hover:text-rose-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="note-titre" className="block text-sm font-medium text-muted mb-1">
              Titre
            </label>
            <input
              id="note-titre"
              type="text"
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-app border border-line text-sm text-heading focus:outline-none focus:ring-2 focus:ring-rose-300"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="note-ue" className="block text-sm font-medium text-muted mb-1">
                UE / Matière
              </label>
              <select
                id="note-ue"
                value={ue}
                onChange={(e) => setUe(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-app border border-line text-sm text-heading focus:outline-none focus:ring-2 focus:ring-rose-300"
              >
                {ueOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="note-statut" className="block text-sm font-medium text-muted mb-1">
                Statut
              </label>
              <select
                id="note-statut"
                value={statut}
                onChange={(e) => setStatut(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-app border border-line text-sm text-heading focus:outline-none focus:ring-2 focus:ring-rose-300"
              >
                {STATUTS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="note-theme" className="block text-sm font-medium text-muted mb-1">
              Thème
            </label>
            <input
              id="note-theme"
              type="text"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              placeholder="Ex. Droit du travail"
              className="w-full px-3 py-2 rounded-xl bg-app border border-line text-sm text-heading placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-rose-300"
            />
          </div>

          <PieceJointeFields liens={liens} onLiensChange={setLiens} fichiers={fichiers} onFichiersChange={setFichiers} />

          {/* Contenu : cadre de saisie brut (édition) OU carte reformulée par IA (lecture) —
              jamais les deux en même temps une fois une mise en forme IA disponible. */}
          <div className="space-y-2">
            {editeurVisible && (
              <div>
                <label htmlFor="note-contenu" className="block text-sm font-medium text-muted mb-1">
                  Contenu
                </label>
                <textarea
                  id="note-contenu"
                  value={contenu}
                  onChange={(e) => handleContenuChange(e.target.value)}
                  rows={8}
                  className="w-full px-3 py-2 rounded-xl bg-app border border-line text-sm text-heading placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-rose-300 resize-none"
                />
              </div>
            )}

            {!editeurVisible && apercuIA && <RedactionIACard redaction={apercuIA} variant="apercu" />}
            {!editeurVisible && !apercuIA && redactionIA && (
              <RedactionIACard redaction={redactionIA} variant="validee" />
            )}

            {/* Bascule texte source ↔ version mise en forme, uniquement quand il y a une version
                validée à afficher (pas pendant la révision d'un aperçu — décision requise d'abord). */}
            {redactionIA && !apercuIA && (
              <button
                type="button"
                onClick={() => setForceEdition((v) => !v)}
                className="flex items-center gap-1.5 text-xs font-medium text-rose-500 hover:text-rose-700 hover:underline"
              >
                {editeurVisible ? (
                  <>
                    <Eye className="w-3.5 h-3.5" />
                    Revenir à la version mise en forme
                  </>
                ) : (
                  <>
                    <Pencil className="w-3.5 h-3.5" />
                    Voir / modifier le texte source
                  </>
                )}
              </button>
            )}

            {apercuIA && (
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleRejeterApercu}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-muted hover:bg-rose-50 transition-colors"
                >
                  Rejeter
                </button>
                <button
                  type="button"
                  onClick={handleAccepterApercu}
                  className="px-4 py-2 rounded-full text-sm font-medium bg-rose-300 text-on-accent hover:bg-rose-400 shadow-md transition-colors"
                >
                  Utiliser cette version
                </button>
              </div>
            )}
          </div>

          {/* Écriture magique (AUDIT.md J2 Tâche 7) : mise en forme IA du contenu, toujours "à
              relire" avant d'être acceptée — jamais appliquée automatiquement (Charte IA §4).
              Uniquement proposée en mode édition (texte source visible). Les définitions extraites
              ici alimentent aussi le Dictionnaire (AUDIT.md Tâche 6). */}
          {editeurVisible && (
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleGenererEcritureMagique}
                disabled={genererEnCours || !contenu.trim()}
                title={!contenu.trim() ? 'Ajoute du contenu à mettre en forme' : undefined}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-peach-100 text-orange-700 hover:bg-peach-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {genererEnCours ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                {genererEnCours ? 'Génération en cours…' : '✨ Écriture magique'}
              </button>

              {erreurGeneration && (
                <p className="flex items-start gap-1.5 text-xs text-red-600">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  {erreurGeneration}
                </p>
              )}
            </div>
          )}

          {/* Flashcards/QCM déjà générés pour cette fiche (AUDIT.md J4 — retour formateur) : accès
              direct au mode entraînement, sans repasser par le menu de Professeur Sakura. */}
          {(decksLies.length > 0 || qcmLies.length > 0) && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted">🌸 Déjà généré pour cette fiche</p>
              {decksLies.map((deck) => (
                <button
                  key={deck.id}
                  type="button"
                  onClick={() => {
                    onOuvrirDeck?.(deck.id)
                    onClose()
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl border border-line text-left hover:bg-rose-50 hover:border-line transition-colors"
                >
                  <Layers className="w-4 h-4 text-rose-300 shrink-0" />
                  <span className="flex-1 min-w-0 text-sm text-heading truncate">{deck.titre}</span>
                  <span className="text-[11px] text-muted shrink-0">{deck.cards.length} carte(s)</span>
                  <ChevronRight className="w-4 h-4 text-rose-300 shrink-0" />
                </button>
              ))}
              {qcmLies.map((record) => (
                <button
                  key={record.id}
                  type="button"
                  onClick={() => {
                    onOuvrirQcm?.(record.id)
                    onClose()
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl border border-line text-left hover:bg-rose-50 hover:border-line transition-colors"
                >
                  <ListChecks className="w-4 h-4 text-rose-300 shrink-0" />
                  <span className="flex-1 min-w-0 text-sm text-heading truncate">{record.titre}</span>
                  <span className="text-[11px] text-muted shrink-0">{record.questions.length} question(s)</span>
                  <ChevronRight className="w-4 h-4 text-rose-300 shrink-0" />
                </button>
              ))}
            </div>
          )}

          {/* Génération de flashcards IA par Professeur Sakura (AUDIT.md J3 Tâche 13) : ferme cette
              modale et ouvre Sakura pré-rempli sur cette fiche, plutôt que deux modales superposées. */}
          <button
            type="button"
            onClick={() => {
              onGenererFlashcards(fiche.id)
              onClose()
            }}
            disabled={!contenu.trim()}
            title={!contenu.trim() ? 'Ajoute du contenu pour générer des flashcards' : undefined}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-peach-100 text-orange-700 hover:bg-peach-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            🌸 Générer des Flashcards IA (Professeur Sakura)
          </button>

          {confirmingDelete ? (
            <div className="flex items-center justify-between gap-2 pt-2">
              <span className="text-xs text-red-600">Supprimer définitivement cette fiche ?</span>
              <div className="flex gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-muted hover:bg-rose-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-4 py-2 rounded-full text-sm font-medium bg-red-500 text-white hover:bg-red-600 shadow-md transition-colors"
                >
                  Oui, supprimer
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmingDelete(true)}
                className="flex items-center gap-1.5 px-3 py-2 -ml-3 rounded-xl text-sm font-medium text-rose-400 hover:bg-red-50 hover:text-red-600 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Supprimer
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-muted hover:bg-rose-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-full text-sm font-medium bg-rose-300 text-on-accent hover:bg-rose-400 shadow-md transition-colors"
                >
                  Enregistrer
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}

export default NoteModal
