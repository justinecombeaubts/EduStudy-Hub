// Pièces jointes multiples (liens + fichiers) d'une fiche ou d'un livrable.
// Rétrocompatible avec l'ancien modèle à un seul `lien` (string) / `fichier` (objet) par fiche.
export function lirePiecesJointes(item) {
  const liens = Array.isArray(item?.liens) ? item.liens : item?.lien ? [item.lien] : []
  const fichiers = Array.isArray(item?.fichiers) ? item.fichiers : item?.fichier ? [item.fichier] : []
  return { liens, fichiers }
}

// Nettoie avant sauvegarde (liens vides retirés) et supprime les anciens champs uniques.
export function ecrirePiecesJointes(item, { liens, fichiers }) {
  // eslint-disable-next-line no-unused-vars
  const { lien, fichier, ...reste } = item
  return { ...reste, liens: liens.map((l) => l.trim()).filter(Boolean), fichiers }
}

export function compterPiecesJointes(item) {
  const { liens, fichiers } = lirePiecesJointes(item)
  return { nbLiens: liens.length, nbFichiers: fichiers.length }
}
