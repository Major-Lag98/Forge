import { ElectronAPI } from '@electron-toolkit/preload'

interface ForgeAPI {
  request: (message: unknown) => Promise<unknown>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: ForgeAPI
  }
}
