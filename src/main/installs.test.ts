import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { promises as fs } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { loadInstallRecords, removeInstallRecord, saveInstallRecord } from './installs'
import type { InstalledGame } from '../shared/types'

describe('installs persistence', () => {
  let tmpDir: string
  let filePath: string

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(join(tmpdir(), 'forge-installs-test-'))
    filePath = join(tmpDir, 'installs.json')
  })

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true })
  })

  const sample: InstalledGame = {
    id: 'sample-game',
    version: '1.0.0',
    install_dir: 'C:\\fake\\installs\\sample-game',
    executable_path: 'C:\\fake\\installs\\sample-game\\sample-game.exe',
    installed_at: '2026-01-01T00:00:00.000Z'
  }

  it('returns an empty array when the file does not exist', async () => {
    const records = await loadInstallRecords(filePath)
    expect(records).toEqual([])
  })

  it('round-trips a saved record', async () => {
    await saveInstallRecord(sample, filePath)
    const records = await loadInstallRecords(filePath)
    expect(records).toEqual([sample])
  })

  it('returns an empty array on malformed JSON', async () => {
    await fs.writeFile(filePath, 'not json', 'utf8')
    const records = await loadInstallRecords(filePath)
    expect(records).toEqual([])
  })

  it('replaces an existing record with the same id', async () => {
    await saveInstallRecord(sample, filePath)
    const updated: InstalledGame = { ...sample, version: '2.0.0' }
    await saveInstallRecord(updated, filePath)
    const records = await loadInstallRecords(filePath)
    expect(records).toEqual([updated])
  })

  it('keeps records with different ids alongside each other', async () => {
    await saveInstallRecord(sample, filePath)
    const other: InstalledGame = { ...sample, id: 'other-game' }
    await saveInstallRecord(other, filePath)
    const records = await loadInstallRecords(filePath)
    expect(records).toHaveLength(2)
    const ids = records.map((r) => r.id).sort()
    expect(ids).toEqual(['other-game', 'sample-game'])
  })

  it('removes a record by id and preserves others', async () => {
    const a = sample
    const b: InstalledGame = { ...sample, id: 'other-game' }
    await saveInstallRecord(a, filePath)
    await saveInstallRecord(b, filePath)

    await removeInstallRecord('sample-game', filePath)

    const records = await loadInstallRecords(filePath)
    expect(records).toEqual([b])
  })

  it('is a no-op when removing a non-existent record', async () => {
    await saveInstallRecord(sample, filePath)
    await removeInstallRecord('does-not-exist', filePath)
    const records = await loadInstallRecords(filePath)
    expect(records).toEqual([sample])
  })
})
