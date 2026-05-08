// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
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

describe('GameDetailView', () => {
  it('renders the game name as the title heading', () => {
    render(<GameDetailView game={game} />)
    expect(screen.queryByRole('heading', { name: 'Mindustry' })).not.toBeNull()
  })

  it('renders the description text', () => {
    render(<GameDetailView game={game} />)
    expect(screen.queryByText('A factory game.')).not.toBeNull()
  })

  it('shows a disabled Install button (step 3 will wire it up)', () => {
    render(<GameDetailView game={game} />)
    const button = screen.getByRole('button', { name: /install/i })
    expect(button.hasAttribute('disabled')).toBe(true)
  })
})
