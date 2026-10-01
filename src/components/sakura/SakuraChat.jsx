import { useState } from 'react'
import { Send, AlertCircle, Loader2 } from 'lucide-react'
import { envoyerMessageSakura, ERREUR_MESSAGES } from '../../utils/sakuraChat'

// Mode "Discuter" (AUDIT.md J3 Tâche 15) : chat libre avec Professeur Sakura, un appel synchrone au
// webhook Make par message envoyé (historique court transmis pour le contexte, voir sakuraChat.js).
function SakuraChat() {
  const [messages, setMessages] = useState([])
  const [saisie, setSaisie] = useState('')
  const [envoiEnCours, setEnvoiEnCours] = useState(false)
  const [erreur, setErreur] = useState(null)

  async function handleEnvoyer(e) {
    e.preventDefault()
    const texte = saisie.trim()
    if (!texte || envoiEnCours) return

    const historique = messages
    const nouveauxMessages = [...messages, { role: 'user', contenu: texte }]
    setMessages(nouveauxMessages)
    setSaisie('')
    setErreur(null)
    setEnvoiEnCours(true)

    const resultat = await envoyerMessageSakura({ message: texte, historique })
    setEnvoiEnCours(false)

    if (!resultat.ok) {
      setErreur(ERREUR_MESSAGES[resultat.error] ?? ERREUR_MESSAGES.invalid_response)
      return
    }
    setMessages((prev) => [...prev, { role: 'assistant', contenu: resultat.reponse }])
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 space-y-2 overflow-y-auto pr-1 min-h-[12rem] max-h-72">
        {messages.length === 0 && (
          <p className="text-xs text-muted">
            🌸 Pose-moi une question sur tes cours, je suis là pour discuter !
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-snug ${
                m.role === 'user'
                  ? 'bg-rose-300 text-on-accent rounded-br-sm'
                  : 'bg-app border border-line text-heading rounded-bl-sm'
              }`}
            >
              {m.contenu}
            </div>
          </div>
        ))}
        {envoiEnCours && (
          <div className="flex justify-start">
            <div className="px-3 py-2 rounded-2xl bg-app border border-line text-rose-400">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
          </div>
        )}
      </div>

      {erreur && (
        <p className="flex items-start gap-1.5 text-xs text-red-600 pt-2">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          {erreur}
        </p>
      )}

      <form onSubmit={handleEnvoyer} className="flex items-center gap-2 pt-3">
        <input
          type="text"
          value={saisie}
          onChange={(e) => setSaisie(e.target.value)}
          placeholder="Écris ton message…"
          className="flex-1 px-3 py-2 rounded-xl bg-app border border-line text-sm text-heading placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-rose-300"
        />
        <button
          type="submit"
          disabled={!saisie.trim() || envoiEnCours}
          aria-label="Envoyer"
          className="p-2 rounded-xl bg-rose-300 text-on-accent hover:bg-rose-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  )
}

export default SakuraChat
