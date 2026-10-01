import { useRef, useState } from 'react'
import { Link2, Paperclip, ExternalLink, X } from 'lucide-react'

// Stockage en localStorage (data URL base64) : on limite la taille pour éviter de saturer le
// quota du navigateur (~5-10 Mo au total, partagé entre toutes les fiches).
const TAILLE_MAX_OCTETS = 2 * 1024 * 1024 // 2 Mo

function formatTaille(octets) {
  if (octets < 1024) return `${octets} o`
  const ko = octets / 1024
  if (ko < 1024) return `${Math.round(ko)} Ko`
  return `${(ko / 1024).toFixed(1)} Mo`
}

// Champs partagés "Lien externe" + "Fichier joint" — utilisés par CourseFicheModal (Agenda) et
// NoteModal (Coin Study), même fiche, mêmes champs (voir AUDIT.md Tâche 8 — fusion des fiches).
function PieceJointeFields({ lien, onLienChange, fichier, onFichierChange }) {
  const inputRef = useRef(null)
  const [erreur, setErreur] = useState(null)

  function handleFileSelect(e) {
    const file = e.target.files?.[0]
    e.target.value = '' // permet de resélectionner le même fichier plus tard si besoin
    if (!file) return
    setErreur(null)
    if (file.size > TAILLE_MAX_OCTETS) {
      setErreur(`Fichier trop volumineux (max ${formatTaille(TAILLE_MAX_OCTETS)}).`)
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      onFichierChange({ nom: file.name, type: file.type, taille: file.size, dataUrl: reader.result })
    }
    reader.onerror = () => setErreur('Impossible de lire ce fichier — réessaie.')
    reader.readAsDataURL(file)
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="flex items-center gap-1.5 text-sm font-medium text-muted mb-1">
          <Link2 className="w-3.5 h-3.5" />
          Lien externe <span className="text-muted font-normal">(optionnel)</span>
        </label>
        <input
          type="url"
          value={lien}
          onChange={(e) => onLienChange(e.target.value)}
          placeholder="https://..."
          className="w-full px-3 py-2 rounded-xl bg-app border border-line text-sm text-heading placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-rose-300"
        />
        {lien.trim() && (
          <a
            href={lien}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-rose-500 hover:underline mt-1"
          >
            <ExternalLink className="w-3 h-3" />
            Ouvrir le lien
          </a>
        )}
      </div>

      <div>
        <label className="flex items-center gap-1.5 text-sm font-medium text-muted mb-1">
          <Paperclip className="w-3.5 h-3.5" />
          Fichier joint <span className="text-muted font-normal">(optionnel)</span>
        </label>

        {fichier ? (
          <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl border border-line bg-rose-50/50">
            <a
              href={fichier.dataUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-rose-800 hover:underline min-w-0"
            >
              <Paperclip className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{fichier.nom}</span>
              <span className="text-xs text-muted shrink-0">({formatTaille(fichier.taille)})</span>
            </a>
            <button
              type="button"
              onClick={() => onFichierChange(null)}
              aria-label="Retirer le fichier"
              className="p-1 rounded-lg text-rose-300 hover:bg-rose-100 hover:text-rose-600 transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-dashed border-line text-sm text-rose-500 hover:bg-rose-50 transition-colors"
          >
            <Paperclip className="w-4 h-4" />
            Choisir un fichier
          </button>
        )}
        <input ref={inputRef} type="file" onChange={handleFileSelect} className="hidden" />

        {erreur && <p className="text-xs text-red-600 mt-1">{erreur}</p>}
      </div>
    </div>
  )
}

export default PieceJointeFields
