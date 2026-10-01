import { useState } from 'react'
import { Sparkles, Loader2, AlertCircle, ArrowLeft, Check } from 'lucide-react'
import SakuraScopeSelector from './SakuraScopeSelector'
import SakuraReviewQcm from './SakuraReviewQcm'
import { genererQcm, ERREUR_MESSAGES } from '../../utils/genererQcm'

// Flux "Je veux créer un QCM" (AUDIT.md J3 Tâche 14) : params → scope → generating → review → done.
// Pas de mode "passer le QCM" aujourd'hui (décision de cadrage) — uniquement génération + relecture +
// sauvegarde dans le store `edustudy-hub:qcm`.
function SakuraQcmFlow({ fiches, prefillFicheIds, onEnregistrer, onRetourMenu }) {
  const [step, setStep] = useState('params')
  const [nombreQuestions, setNombreQuestions] = useState(10)
  const [avecLimiteTemps, setAvecLimiteTemps] = useState(false)
  const [dureeLimiteMinutes, setDureeLimiteMinutes] = useState(15)
  const [ficheIds, setFicheIds] = useState(prefillFicheIds ?? [])
  const [enCours, setEnCours] = useState(false)
  const [erreur, setErreur] = useState(null)
  const [questions, setQuestions] = useState([])

  async function handleGenerer() {
    setEnCours(true)
    setErreur(null)
    const fichesSelectionnees = fiches
      .filter((f) => ficheIds.includes(f.id))
      .map((f) => ({ id: f.id, titre: f.titre, ue: f.ue, theme: f.theme, contenu: f.contenu }))

    const resultat = await genererQcm({
      fiches: fichesSelectionnees,
      nombreQuestions,
      dureeLimiteMinutes: avecLimiteTemps ? dureeLimiteMinutes : null,
    })
    setEnCours(false)

    if (!resultat.ok) {
      setErreur(ERREUR_MESSAGES[resultat.error] ?? ERREUR_MESSAGES.invalid_response)
      return
    }
    setQuestions(resultat.questions)
    setStep('review')
  }

  function handleEnregistrer() {
    const uesSelectionnees = Array.from(new Set(fiches.filter((f) => ficheIds.includes(f.id)).map((f) => f.ue)))
    const titre = uesSelectionnees.length === 1 ? `QCM — ${uesSelectionnees[0]}` : 'QCM — plusieurs UE'
    onEnregistrer({
      id: `qcm-${Date.now()}`,
      titre,
      ue: uesSelectionnees.length === 1 ? uesSelectionnees[0] : null,
      theme: null,
      courseId: null,
      sourceFicheIds: ficheIds,
      nombreQuestions,
      dureeLimiteMinutes: avecLimiteTemps ? dureeLimiteMinutes : null,
      questions,
      generatedByAI: true,
      createdAt: new Date().toISOString(),
    })
    setStep('done')
  }

  if (step === 'review') {
    return (
      <SakuraReviewQcm
        questions={questions}
        onEnregistrer={handleEnregistrer}
        onRegenerer={handleGenerer}
        onAnnuler={onRetourMenu}
      />
    )
  }

  if (step === 'done') {
    return (
      <div className="space-y-3 text-center py-4">
        <Check className="w-8 h-8 text-rose-400 mx-auto" />
        <p className="text-sm text-heading">QCM enregistré avec succès !</p>
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

  if (step === 'scope') {
    return (
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => setStep('params')}
          className="flex items-center gap-1 text-xs text-rose-500 hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Retour
        </button>

        <p className="text-sm text-muted">Sur quelle UE ou quel(s) cours veux-tu générer ce QCM ?</p>

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
          {enCours ? 'Génération en cours…' : '✨ Générer le QCM'}
        </button>
      </div>
    )
  }

  // step === 'params'
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

      <div>
        <label htmlFor="qcm-nombre" className="block text-sm font-medium text-muted mb-1">
          Nombre de questions
        </label>
        <input
          id="qcm-nombre"
          type="number"
          min={1}
          max={30}
          value={nombreQuestions}
          onChange={(e) => setNombreQuestions(Math.max(1, Math.min(30, Number(e.target.value) || 1)))}
          className="w-full px-3 py-2 rounded-xl bg-app border border-line text-sm text-heading focus:outline-none focus:ring-2 focus:ring-rose-300"
        />
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm text-muted">
          <input
            type="checkbox"
            checked={avecLimiteTemps}
            onChange={(e) => setAvecLimiteTemps(e.target.checked)}
            className="w-4 h-4 rounded border-rose-300 text-rose-500 focus:ring-rose-300"
          />
          Y a-t-il une limite de temps ?
        </label>

        {avecLimiteTemps && (
          <div>
            <label htmlFor="qcm-duree" className="block text-xs font-medium text-muted mb-1">
              Durée (minutes)
            </label>
            <input
              id="qcm-duree"
              type="number"
              min={1}
              max={180}
              value={dureeLimiteMinutes}
              onChange={(e) => setDureeLimiteMinutes(Math.max(1, Math.min(180, Number(e.target.value) || 1)))}
              className="w-full px-3 py-2 rounded-xl bg-app border border-line text-sm text-heading focus:outline-none focus:ring-2 focus:ring-rose-300"
            />
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => setStep('scope')}
        className="w-full px-4 py-2 rounded-full text-sm font-medium bg-rose-300 text-on-accent hover:bg-rose-400 shadow-md transition-colors"
      >
        Suivant
      </button>
    </div>
  )
}

export default SakuraQcmFlow
