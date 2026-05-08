import { type ReactNode } from 'react'
import type { Game } from '../../../shared/types'

interface ShellProps {
  games: Game[]
  selectedGameId: string | null
  onSelectGame: (gameId: string) => void
  onHome: () => void
  onSignOut: () => void
  children: ReactNode
}

export function Shell({
  games,
  selectedGameId,
  onSelectGame,
  onHome,
  onSignOut,
  children
}: ShellProps): React.JSX.Element {
  return (
    <div className="shell">
      <aside className="rail">
        <button type="button" className="rail-home" onClick={onHome} aria-label="Home">
          F
        </button>
        <div className="rail-games">
          {games.map((game, idx) => (
            <button
              key={game.id}
              type="button"
              className={`rail-tile${selectedGameId === game.id ? ' rail-tile-selected' : ''}`}
              onClick={() => onSelectGame(game.id)}
              aria-label={game.name}
              title={game.name}
            >
              {idx + 1}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="rail-signout"
          onClick={onSignOut}
          aria-label="Sign out"
          title="Sign out"
        >
          ⎋
        </button>
      </aside>
      <main className="main-pane">{children}</main>
    </div>
  )
}
