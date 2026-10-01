import mockCourses from '../data/mockCourses.json'

// Migration ponctuelle : avant J2-bis, les fiches de cours (Agenda) et les fiches Coin Study
// vivaient dans deux stores localStorage séparés (`agenda-fiches` en objet {courseId: data},
// `coin-study-notes` en tableau). Elles sont désormais unifiées en un seul tableau de fiches,
// chacune liée ou non à un créneau via `courseId`. Cette fonction ne s'exécute que si le nouveau
// store (`edustudy-hub:fiches`) n'existe pas encore, et ne supprime pas les anciennes clés
// (filet de sécurité en cas de souci).
export function migrateLegacyFiches() {
  try {
    const legacyAgendaRaw = window.localStorage.getItem('edustudy-hub:agenda-fiches')
    const legacyNotesRaw = window.localStorage.getItem('edustudy-hub:coin-study-notes')
    if (!legacyAgendaRaw && !legacyNotesRaw) return null

    const legacyAgenda = legacyAgendaRaw ? JSON.parse(legacyAgendaRaw) : {}
    const legacyNotes = legacyNotesRaw ? JSON.parse(legacyNotesRaw) : []

    const normalizeStatut = (s) => {
      if (s === 'rédigée') return 'Rédigée'
      if (s === 'brouillon') return 'Brouillon'
      return s ?? 'Brouillon'
    }

    const fromAgenda = Object.entries(legacyAgenda).map(([courseId, data]) => {
      const course = mockCourses.find((c) => c.id === courseId)
      return {
        id: courseId,
        courseId,
        titre: data.titre ?? '',
        ue: data.ue ?? '',
        theme: data.theme ?? '',
        statut: normalizeStatut(data.statut),
        contenu: data.notes ?? data.contenu ?? '',
        date: course?.date ?? null,
      }
    })

    const fromNotes = legacyNotes.map((n) => ({
      // Préfixe pour garantir l'unicité face aux fiches liées à un cours (id = courseId) —
      // évite toute collision si un vieux courseId de test ressemble à un id de note (ex. "1").
      id: `note-${n.id}`,
      courseId: null,
      titre: n.titre ?? '',
      ue: n.ue ?? '',
      theme: n.theme ?? '',
      statut: normalizeStatut(n.statut),
      contenu: n.contenu ?? '',
      date: n.date ?? null,
    }))

    return [...fromNotes, ...fromAgenda]
  } catch {
    return null
  }
}
