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
      {(() => {
        const error =
          status.kind === 'error'
            ? status.message
            : status.kind === 'installed'
              ? status.last_launch_error
              : undefined
        return error ? (
          <p className="game-error" role="alert">
            {error}
          </p>
        ) : null
      })()}
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
    const { phase, percent } = status
    const pctText = typeof percent === 'number' ? ` ${percent}%` : ''
    let label: string
    let fill: string
    if (phase === 'download') {
      label = `Downloading…${pctText}`
      fill = typeof percent === 'number' ? `${percent}%` : '0%'
    } else if (phase === 'verify') {
      label = 'Verifying…'
      fill = '100%'
    } else if (phase === 'extract') {
      label = `Extracting…${pctText}`
      fill = typeof percent === 'number' ? `${percent}%` : '0%'
    } else {
      label = `Installing…${pctText}`
      fill = typeof percent === 'number' ? `${percent}%` : '0%'
    }
    return (
      <button
        type="button"
        className="game-action game-action-progress"
        disabled
        style={{ '--progress-fill': fill } as React.CSSProperties}
      >
        {label}
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
