import { useEffect, useMemo, useState } from 'react'
import type { Game } from '../../../shared/types'
import type { GameInstallStatus } from '../App'

const SCREENSHOT_ROTATE_MS = 7000

interface GameDetailViewProps {
  game: Game
  status: GameInstallStatus
  onInstall: () => void
  onLaunch: () => void
  onUninstall: () => void
}

type BgState = {
  index: number
  layer: 'A' | 'B'
  images: { A: string | null; B: string | null }
}

export function GameDetailView({
  game,
  status,
  onInstall,
  onLaunch,
  onUninstall
}: GameDetailViewProps): React.JSX.Element {
  // Parent keys this component on game.id, so within a mount `game` is stable
  // and screenshots never changes — initial state and interval each run once.
  const screenshots = useMemo(() => game.screenshots ?? [], [game.screenshots])
  const hasScreenshots = screenshots.length > 0

  const [bg, setBg] = useState<BgState>(() => ({
    index: 0,
    layer: 'A',
    images: { A: screenshots[0] ?? null, B: null }
  }))

  useEffect(() => {
    if (screenshots.length <= 1) return
    const interval = setInterval(() => {
      setBg((prev) => {
        const nextIndex = (prev.index + 1) % screenshots.length
        const nextLayer = prev.layer === 'A' ? 'B' : 'A'
        return {
          index: nextIndex,
          layer: nextLayer,
          images: { ...prev.images, [nextLayer]: screenshots[nextIndex] }
        }
      })
    }, SCREENSHOT_ROTATE_MS)
    return () => clearInterval(interval)
  }, [screenshots])

  return (
    <div className="game-detail-container">
      {hasScreenshots && (
        <>
          <div
            className={`game-bg-layer${bg.layer === 'A' ? ' game-bg-layer-active' : ''}`}
            style={{ backgroundImage: bg.images.A ? `url("${bg.images.A}")` : undefined }}
            aria-hidden
          />
          <div
            className={`game-bg-layer${bg.layer === 'B' ? ' game-bg-layer-active' : ''}`}
            style={{ backgroundImage: bg.images.B ? `url("${bg.images.B}")` : undefined }}
            aria-hidden
          />
          <div className="game-bg-overlay" aria-hidden />
        </>
      )}
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
