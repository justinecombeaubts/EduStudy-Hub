import { useRef, useState } from 'react'
import { Link2, Paperclip, ExternalLink, X, Plus } from 'lucide-react'

// Stockage en localStorage (data URL base64) : on limite la taille pour éviter de saturer le
// quota du navigateur (~5-10 Mo au total, partagé entre toutes les fiches).
const TAILLE_MAX_OCTETS = 2 * 1024 * 1024 // 2 Mo par fichier

function formatTaille(octets) {
  if (octets < 1024) return `${octets} o`
  const ko = octets / 1024
  if (ko < 1024) return `${Math.round(ko)} Ko`
  return `${(ko / 1024).toFixed(1)} Mo`
}

function lireFichier(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve({ nom: file.name, type: file.type, taille: file.size, dataUrl: reader.result })
    reader.onerror = () => reject(new Error('lecture'))
    reader.readAsDataURL(file)
  })
}

// Champs partagés "Liens" + "Fichiers joints" (plusieurs de chaque) — utilisés par
// CourseFicheModal (Agenda), NoteModal (Coin Study) et LivrableModal (Exercices & Livrables).
// Contrôlé : `liens` = string[], `fichiers` = [{ nom, type, taille, dataUrl }].
function PieceJointeFields({ liens, onLiensChange, fichiers, onFichiersChange }) {
  const inputRef = useRef(null)
  const [erreur, setErreur] = useState(null)

  function updateLien(index, valeur) {
    onLiensChange(liens.map((l, i) => (i === index ? valeur : l)))
  }

  async function handleFileSelect(e) {
    const files = Array.from(e.target.files ?? [])
    e.target.value = '' // permet de resélectionner le même fichier plus tard si besoin
    if (!files.length) return
    setErreur(null)

    const tropGros = files.filter((f) => f.size > TAILLE_MAX_OCTETS)
    const acceptes = files.filter((f) => f.size <= TAILLE_MAX_OCTETS)
    if (tropGros.length) {
      setErreur(`Ignoré (max ${formatTaille(TAILLE_MAX_OCTETS)} par fichier) : ${tropGros.map((f) => f.name).join(', ')}`)
    }
    try {
      const lus = await Promise.all(acceptes.map(lireFichier))
      if (lus.length) onFichiersChange([...fichiers, ...lus])
    } catch {
      setErreur('Impossible de lire un des fichiers — réessaie.')
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="flex items-center gap-1.5 text-sm font-medium text-muted mb-1">
          <Link2 className="w-3.5 h-3.5" />
          Liens <span className="text-muted font-normal">(optionnel)</span>
        </label>
        <div className="space-y-2">
          {liens.map((lien, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <input
                type="url"
                value={lien}
                onChange={(e) => updateLien(i, e.target.value)}
                placeholder="https://..."
                className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-app border border-line text-sm text-heading placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-rose-300"
              />
              {lien.trim() && (
                <a
                  href={lien}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Ouvrir le lien"
                  title="Ouvrir le lien"
                  className="p-2 rounded-lg text-rose-400 hover:bg-rose-50 hover:text-rose-600 transition-colors shrink-0"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
              <button
                type="button"
                onClick={() => onLiensChange(liens.filter((_, j) => j !== i))}
                aria-label="Retirer ce lien"
                className="p-2 rounded-lg text-rose-300 hover:bg-rose-50 hover:text-rose-600 transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => onLiensChange([...liens, ''])}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-dashed border-line text-sm text-rose-500 hover:bg-rose-50 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Ajouter un lien
          </button>
        </div>
      </div>

      <div>
        <label className="flex items-center gap-1.5 text-sm font-medium text-muted mb-1">
          <Paperclip className="w-3.5 h-3.5" />
          Fichiers joints <span className="text-muted font-normal">(optionnel)</span>
        </label>

        <div className="space-y-2">
          {fichiers.map((fichier, i) => (
            <div
              key={`${fichier.nom}-${i}`}
              className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl border border-line bg-rose-50/50"
            >
              <a
                href={fichier.dataUrl}
                download={fichier.nom}
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
                onClick={() => onFichiersChange(fichiers.filter((_, j) => j !== i))}
                aria-label={`Retirer ${fichier.nom}`}
                className="p-1 rounded-lg text-rose-300 hover:bg-rose-100 hover:text-rose-600 transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-dashed border-line text-sm text-rose-500 hover:bg-rose-50 transition-colors"
          >
            <Plus className="w-4 h-4" />
            {fichiers.length ? 'Ajouter d’autres fichiers' : 'Ajouter des fichiers'}
          </button>
        </div>
        <input ref={inputRef} type="file" multiple onChange={handleFileSelect} className="hidden" />

        {erreur && <p className="text-xs text-red-600 mt-1">{erreur}</p>}
      </div>
    </div>
  )
}

export default PieceJointeFields
