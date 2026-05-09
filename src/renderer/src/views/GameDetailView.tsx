import { useState } from 'react'
import type { Game } from '../../../shared/types'
import type { GameInstallStatus } from '../App'

interface GameDetailViewProps {
  game: Game
  status: GameInstallStatus
  onInstall: () => void
  onLaunch: () => void
  onUninstall: () => void
}

export function GameDetailView({
  game,
  status,
  onInstall,
  onLaunch,
  onUninstall
}: GameDetailViewProps): React.JSX.Element {
  return (
    <div className="game-detail">
      <h1 className="game-title">{game.name}</h1>
      <ActionButton status={status} onInstall={onInstall} onLaunch={onLaunch} />
      <UninstallButton
        key={`${game.id}:${status.kind}`}
        status={status}
        onUninstall={onUninstall}
      />
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

function ActionButton({
  status,
  onInstall,
  onLaunch
}: ActionButtonProps): React.JSX.Element | null {
  if (status.kind === 'installing') {
    return (
      <button type="button" className="game-action" disabled>
        Installing…
      </button>
    )
  }
  if (status.kind === 'uninstalling') {
    return null
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

interface UninstallButtonProps {
  status: GameInstallStatus
  onUninstall: () => void
}

function UninstallButton({ status, onUninstall }: UninstallButtonProps): React.JSX.Element | null {
  // Confirm state resets whenever this component is keyed on game.id + status.kind
  // by the parent — no effect needed.
  const [confirming, setConfirming] = useState(false)

  if (status.kind === 'uninstalling') {
    return (
      <button type="button" className="game-uninstall" disabled>
        Uninstalling…
      </button>
    )
  }
  if (status.kind !== 'installed') return null

  const handleClick = (): void => {
    if (confirming) {
      onUninstall()
      setConfirming(false)
    } else {
      setConfirming(true)
    }
  }

  return (
    <button type="button" className="game-uninstall" onClick={handleClick}>
      {confirming ? 'Confirm uninstall?' : 'Uninstall'}
    </button>
  )
}
