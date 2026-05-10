import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join, resolve } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { CoreBridge } from './core-bridge'
import manifest from './manifest.json'
import type { InstalledGame, Manifest } from '../shared/types'
import { promises as fsp } from 'node:fs'
import { loadInstallRecords, removeInstallRecord, saveInstallRecord } from './installs'

const coreBridge = new CoreBridge()
const corePath =
  process.env.FORGE_CORE_PATH ??
  resolve(process.cwd(), 'core/build/default/core/Debug/forge_core.exe')

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1600,
    height: 900,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  coreBridge.init(corePath)
  ipcMain.handle('forge:request', (_event, message) => coreBridge.request(message))
  ipcMain.handle('forge:catalog', () => manifest as Manifest)
  ipcMain.handle('forge:installed_games', () => loadInstallRecords())

  ipcMain.handle('forge:install', async (event, gameId: string) => {
    const game = (manifest as Manifest).games.find((g) => g.id === gameId)
    if (!game) return { ok: false, error: `unknown game id: ${gameId}` } as const

    const installDir = join(app.getPath('userData'), 'installs', gameId)
    try {
      await coreBridge.request(
        {
          op: 'install',
          url: game.url,
          expected_sha256: game.sha256,
          install_dir: installDir
        },
        (progress) => {
          if (progress.event === 'progress' && typeof progress.percent === 'number') {
            event.sender.send('forge:install_progress', {
              gameId,
              phase: typeof progress.phase === 'string' ? progress.phase : undefined,
              percent: progress.percent
            })
          }
        }
      )
    } catch (e) {
      const err = e instanceof Error ? e.message : String(e)
      return { ok: false, error: err } as const
    }

    const record: InstalledGame = {
      id: game.id,
      version: game.version,
      install_dir: installDir,
      executable_path: join(installDir, game.executable),
      installed_at: new Date().toISOString()
    }
    await saveInstallRecord(record)
    return { ok: true, record } as const
  })

  ipcMain.handle('forge:uninstall', async (_event, gameId: string) => {
    const records = await loadInstallRecords()
    const record = records.find((r) => r.id === gameId)
    if (!record) return { ok: false, error: `not installed: ${gameId}` } as const

    try {
      await fsp.rm(record.install_dir, { recursive: true, force: true })
      await removeInstallRecord(gameId)
      return { ok: true } as const
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      return { ok: false, error: msg } as const
    }
  })

  ipcMain.handle('forge:launch', async (_event, gameId: string) => {
    const records = await loadInstallRecords()
    const record = records.find((r) => r.id === gameId)
    if (!record) return { ok: false, error: `not installed: ${gameId}` } as const

    try {
      const response = (await coreBridge.request({
        op: 'launch',
        executable: record.executable_path
      })) as Record<string, unknown>
      if (typeof response.exit_code === 'number') {
        return { ok: true, exit_code: response.exit_code } as const
      }
      return { ok: false, error: 'launch returned unexpected payload' } as const
    } catch (e) {
      const err = e instanceof Error ? e.message : String(e)
      return { ok: false, error: err } as const
    }
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', async () => {
  if (process.platform !== 'darwin') {
    await coreBridge.dispose()
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
