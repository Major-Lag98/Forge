import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type { InstalledGame, Manifest } from '../shared/types'

type InstallResult = { ok: true; record: InstalledGame } | { ok: false; error: string }

type UninstallResult = { ok: true } | { ok: false; error: string }

type LaunchResult = { ok: true; exit_code: number } | { ok: false; error: string }

type InstallProgressListener = (gameId: string, phase: string | undefined, percent: number) => void

const api = {
  request: (message: unknown): Promise<unknown> => ipcRenderer.invoke('forge:request', message),
  catalog: (): Promise<Manifest> => ipcRenderer.invoke('forge:catalog'),
  installedGames: (): Promise<InstalledGame[]> => ipcRenderer.invoke('forge:installed_games'),
  install: (gameId: string): Promise<InstallResult> => ipcRenderer.invoke('forge:install', gameId),
  uninstall: (gameId: string): Promise<UninstallResult> =>
    ipcRenderer.invoke('forge:uninstall', gameId),
  launch: (gameId: string): Promise<LaunchResult> => ipcRenderer.invoke('forge:launch', gameId),
  onInstallProgress: (listener: InstallProgressListener): (() => void) => {
    const handler = (
      _event: unknown,
      payload: { gameId: string; phase?: string; percent: number }
    ): void => {
      listener(payload.gameId, payload.phase, payload.percent)
    }
    ipcRenderer.on('forge:install_progress', handler)
    return () => {
      ipcRenderer.removeListener('forge:install_progress', handler)
    }
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
