import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type { Manifest } from '../shared/types'

const api = {
  request: (message: unknown): Promise<unknown> => ipcRenderer.invoke('forge:request', message),
  catalog: (): Promise<Manifest> => ipcRenderer.invoke('forge:catalog')
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
