import { useState } from 'react'
import { LoginView } from './views/LoginView'
import { Shell } from './views/Shell'
import { WelcomeView } from './views/WelcomeView'
import { GameDetailView } from './views/GameDetailView'
import type { Game } from '../../shared/types'

type Session = { currentUser: string; games: Game[] }

type AppState =
  | { view: 'login' }
  | { view: 'welcome'; session: Session }
  | { view: 'gameDetail'; session: Session; selectedGameId: string }

function App(): React.JSX.Element {
  const [state, setState] = useState<AppState>({ view: 'login' })

  const signIn = async (currentUser: string): Promise<void> => {
    const manifest = await window.api.catalog()
    setState({ view: 'welcome', session: { currentUser, games: manifest.games } })
  }

  const signOut = (): void => setState({ view: 'login' })

  const goHome = (): void => {
    if (state.view === 'gameDetail') {
      setState({ view: 'welcome', session: state.session })
    }
  }

  const selectGame = (gameId: string): void => {
    if (state.view === 'welcome' || state.view === 'gameDetail') {
      setState({ view: 'gameDetail', session: state.session, selectedGameId: gameId })
    }
  }

  if (state.view === 'login') {
    return <LoginView onSignIn={signIn} />
  }

  const selectedGame =
    state.view === 'gameDetail'
      ? (state.session.games.find((g) => g.id === state.selectedGameId) ?? null)
      : null

  return (
    <Shell
      games={state.session.games}
      selectedGameId={state.view === 'gameDetail' ? state.selectedGameId : null}
      onSelectGame={selectGame}
      onHome={goHome}
      onSignOut={signOut}
    >
      {state.view === 'welcome' && <WelcomeView username={state.session.currentUser} />}
      {selectedGame && <GameDetailView game={selectedGame} />}
    </Shell>
  )
}

export default App
