import { describe, it, expect } from 'vitest'
import manifest from './manifest.json'
import type { Manifest } from '../shared/types'

const m = manifest as Manifest

describe('manifest.json', () => {
  it('declares schema_version 1', () => {
    expect(m.schema_version).toBe(1)
  })

  it('has at least one catalog entry with unique IDs', () => {
    expect(m.games.length).toBeGreaterThan(0)
    const ids = m.games.map((g) => g.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('every game has the required fields and the expected shape', () => {
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
