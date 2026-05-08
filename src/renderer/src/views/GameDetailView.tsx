import type { Game } from '../../../shared/types'
import type { GameInstallStatus } from '../App'

interface GameDetailViewProps {
  game: Game
  status: GameInstallStatus
  onInstall: () => void
  onLaunch: () => void
}

export function GameDetailView({
  game,
  status,
  onInstall,
  onLaunch
}: GameDetailViewProps): React.JSX.Element {
  return (
    <div className="game-detail">
      <h1 className="game-title">{game.name}</h1>
      <ActionButton status={status} onInstall={onInstall} onLaunch={onLaunch} />
      {status.kind === 'error' && (
        <p className="game-error" role="alert">
          {status.message}
        </p>
      )}
      <p className="game-description">{game.description}</p>
    </div>
  )
}

interface ActionButtonProps {
  status: GameInstallStatus
  onInstall: () => void
  onLaunch: () => void
}

function ActionButton({ status, onInstall, onLaunch }: ActionButtonProps): React.JSX.Element {
  if (status.kind === 'installing') {
    return (
      <button type="button" className="game-action" disabled>
        Installing…
      </button>
    )
  }
  if (status.kind === 'installed') {
    return (
      <button type="button" className="game-action" onClick={onLaunch}>
        Play
      </button>
    )
  }
  return (
    <button type="button" className="game-action" onClick={onInstall}>
      Install
    </button>
  )
}
