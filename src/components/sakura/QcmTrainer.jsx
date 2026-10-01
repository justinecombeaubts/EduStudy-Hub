import { useState } from 'react'
import { ArrowRight, Check, X, RotateCcw, Sparkles, Trophy } from 'lucide-react'

// Mode "passer le QCM" (AUDIT.md J3 Tâche 14-bis) : une question à la fois, l'utilisateur choisit
// une option, valide, puis voit immédiatement la correction (bonne/mauvaise réponse + explication)
// avant de passer à la question suivante. Score final affiché en fin de parcours.
// Purement local (pas d'historique de tentatives sauvegardé aujourd'hui — juste jouer le QCM déjà
// généré/validé).
function QcmTrainer({ qcm, onQuitter }) {
  const [index, setIndex] = useState(0)
  const [selection, setSelection] = useState(null)
  const [valide, setValide] = useState(false)
  const [score, setScore] = useState(0)
  const [termine, setTermine] = useState(false)

  const question = qcm.questions[index]
  const derniereQuestion = index === qcm.questions.length - 1

  function handleChoisir(optionIndex) {
    if (valide) return // réponse déjà validée, plus modifiable avant "Suivant"
    setSelection(optionIndex)
  }

  function handleValider() {
    if (selection === null) return
    setValide(true)
    if (selection === question.bonneReponseIndex) setScore((s) => s + 1)
  }

  function handleSuivant() {
    if (derniereQuestion) {
      setTermine(true)
      return
    }
    setIndex((i) => i + 1)
    setSelection(null)
    setValide(false)
  }

  function handleRecommencer() {
    setIndex(0)
    setSelection(null)
    setValide(false)
    setScore(0)
    setTermine(false)
  }

  if (qcm.questions.length === 0) {
    return <p className="text-xs text-muted">Ce QCM ne contient aucune question.</p>
  }

  if (termine) {
    const pourcentage = Math.round((score / qcm.questions.length) * 100)
    return (
      <div className="space-y-4 text-center py-4">
        <Trophy className="w-8 h-8 text-rose-400 mx-auto" />
        <div>
          <p className="text-lg font-semibold text-heading">
            {score} / {qcm.questions.length}
          </p>
          <p className="text-xs text-muted mt-0.5">{pourcentage}% de bonnes réponses</p>
        </div>
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={handleRecommencer}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-rose-300 text-on-accent hover:bg-rose-400 shadow-md transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Recommencer
          </button>
        </div>
        <button type="button" onClick={onQuitter} className="text-xs text-rose-500 hover:underline">
          ← Retour à mes QCM
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted">
          Question {index + 1} / {qcm.questions.length}
        </p>
        {qcm.generatedByAI && (
          <span className="flex items-center gap-1 text-[10px] text-orange-500">
            <Sparkles className="w-3 h-3" />
            IA
          </span>
        )}
      </div>

      <div className="h-1 rounded-full bg-rose-100 overflow-hidden">
        <div
          className="h-full bg-rose-300 transition-all duration-200"
          style={{ width: `${((index + 1) / qcm.questions.length) * 100}%` }}
        />
      </div>

      <p className="text-sm text-heading leading-snug">{question.enonce}</p>

      <div className="space-y-1.5">
        {question.options.map((option, i) => {
          const estBonneReponse = i === question.bonneReponseIndex
          const estSelectionnee = i === selection

          let style = 'border-line hover:bg-rose-50'
          if (valide && estBonneReponse) style = 'border-green-300 bg-green-50 text-green-900'
          else if (valide && estSelectionnee) style = 'border-red-300 bg-red-50 text-red-900'
          else if (!valide && estSelectionnee) style = 'border-rose-300 bg-rose-50'

          return (
            <button
              key={i}
              type="button"
              onClick={() => handleChoisir(i)}
              disabled={valide}
              className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl border text-left text-sm transition-colors disabled:cursor-default ${style}`}
            >
              <span>{option}</span>
              {valide && estBonneReponse && <Check className="w-4 h-4 text-green-600 shrink-0" />}
              {valide && estSelectionnee && !estBonneReponse && <X className="w-4 h-4 text-red-600 shrink-0" />}
            </button>
          )
        })}
      </div>

      {valide && question.explication && (
        <p className="text-xs text-muted bg-rose-50/70 rounded-xl p-3 leading-snug">💡 {question.explication}</p>
      )}

      <div className="flex items-center justify-between gap-2">
        <button type="button" onClick={onQuitter} className="text-xs text-rose-500 hover:underline">
          ← Retour à mes QCM
        </button>

        {valide ? (
          <button
            type="button"
            onClick={handleSuivant}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-rose-300 text-on-accent hover:bg-rose-400 shadow-md transition-colors"
          >
            {derniereQuestion ? 'Voir mon score' : 'Suivant'}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleValider}
            disabled={selection === null}
            className="px-4 py-2 rounded-full text-sm font-medium bg-rose-300 text-on-accent hover:bg-rose-400 shadow-md disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Valider ma réponse
          </button>
        )}
      </div>
    </div>
  )
}

export default QcmTrainer
