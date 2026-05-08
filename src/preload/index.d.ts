import { ElectronAPI } from '@electron-toolkit/preload'
import type { InstalledGame, Manifest } from '../shared/types'

type InstallResult = { ok: true; record: InstalledGame } | { ok: false; error: string }
type LaunchResult = { ok: true; exit_code: number } | { ok: false; error: string }

interface ForgeAPI {
  request: (message: unknown) => Promise<unknown>
  catalog: () => Promise<Manifest>
  installedGames: () => Promise<InstalledGame[]>
  install: (gameId: string) => Promise<InstallResult>
  launch: (gameId: string) => Promise<LaunchResult>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: ForgeAPI
  }
}
