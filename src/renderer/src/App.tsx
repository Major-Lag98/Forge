import { useState } from 'react'
import { LoginView } from './views/LoginView'
import { Shell } from './views/Shell'
import { WelcomeView } from './views/WelcomeView'
import { GameDetailView } from './views/GameDetailView'
import type { Game } from '../../shared/types'

export type GameInstallStatus =
  | { kind: 'idle' }
  | { kind: 'installing' }
  | { kind: 'installed'; executable_path: string }
  | { kind: 'error'; message: string }

type Session = {
  currentUser: string
  games: Game[]
  installs: Record<string, GameInstallStatus>
}

type AppState =
  | { view: 'login' }
  | { view: 'welcome'; session: Session }
  | { view: 'gameDetail'; session: Session; selectedGameId: string }

function App(): React.JSX.Element {
  const [state, setState] = useState<AppState>({ view: 'login' })

  const updateInstallStatus = (gameId: string, status: GameInstallStatus): void => {
    setState((prev) => {
      if (prev.view === 'login') return prev
      return {
        ...prev,
        session: {
          ...prev.session,
          installs: { ...prev.session.installs, [gameId]: status }
        }
      }
    })
  }

  const signIn = async (currentUser: string): Promise<void> => {
    const [manifest, installed] = await Promise.all([
      window.api.catalog(),
      window.api.installedGames()
    ])

    const installs: Record<string, GameInstallStatus> = {}
    for (const game of manifest.games) {
      installs[game.id] = { kind: 'idle' }
    }
    for (const record of installed) {
      installs[record.id] = { kind: 'installed', executable_path: record.executable_path }
    }

    setState({
      view: 'welcome',
      session: { currentUser, games: manifest.games, installs }
    })
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

  const installGame = async (gameId: string): Promise<void> => {
    updateInstallStatus(gameId, { kind: 'installing' })
    const result = await window.api.install(gameId)
    if (result.ok) {
      updateInstallStatus(gameId, {
        kind: 'installed',
        executable_path: result.record.executable_path
      })
    } else {
      updateInstallStatus(gameId, { kind: 'error', message: result.error })
    }
  }

  const launchGame = async (gameId: string): Promise<void> => {
    await window.api.launch(gameId)
  }

  if (state.view === 'login') {
    return <LoginView onSignIn={signIn} />
  }

  const selectedGame =
    state.view === 'gameDetail'
      ? (state.session.games.find((g) => g.id === state.selectedGameId) ?? null)
      : null
  const selectedStatus =
    state.view === 'gameDetail'
      ? (state.session.installs[state.selectedGameId] ?? { kind: 'idle' })
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
      {selectedGame && selectedStatus && (
        <GameDetailView
          game={selectedGame}
          status={selectedStatus}
          onInstall={() => installGame(selectedGame.id)}
          onLaunch={() => launchGame(selectedGame.id)}
        />
      )}
    </Shell>
  )
}

export default App
