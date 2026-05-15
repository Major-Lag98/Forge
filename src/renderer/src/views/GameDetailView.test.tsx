// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GameDetailView } from './GameDetailView'
import type { Game } from '../../../shared/types'

const game: Game = {
  id: 'sample-game',
  name: 'Sample Game',
  version: '1.0.0',
  description: 'A sample game.',
  platform: 'windows-x64',
  url: 'https://example.com/sample-game.zip',
  sha256: '0'.repeat(64),
  size_bytes: 100,
  executable: 'sample-game.exe'
}

const noop = (): void => {}

describe('GameDetailView', () => {
  it('renders the game name as the title heading', () => {
    render(
      <GameDetailView
        game={game}
        status={{ kind: 'idle' }}
        onInstall={noop}
        onLaunch={noop}
        onUninstall={noop}
      />
    )
    expect(screen.queryByRole('heading', { name: 'Sample Game' })).not.toBeNull()
  })

  it('renders the description text', () => {
    render(
      <GameDetailView
        game={game}
        status={{ kind: 'idle' }}
        onInstall={noop}
        onLaunch={noop}
        onUninstall={noop}
      />
    )
    expect(screen.queryByText('A sample game.')).not.toBeNull()
  })

  it('shows an Install button when idle and fires onInstall on click', async () => {
    const onInstall = vi.fn()
    const user = userEvent.setup()
    render(
      <GameDetailView
        game={game}
        status={{ kind: 'idle' }}
        onInstall={onInstall}
        onLaunch={noop}
        onUninstall={noop}
      />
    )
    await user.click(screen.getByRole('button', { name: /^install$/i }))
    expect(onInstall).toHaveBeenCalled()
  })

  it('shows a generic Installing… button while installing without phase or percent', () => {
    render(
      <GameDetailView
        game={game}
        status={{ kind: 'installing' }}
        onInstall={noop}
        onLaunch={noop}
        onUninstall={noop}
      />
    )
    const button = screen.getByRole('button', { name: /^installing…$/i })
    expect(button.hasAttribute('disabled')).toBe(true)
  })

  it('shows Downloading… <percent>% with a matching fill during the download phase', () => {
    render(
      <GameDetailView
        game={game}
        status={{ kind: 'installing', phase: 'download', percent: 42 }}
        onInstall={noop}
        onLaunch={noop}
        onUninstall={noop}
      />
    )
    const button = screen.getByRole('button', { name: /downloading… 42%/i })
    expect(button.hasAttribute('disabled')).toBe(true)
    expect(button.className).toContain('game-action-progress')
    expect((button as HTMLElement).style.getPropertyValue('--progress-fill')).toBe('42%')
  })

  it('shows Verifying… with a full bar during the verify phase', () => {
    render(
      <GameDetailView
        game={game}
        status={{ kind: 'installing', phase: 'verify', percent: 100 }}
        onInstall={noop}
        onLaunch={noop}
        onUninstall={noop}
      />
    )
    const button = screen.getByRole('button', { name: /^verifying…$/i })
    expect(button.hasAttribute('disabled')).toBe(true)
    expect((button as HTMLElement).style.getPropertyValue('--progress-fill')).toBe('100%')
  })

  it('shows Extracting… <percent>% with a matching fill during the extract phase', () => {
    render(
      <GameDetailView
        game={game}
        status={{ kind: 'installing', phase: 'extract', percent: 35 }}
        onInstall={noop}
        onLaunch={noop}
        onUninstall={noop}
      />
    )
    const button = screen.getByRole('button', { name: /extracting… 35%/i })
    expect(button.hasAttribute('disabled')).toBe(true)
    expect((button as HTMLElement).style.getPropertyValue('--progress-fill')).toBe('35%')
  })

  it('shows a Play button when installed and fires onLaunch on click', async () => {
    const onLaunch = vi.fn()
    const user = userEvent.setup()
    render(
      <GameDetailView
        game={game}
        status={{ kind: 'installed', executable_path: 'C:/x/m.exe' }}
        onInstall={noop}
        onLaunch={onLaunch}
        onUninstall={noop}
      />
    )
    await user.click(screen.getByRole('button', { name: /play/i }))
    expect(onLaunch).toHaveBeenCalled()
  })

  it('shows the error message and an Install button when in error state', () => {
    render(
      <GameDetailView
        game={game}
        status={{ kind: 'error', message: 'SHA-256 mismatch' }}
        onInstall={noop}
        onLaunch={noop}
        onUninstall={noop}
      />
    )
    expect(screen.queryByRole('button', { name: /install/i })).not.toBeNull()
    expect(screen.queryByText('SHA-256 mismatch')).not.toBeNull()
  })

  it('hides the Uninstall button when not installed', () => {
    render(
      <GameDetailView
        game={game}
        status={{ kind: 'idle' }}
        onInstall={noop}
        onLaunch={noop}
        onUninstall={noop}
      />
    )
    expect(screen.queryByRole('button', { name: /uninstall/i })).toBeNull()
  })

  it('shows an Uninstall button when installed and fires onUninstall on the second click', async () => {
    const onUninstall = vi.fn()
    const user = userEvent.setup()
    render(
      <GameDetailView
        game={game}
        status={{ kind: 'installed', executable_path: 'C:/x/m.exe' }}
        onInstall={noop}
        onLaunch={noop}
        onUninstall={onUninstall}
      />
    )

    const button = screen.getByRole('button', { name: /^uninstall$/i })
    await user.click(button)
    expect(onUninstall).not.toHaveBeenCalled()

    const confirmButton = screen.getByRole('button', { name: /confirm uninstall\?/i })
    await user.click(confirmButton)
    expect(onUninstall).toHaveBeenCalledTimes(1)
  })

  it('shows a disabled Uninstalling… button while uninstalling', () => {
    render(
      <GameDetailView
        game={game}
        status={{ kind: 'uninstalling' }}
        onInstall={noop}
        onLaunch={noop}
        onUninstall={noop}
      />
    )
    const button = screen.getByRole('button', { name: /uninstalling/i })
    expect(button.hasAttribute('disabled')).toBe(true)
  })

  it('shows last_launch_error below the Play button when set', () => {
    render(
      <GameDetailView
        game={game}
        status={{
          kind: 'installed',
          executable_path: 'C:/x/m.exe',
          last_launch_error: 'Game exited with code 1'
        }}
        onInstall={noop}
        onLaunch={noop}
        onUninstall={noop}
      />
    )
    expect(screen.queryByText('Game exited with code 1')).not.toBeNull()
    expect(screen.queryByRole('button', { name: /play/i })).not.toBeNull()
  })

  it('does not render an error paragraph for a clean installed state', () => {
    render(
      <GameDetailView
        game={game}
        status={{ kind: 'installed', executable_path: 'C:/x/m.exe' }}
        onInstall={noop}
        onLaunch={noop}
        onUninstall={noop}
      />
    )
    expect(screen.queryByRole('alert')).toBeNull()
  })
})
