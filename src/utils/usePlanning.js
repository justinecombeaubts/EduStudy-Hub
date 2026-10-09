import { useMemo } from 'react'
import creneaux from '../data/mockCourses.json'
import { useSupabaseStore } from './useSupabaseStore'

export const UE_EVENEMENT = 'Événement'
export const estEvenement = (c) => c?.ue === UE_EVENEMENT

// Planning = créneaux (date + horaires, `mockCourses.json`, vides par défaut) + affectations
// choisies à la main par l'étudiant (quel cours du catalogue occupe quel créneau), persistées
// dans le store "creneaux" (Supabase + repli LocalStorage, voir useSupabaseStore.js).
// Seuls les créneaux "Entreprise" récurrents restent pré-remplis (rythme d'alternance fixe).
// S'y ajoutent les événements libres créés par l'étudiant (nom, date, horaires, description),
// store "evenements" — même forme qu'un cours daté pour être affichés par les mêmes vues.
export function usePlanning() {
  const [affectations, setAffectations] = useSupabaseStore('creneaux', [])
  const [evenements, setEvenements] = useSupabaseStore('evenements', [])

  const courses = useMemo(() => {
    const parId = Object.fromEntries(affectations.map((a) => [a.id, a]))
    const slots = creneaux.map((slot) => {
      const a = parId[slot.id]
      if (a) return { ...slot, titre: a.titre, ue: a.ue }
      return { titre: null, ue: null, ...slot }
    })
    return [...slots, ...evenements.map((e) => ({ ...e, ue: UE_EVENEMENT }))]
  }, [affectations, evenements])

  // `cours` = { titre, ue } du catalogue, ou null pour libérer le créneau.
  function affecterCours(slotId, cours) {
    setAffectations((prev) => {
      const sans = prev.filter((a) => a.id !== slotId)
      return cours ? [...sans, { id: slotId, titre: cours.titre, ue: cours.ue }] : sans
    })
  }

  // Création ou mise à jour (même id) d'un événement.
  function enregistrerEvenement(evenement) {
    setEvenements((prev) =>
      prev.some((e) => e.id === evenement.id)
        ? prev.map((e) => (e.id === evenement.id ? evenement : e))
        : [...prev, evenement]
    )
  }

  function supprimerEvenement(id) {
    setEvenements((prev) => prev.filter((e) => e.id !== id))
  }

  return { courses, evenements, affecterCours, enregistrerEvenement, supprimerEvenement }
}
