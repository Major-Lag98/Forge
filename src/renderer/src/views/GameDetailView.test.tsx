// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GameDetailView } from './GameDetailView'
import type { Game } from '../../../shared/types'

const game: Game = {
  id: 'mindustry',
  name: 'Mindustry',
  version: '8.0',
  description: 'A factory game.',
  platform: 'windows-x64',
  url: 'https://example.com/mindustry.zip',
  sha256: '0'.repeat(64),
  size_bytes: 100,
  executable: 'Mindustry.exe'
}

const noop = (): void => {}

describe('GameDetailView', () => {
  it('renders the game name as the title heading', () => {
    render(
      <GameDetailView game={game} status={{ kind: 'idle' }} onInstall={noop} onLaunch={noop} />
    )
    expect(screen.queryByRole('heading', { name: 'Mindustry' })).not.toBeNull()
  })

  it('renders the description text', () => {
    render(
      <GameDetailView game={game} status={{ kind: 'idle' }} onInstall={noop} onLaunch={noop} />
    )
    expect(screen.queryByText('A factory game.')).not.toBeNull()
  })

  it('shows an Install button when idle and fires onInstall on click', async () => {
    const onInstall = vi.fn()
    const user = userEvent.setup()
    render(
      <GameDetailView game={game} status={{ kind: 'idle' }} onInstall={onInstall} onLaunch={noop} />
    )
    await user.click(screen.getByRole('button', { name: /install/i }))
    expect(onInstall).toHaveBeenCalled()
  })

  it('shows a disabled Installing… button while installing', () => {
    render(
      <GameDetailView
        game={game}
        status={{ kind: 'installing' }}
        onInstall={noop}
        onLaunch={noop}
      />
    )
    const button = screen.getByRole('button', { name: /installing/i })
    expect(button.hasAttribute('disabled')).toBe(true)
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
      />
    )
    expect(screen.queryByRole('button', { name: /install/i })).not.toBeNull()
    expect(screen.queryByText('SHA-256 mismatch')).not.toBeNull()
  })
})
