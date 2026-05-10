import { useEffect, useState } from 'react'
import { LoginView } from './views/LoginView'
import { Shell } from './views/Shell'
import { WelcomeView } from './views/WelcomeView'
import { GameDetailView } from './views/GameDetailView'
import type { Game } from '../../shared/types'

export type GameInstallStatus =
  | { kind: 'idle' }
  | { kind: 'installing'; percent?: number }
  | { kind: 'installed'; executable_path: string; last_launch_error?: string }
  | { kind: 'uninstalling' }
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

  useEffect(() => {
    return window.api.onInstallProgress((gameId, percent) => {
      setState((prev) => {
        if (prev.view === 'login') return prev
        const current = prev.session.installs[gameId]
        // Only apply progress while we're in the installing state for that game.
        if (!current || current.kind !== 'installing') return prev
        return {
          ...prev,
          session: {
            ...prev.session,
            installs: {
              ...prev.session.installs,
              [gameId]: { kind: 'installing', percent }
            }
          }
        }
      })
    })
  }, [])

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
    updateInstallStatus(gameId, { kind: 'installing', percent: 0 })
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

  const uninstallGame = async (gameId: string): Promise<void> => {
    updateInstallStatus(gameId, { kind: 'uninstalling' })
    const result = await window.api.uninstall(gameId)
    if (result.ok) {
      updateInstallStatus(gameId, { kind: 'idle' })
    } else {
      updateInstallStatus(gameId, { kind: 'error', message: result.error })
    }
  }

  const launchGame = async (gameId: string): Promise<void> => {
    if (state.view === 'login') return
    const current = state.session.installs[gameId]
    if (!current || current.kind !== 'installed') return
    const executable_path = current.executable_path

    // Clear any previous launch error while we're trying.
    updateInstallStatus(gameId, { kind: 'installed', executable_path })

    const result = await window.api.launch(gameId)

    let last_launch_error: string | undefined
    if (!result.ok) {
      last_launch_error = `Launch failed: ${result.error}`
    } else if (result.exit_code !== 0) {
      last_launch_error = `Game exited with code ${result.exit_code}`
    }

    updateInstallStatus(gameId, { kind: 'installed', executable_path, last_launch_error })
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
          onUninstall={() => uninstallGame(selectedGame.id)}
        />
      )}
    </Shell>
  )
}

export default App
