import { describe, it, expect } from 'vitest'
import manifest from './manifest.json'
import type { Manifest } from '../shared/types'

const m = manifest as Manifest

describe('manifest.json', () => {
  it('declares schema_version 1', () => {
    expect(m.schema_version).toBe(1)
  })

  it('contains the three v0.1 games', () => {
    const ids = m.games.map((g) => g.id).sort()
    expect(ids).toEqual(['forge-stub-crash', 'forge-stub-success', 'mindustry'])
  })

  it('every game has the required fields and the expected shape', () => {
    expect(m.games.length).toBeGreaterThan(0)
    for (const game of m.games) {
      expect(game.id).toBeTruthy()
      expect(game.name).toBeTruthy()
      expect(game.version).toBeTruthy()
      expect(game.description).toBeTruthy()
      expect(game.platform).toBe('windows-x64')
      expect(game.url).toMatch(/^https:\/\//)
      expect(game.sha256).toMatch(/^[0-9a-f]{64}$/i)
      expect(game.size_bytes).toBeGreaterThan(0)
      expect(game.executable).toBeTruthy()
    }
  })
})
