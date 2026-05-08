import { app } from 'electron'
import { promises as fs } from 'node:fs'
import { dirname, join } from 'node:path'
import type { InstalledGame } from '../shared/types'

interface InstallStateFile {
  schema_version: number
  installs: InstalledGame[]
}

const SCHEMA_VERSION = 1

export function defaultInstallsFilePath(): string {
  return join(app.getPath('userData'), 'installs.json')
}

export async function loadInstallRecords(filePath?: string): Promise<InstalledGame[]> {
  const path = filePath ?? defaultInstallsFilePath()
  try {
    const raw = await fs.readFile(path, 'utf8')
    const parsed = JSON.parse(raw) as Partial<InstallStateFile>
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.installs)) {
      return []
    }
    return parsed.installs as InstalledGame[]
  } catch {
    return []
  }
}

export async function saveInstallRecord(record: InstalledGame, filePath?: string): Promise<void> {
  const path = filePath ?? defaultInstallsFilePath()
  const existing = await loadInstallRecords(path)
  const without = existing.filter((r) => r.id !== record.id)
  const next: InstallStateFile = {
    schema_version: SCHEMA_VERSION,
    installs: [...without, record]
  }
  await fs.mkdir(dirname(path), { recursive: true })
  await fs.writeFile(path, JSON.stringify(next, null, 2), 'utf8')
}
