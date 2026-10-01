import { useState } from 'react'
import { Sparkles, Loader2, AlertCircle, ArrowLeft, Check } from 'lucide-react'
import SakuraScopeSelector from './SakuraScopeSelector'
import SakuraReviewDecks from './SakuraReviewDecks'
import { genererFlashcards, ERREUR_MESSAGES } from '../../utils/genererFlashcards'

// Flux "Je veux créer des flashcards" (AUDIT.md J3 Tâche 13) : scope → generating → review → done.
function SakuraFlashcardsFlow({ fiches, prefillFicheIds, onEnregistrer, onRetourMenu }) {
  const [step, setStep] = useState('scope')
  const [ficheIds, setFicheIds] = useState(prefillFicheIds ?? [])
  const [enCours, setEnCours] = useState(false)
  const [erreur, setErreur] = useState(null)
  const [decks, setDecks] = useState([])

  async function handleGenerer() {
    setEnCours(true)
    setErreur(null)
    const fichesSelectionnees = fiches
      .filter((f) => ficheIds.includes(f.id))
      .map((f) => ({ id: f.id, titre: f.titre, ue: f.ue, theme: f.theme, contenu: f.contenu }))

    const resultat = await genererFlashcards({ fiches: fichesSelectionnees })
    setEnCours(false)

    if (!resultat.ok) {
      setErreur(ERREUR_MESSAGES[resultat.error] ?? ERREUR_MESSAGES.invalid_response)
      return
    }
    setDecks(resultat.decks)
    setStep('review')
  }

  function handleEnregistrer(decksConserves) {
    onEnregistrer(decksConserves)
    setStep('done')
  }

  if (step === 'review') {
    return <SakuraReviewDecks decks={decks} onEnregistrer={handleEnregistrer} onAnnuler={onRetourMenu} />
  }

  if (step === 'done') {
    return (
      <div className="space-y-3 text-center py-4">
        <Check className="w-8 h-8 text-rose-400 mx-auto" />
        <p className="text-sm text-heading">Flashcards enregistrées avec succès !</p>
        <button
          type="button"
          onClick={onRetourMenu}
          className="px-4 py-2 rounded-full text-sm font-medium bg-rose-300 text-on-accent hover:bg-rose-400 shadow-md transition-colors"
        >
          Retour au menu
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={onRetourMenu}
        className="flex items-center gap-1 text-xs text-rose-500 hover:underline"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Retour au menu
      </button>

      <p className="text-sm text-muted">Sur quelle UE ou quel(s) cours veux-tu générer des flashcards ?</p>

      <SakuraScopeSelector fiches={fiches} prefillFicheIds={prefillFicheIds} onSelectionChange={setFicheIds} />

      {erreur && (
        <p className="flex items-start gap-1.5 text-xs text-red-600">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          {erreur}
        </p>
      )}

      <button
        type="button"
        onClick={handleGenerer}
        disabled={ficheIds.length === 0 || enCours}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-peach-100 text-orange-700 hover:bg-peach-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {enCours ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
        {enCours ? 'Génération en cours…' : '✨ Générer les flashcards'}
      </button>
    </div>
  )
}

export default SakuraFlashcardsFlow
