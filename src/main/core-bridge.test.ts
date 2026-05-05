import { afterEach, describe, expect, it } from 'vitest'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { CoreBridge } from './core-bridge'

const corePath =
  process.env.FORGE_CORE_PATH ??
  resolve(process.cwd(), 'core/build/default/core/Debug/forge_core.exe')

describe('CoreBridge integration', () => {
  let bridge: CoreBridge | null = null

  afterEach(async () => {
    await bridge?.dispose()
    bridge = null
  })

  it('round-trips a ping and gets pong', async () => {
    if (!existsSync(corePath)) {
      throw new Error(
        `forge_core.exe not found at ${corePath}. Build it with 'cmake --build --preset default' first (or run 'npm run test:cpp').`
      )
    }
    bridge = new CoreBridge()
    bridge.init(corePath)
    const response = await bridge.request({ op: 'ping' })
    expect(response).toEqual({ pong: true })
  })
})
