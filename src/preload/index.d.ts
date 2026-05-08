import { ElectronAPI } from '@electron-toolkit/preload'
import type { Manifest } from '../shared/types'

interface ForgeAPI {
  request: (message: unknown) => Promise<unknown>
  catalog: () => Promise<Manifest>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: ForgeAPI
  }
}
