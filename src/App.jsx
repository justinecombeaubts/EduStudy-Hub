import { useEffect, useMemo, useRef, useState } from 'react'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import WelcomeBanner from './components/WelcomeBanner'
import AgendaView from './components/AgendaView'
import StudyView from './components/StudyView'
import DictionaryView from './components/DictionaryView'
import SakuraAssistant from './components/sakura/SakuraAssistant'
import mockCourses from './data/mockCourses.json'
import mockNotes from './data/mockNotes.json'
import mockFlashcards from './data/mockFlashcards.json'
import { useSupabaseStore } from './utils/useSupabaseStore'
import { getCoursesInWeek } from './utils/agendaDates'
import { migrateLegacyFiches } from './utils/migrateFiches'

// Fiches Coin Study par défaut (premier lancement, sans donnée locale à migrer) : converties
// vers le modèle unifié (voir migrateFiches.js) — pas de courseId, pas encore liées à un créneau.
const DEFAULT_FICHES = mockNotes.map((n) => ({
  id: `note-${n.id}`,
  courseId: null,
  titre: n.titre,
  ue: n.ue,
  theme: n.theme,
  statut: n.statut,
  contenu: n.contenu,
  date: n.date ?? null,
}))

const FILTER_TYPES_AGENDA = ['Tout', 'Cours', 'UE']
const FILTER_TYPES_STUDY = ['Tout', 'Cours', 'UE', 'Thème']

function App() {
  const [activeItem, setActiveItem] = useState('agenda')
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('Tout')
  const [filterValue, setFilterValue] = useState(null)
  const isAgenda = activeItem === 'agenda'
  const isDictionnaire = activeItem === 'dictionnaire'

  // Fiches : un seul store pour l'Agenda et le Coin Study (même donnée, voir migrateFiches.js).
  // Persistées en BDD Supabase (cross-device), avec repli/cache LocalStorage automatique en cas
  // d'absence de config ou de coupure réseau (AUDIT.md J4, voir useSupabaseStore.js) ; migration
  // silencieuse depuis les deux anciens stores LocalStorage séparés si présents, sinon jeu de
  // données fictives par défaut.
  const [fiches, setFiches] = useSupabaseStore('fiches', migrateLegacyFiches() ?? DEFAULT_FICHES)

  // Professeur Sakura (AUDIT.md J3) : decks de flashcards et QCM générés par l'IA, persistés
  // séparément des fiches — même mécanique de stockage (Supabase + repli local), stores distincts
  // par forme de donnée différente (voir plan J3). `sakuraRequest` (ci-dessous) permet d'ouvrir
  // Sakura pré-rempli ou directement sur un deck/QCM existant depuis NoteModal.
  const [flashcards, setFlashcards] = useSupabaseStore('flashcards', mockFlashcards)
  const [qcm, setQcm] = useSupabaseStore('qcm', [])
  // `sakuraRequest` unifie 3 façons d'ouvrir Sakura depuis une fiche (AUDIT.md J4 — retour
  // formateur "flashcards/QCM accessibles depuis la fiche sans repasser par l'agent") : générer de
  // nouvelles flashcards (seul cas qui a réellement besoin du panel — appel IA), ou aller directement
  // au mode entraînement d'un deck/QCM déjà généré pour cette fiche. Nonce unique à chaque demande
  // pour redéclencher l'effet même en cliquant deux fois sur la même fiche/le même deck.
  const [sakuraRequest, setSakuraRequest] = useState(null)
  // Bouton "Professeur Sakura" désormais dans Sidebar (même colonne que Agenda/Coin Study) : on
  // pilote l'ouverture du panel via une ref plutôt que de faire remonter tout l'état d'ouverture.
  const sakuraRef = useRef(null)

  function handleGenererFlashcards(ficheId) {
    setSakuraRequest({ mode: 'generate-flashcards', ficheId, nonce: Date.now() })
  }

  function handleOuvrirDeck(deckId) {
    setSakuraRequest({ mode: 'open-deck', deckId, nonce: Date.now() })
  }

  function handleOuvrirQcm(qcmId) {
    setSakuraRequest({ mode: 'open-qcm', qcmId, nonce: Date.now() })
  }

  // Bandeau d'accueil "X fiches en attente" (AUDIT.md J4 — retour formateur : le clic changeait bien
  // d'écran mais n'appliquait aucun filtre). `studyStatutRequest` est consommé par StudyView.
  const [studyStatutRequest, setStudyStatutRequest] = useState(null)

  function handleVoirFichesEnAttente() {
    setActiveItem('coin-study')
    setStudyStatutRequest({ statut: 'En attente', nonce: Date.now() })
  }

  // La recherche/les filtres ne portent pas le même sens des deux côtés (UE/Thème) : on repart propre.
  useEffect(() => {
    setSearch('')
    setFilterType('Tout')
    setFilterValue(null)
  }, [activeItem])

  const availableFilterTypes = isAgenda ? FILTER_TYPES_AGENDA : FILTER_TYPES_STUDY
  // mockCourses.length compterait les 72 créneaux de toute l'année : on affiche la charge de la semaine réelle en cours.
  const coursesCetteSemaine = useMemo(() => getCoursesInWeek(new Date(), mockCourses).length, [])
  // Dictionnaire (AUDIT.md J2 Tâche 6) : compte les définitions déjà extraites par l'Écriture
  // magique sur toutes les fiches (fiche.redactionIA.definitions), pour le badge du Header.
  const totalDefinitions = useMemo(
    () => fiches.reduce((total, f) => total + (f.redactionIA?.definitions?.length ?? 0), 0),
    [fiches]
  )

  const filterValueOptions = useMemo(() => {
    if (filterType === 'UE') {
      const source = isAgenda ? mockCourses : fiches
      return Array.from(new Set(source.map((item) => item.ue))).sort()
    }
    if (filterType === 'Thème' && !isAgenda) {
      return Array.from(new Set(fiches.filter((f) => f.theme).map((item) => item.theme))).sort()
    }
    return []
  }, [filterType, isAgenda, fiches])

  function handleFilterTypeChange(type) {
    setFilterType(type)
    setFilterValue(null)
  }

  return (
    <div className="min-h-screen flex bg-app">
      <Sidebar activeItem={activeItem} onSelect={setActiveItem} onOpenSakura={() => sakuraRef.current?.open()} />

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title={isAgenda ? 'Agenda' : isDictionnaire ? 'Dictionnaire' : 'Coin Study'}
          badgeText={
            isAgenda
              ? `${coursesCetteSemaine} créneaux cette semaine`
              : isDictionnaire
                ? `${totalDefinitions} définitions au total`
                : `${fiches.length} fiches au total`
          }
          search={search}
          onSearchChange={setSearch}
          filterType={filterType}
          onFilterTypeChange={handleFilterTypeChange}
          availableFilterTypes={availableFilterTypes}
          filterValue={filterValue}
          onFilterValueChange={setFilterValue}
          filterValueOptions={filterValueOptions}
        />

        <main className="flex-1 p-4 md:p-8 space-y-6">
          {isAgenda ? (
            <>
              <WelcomeBanner fiches={fiches} onVoirFichesEnAttente={handleVoirFichesEnAttente} />
              <AgendaView
                search={search}
                filterType={filterType}
                filterValue={filterValue}
                fiches={fiches}
                onFichesChange={setFiches}
              />
            </>
          ) : isDictionnaire ? (
            <DictionaryView
              search={search}
              filterType={filterType}
              filterValue={filterValue}
              fiches={fiches}
              onFichesChange={setFiches}
              onGenererFlashcards={handleGenererFlashcards}
              flashcards={flashcards}
              qcm={qcm}
              onOuvrirDeck={handleOuvrirDeck}
              onOuvrirQcm={handleOuvrirQcm}
            />
          ) : (
            <StudyView
              search={search}
              filterType={filterType}
              filterValue={filterValue}
              fiches={fiches}
              onFichesChange={setFiches}
              onGenererFlashcards={handleGenererFlashcards}
              statutRequest={studyStatutRequest}
              flashcards={flashcards}
              qcm={qcm}
              onOuvrirDeck={handleOuvrirDeck}
              onOuvrirQcm={handleOuvrirQcm}
            />
          )}
        </main>
      </div>

      <SakuraAssistant
        ref={sakuraRef}
        fiches={fiches}
        flashcards={flashcards}
        onFlashcardsChange={setFlashcards}
        qcm={qcm}
        onQcmChange={setQcm}
        sakuraRequest={sakuraRequest}
      />
    </div>
  )
}

export default App
