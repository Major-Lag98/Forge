// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Shell } from './Shell'
import type { Game } from '../../../shared/types'

const games: Game[] = [
  {
    id: 'a',
    name: 'Game A',
    version: '1.0',
    description: 'Desc A',
    platform: 'windows-x64',
    url: 'https://example.com/a.zip',
    sha256: '0'.repeat(64),
    size_bytes: 100,
    executable: 'a.exe'
  },
  {
    id: 'b',
    name: 'Game B',
    version: '1.0',
    description: 'Desc B',
    platform: 'windows-x64',
    url: 'https://example.com/b.zip',
    sha256: '0'.repeat(64),
    size_bytes: 200,
    executable: 'b.exe'
  }
]

const noop = (): void => {}

describe('Shell', () => {
  it('renders one tile button per game with the game name as accessible label', () => {
    render(
      <Shell
        games={games}
        selectedGameId={null}
        onSelectGame={noop}
        onHome={noop}
        onSignOut={noop}
        onRefreshCatalog={noop}
        catalogLoading={false}
      >
        <div>main</div>
      </Shell>
    )
    expect(screen.queryByRole('button', { name: 'Game A' })).not.toBeNull()
    expect(screen.queryByRole('button', { name: 'Game B' })).not.toBeNull()
  })

  it('fires onSelectGame with the clicked tile id', async () => {
    const onSelectGame = vi.fn()
    const user = userEvent.setup()
    render(
      <Shell
        games={games}
        selectedGameId={null}
        onSelectGame={onSelectGame}
        onHome={noop}
        onSignOut={noop}
        onRefreshCatalog={noop}
        catalogLoading={false}
      >
        <div>main</div>
      </Shell>
    )
    await user.click(screen.getByRole('button', { name: 'Game B' }))
    expect(onSelectGame).toHaveBeenCalledWith('b')
  })

  it('marks the selected tile with the selected class', () => {
    render(
      <Shell
        games={games}
        selectedGameId="a"
        onSelectGame={noop}
        onHome={noop}
        onSignOut={noop}
        onRefreshCatalog={noop}
        catalogLoading={false}
      >
        <div>main</div>
      </Shell>
    )
    expect(screen.getByRole('button', { name: 'Game A' }).className).toContain('rail-tile-selected')
    expect(screen.getByRole('button', { name: 'Game B' }).className).not.toContain(
      'rail-tile-selected'
    )
  })

  it('fires onHome when the F home button is clicked', async () => {
    const onHome = vi.fn()
    const user = userEvent.setup()
    render(
      <Shell
        games={[]}
        selectedGameId={null}
        onSelectGame={noop}
        onHome={onHome}
        onSignOut={noop}
        onRefreshCatalog={noop}
        catalogLoading={false}
      >
        <div>main</div>
      </Shell>
    )
    await user.click(screen.getByRole('button', { name: /home/i }))
    expect(onHome).toHaveBeenCalled()
  })

  it('fires onSignOut when the sign-out button is clicked', async () => {
    const onSignOut = vi.fn()
    const user = userEvent.setup()
    render(
      <Shell
        games={[]}
        selectedGameId={null}
        onSelectGame={noop}
        onHome={noop}
        onSignOut={onSignOut}
        onRefreshCatalog={noop}
        catalogLoading={false}
      >
        <div>main</div>
      </Shell>
    )
    await user.click(screen.getByRole('button', { name: /sign out/i }))
    expect(onSignOut).toHaveBeenCalled()
  })

  it('fires onRefreshCatalog when the refresh button is clicked', async () => {
    const onRefreshCatalog = vi.fn()
    const user = userEvent.setup()
    render(
      <Shell
        games={[]}
        selectedGameId={null}
        onSelectGame={noop}
        onHome={noop}
        onSignOut={noop}
        onRefreshCatalog={onRefreshCatalog}
        catalogLoading={false}
      >
        <div>main</div>
      </Shell>
    )
    await user.click(screen.getByRole('button', { name: /refresh catalog/i }))
    expect(onRefreshCatalog).toHaveBeenCalled()
  })

  it('disables the refresh button while the catalog is loading', () => {
    render(
      <Shell
        games={[]}
        selectedGameId={null}
        onSelectGame={noop}
        onHome={noop}
        onSignOut={noop}
        onRefreshCatalog={noop}
        catalogLoading={true}
      >
        <div>main</div>
      </Shell>
    )
    const refresh = screen.getByRole('button', { name: /refresh catalog/i })
    expect(refresh.hasAttribute('disabled')).toBe(true)
  })
})
