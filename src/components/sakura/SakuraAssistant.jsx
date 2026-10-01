import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { X } from 'lucide-react'
import SakuraMenu from './SakuraMenu'
import SakuraFlashcardsFlow from './SakuraFlashcardsFlow'
import SakuraQcmFlow from './SakuraQcmFlow'
import SakuraChat from './SakuraChat'
import SakuraMesDecks from './SakuraMesDecks'
import SakuraMesQcm from './SakuraMesQcm'
import FlashcardTrainer from './FlashcardTrainer'
import QcmTrainer from './QcmTrainer'

const TITRES = {
  menu: 'Professeur Sakura',
  flashcards: 'Créer des flashcards',
  qcm: 'Créer un QCM',
  chat: 'Discuter avec Sakura',
  mesDecks: 'Mes decks',
  mesQcm: 'Mes QCM',
  trainer: 'Entraînement',
  qcmTrainer: 'QCM',
}

// Agent IA "Professeur Sakura" (AUDIT.md J3 Tâche 12) : panel ancré en bas à gauche, dans la même
// colonne que la navigation Agenda/Coin Study (bouton déclencheur dans Sidebar.jsx, voir App.jsx qui
// relie les deux via une ref — `open()` exposé ici). Panel = machine à états simple : menu →
// flashcards | qcm | chat | mesDecks | mesQcm, chaque flux gère ses propres sous-étapes.
const SakuraAssistant = forwardRef(function SakuraAssistant(
  { fiches, flashcards, onFlashcardsChange, qcm, onQcmChange, sakuraRequest },
  ref
) {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(false)
  const [mode, setMode] = useState('menu')
  const [prefillFicheIds, setPrefillFicheIds] = useState(null)
  const [deckEnCours, setDeckEnCours] = useState(null)
  const [qcmEnCours, setQcmEnCours] = useState(null)
  const panelRef = useRef(null)
  const dernierNonce = useRef(null)

  // Ouverture depuis Sidebar (bouton "Professeur Sakura", même colonne que Agenda/Coin Study).
  useImperativeHandle(ref, () => ({
    open() {
      setMode('menu')
      setOpen(true)
    },
  }))

  // Ouverture depuis l'extérieur (NoteModal, AUDIT.md J4) : un nouveau `sakuraRequest` (nonce
  // différent) ouvre directement le flux concerné, sans passer par le menu — génération de flashcards
  // pré-remplie sur la fiche, ou accès direct au mode entraînement d'un deck/QCM déjà généré pour
  // cette fiche (retour formateur : "flashcards/QCM accessibles depuis la fiche sans repasser par
  // l'interface de l'agent").
  useEffect(() => {
    if (!sakuraRequest || sakuraRequest.nonce === dernierNonce.current) return
    dernierNonce.current = sakuraRequest.nonce

    if (sakuraRequest.mode === 'open-deck') {
      const deck = flashcards.find((d) => d.id === sakuraRequest.deckId)
      if (!deck) return
      setDeckEnCours(deck)
      setMode('trainer')
      setOpen(true)
      return
    }

    if (sakuraRequest.mode === 'open-qcm') {
      const record = qcm.find((q) => q.id === sakuraRequest.qcmId)
      if (!record) return
      setQcmEnCours(record)
      setMode('qcmTrainer')
      setOpen(true)
      return
    }

    setPrefillFicheIds(sakuraRequest.ficheId ? [sakuraRequest.ficheId] : null)
    setMode('flashcards')
    setOpen(true)
  }, [sakuraRequest, flashcards, qcm])

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
    if (!open) return
    function handleKeyDown(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    function handleClickOutside(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('mousedown', handleClickOutside)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  function handleFermer() {
    setOpen(false)
  }

  function handleRetourMenu() {
    setMode('menu')
    setPrefillFicheIds(null)
    setDeckEnCours(null)
    setQcmEnCours(null)
  }

  function handleSelectDeck(deck) {
    setDeckEnCours(deck)
    setMode('trainer')
  }

  function handleQuitterTrainer() {
    setDeckEnCours(null)
    setMode('mesDecks')
  }

  function handleSelectQcm(record) {
    setQcmEnCours(record)
    setMode('qcmTrainer')
  }

  function handleQuitterQcmTrainer() {
    setQcmEnCours(null)
    setMode('mesQcm')
  }

  if (!mounted) return null

  return (
    <div
      ref={panelRef}
      className={`fixed bottom-4 left-4 md:left-6 z-40 w-[min(22rem,calc(100vw-2rem))] max-h-[70vh] flex flex-col bg-surface rounded-3xl border border-line shadow-xl shadow-rose-200/50 transition-all duration-200 ${
        visible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-2 pointer-events-none'
      }`}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-line shrink-0">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold text-heading truncate">
          <span aria-hidden="true" className="shrink-0">🌸</span>
          <span className="truncate">
            {mode === 'trainer' && deckEnCours
              ? deckEnCours.titre
              : mode === 'qcmTrainer' && qcmEnCours
                ? qcmEnCours.titre
                : TITRES[mode]}
          </span>
        </h2>
        <button
          type="button"
          onClick={handleFermer}
          aria-label="Fermer"
          className="p-1 rounded-lg text-rose-300 hover:bg-rose-50 hover:text-rose-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 overflow-y-auto">
        {mode === 'menu' && (
          <SakuraMenu
            onChoisir={setMode}
            flashcardsCount={flashcards.length}
            qcmCount={qcm.length}
            onOuvrirMesDecks={() => setMode('mesDecks')}
            onOuvrirMesQcm={() => setMode('mesQcm')}
          />
        )}

        {mode === 'flashcards' && (
          <SakuraFlashcardsFlow
            fiches={fiches}
            prefillFicheIds={prefillFicheIds}
            onEnregistrer={(decks) => onFlashcardsChange([...flashcards, ...decks])}
            onRetourMenu={handleRetourMenu}
          />
        )}

        {mode === 'qcm' && (
          <SakuraQcmFlow
            fiches={fiches}
            prefillFicheIds={prefillFicheIds}
            onEnregistrer={(record) => onQcmChange([...qcm, record])}
            onRetourMenu={handleRetourMenu}
          />
        )}

        {mode === 'chat' && <SakuraChat />}

        {mode === 'mesDecks' && <SakuraMesDecks flashcards={flashcards} onSelectDeck={handleSelectDeck} />}
        {mode === 'mesQcm' && <SakuraMesQcm qcm={qcm} onSelectQcm={handleSelectQcm} />}
        {mode === 'trainer' && deckEnCours && <FlashcardTrainer deck={deckEnCours} onQuitter={handleQuitterTrainer} />}
        {mode === 'qcmTrainer' && qcmEnCours && <QcmTrainer qcm={qcmEnCours} onQuitter={handleQuitterQcmTrainer} />}

        {(mode === 'chat' || mode === 'mesDecks' || mode === 'mesQcm') && (
          <button type="button" onClick={handleRetourMenu} className="mt-3 text-xs text-rose-500 hover:underline">
            ← Retour au menu
          </button>
        )}
      </div>
    </div>
  )
})

export default SakuraAssistant
