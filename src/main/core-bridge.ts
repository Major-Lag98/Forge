import { spawn, type ChildProcess } from 'node:child_process'
import { createInterface, type Interface } from 'node:readline'

export type ProgressEvent = {
  event: string
  [key: string]: unknown
}

export type ProgressCallback = (event: ProgressEvent) => void

interface Pending {
  resolve: (value: unknown) => void
  reject: (error: Error) => void
  onProgress?: ProgressCallback
}

export class CoreBridge {
  private process: ChildProcess | null = null
  private rl: Interface | null = null
  private nextId = 1
  private pending: Map<number, Pending> = new Map()

  init(executablePath: string): void {
    if (this.process) {
      throw new Error('CoreBridge already initialized')
    }
    // windowsHide: forge_core.exe is a console-subsystem binary. When the
    // packaged (GUI) Electron parent spawns it, Windows allocates a fresh
    // console window that stays visible. The user closing that window
    // sends CTRL_CLOSE_EVENT to the child and kills it.
    const proc = spawn(executablePath, [], {
      stdio: ['pipe', 'pipe', 'inherit'],
      windowsHide: true
    })
    this.process = proc

    proc.on('exit', (code, signal) => {
      const error = new Error(
        `forge_core exited (code=${code ?? 'null'}, signal=${signal ?? 'null'})`
      )
      const pending = this.pending
      this.pending = new Map()
      for (const p of pending.values()) p.reject(error)
    })

    if (proc.stdout) {
      this.rl = createInterface({ input: proc.stdout, crlfDelay: Infinity })
      this.rl.on('line', (line) => this.onLine(line))
    }
  }

  request<T = unknown>(message: object, onProgress?: ProgressCallback): Promise<T> {
    const proc = this.process
    const stdin = proc?.stdin
    if (!proc || !stdin || !stdin.writable) {
      return Promise.reject(new Error('CoreBridge not connected'))
    }
    const id = this.nextId++
    return new Promise<T>((resolve, reject) => {
      this.pending.set(id, {
        resolve: resolve as (v: unknown) => void,
        reject,
        onProgress
      })
      const envelope = { id, ...message }
      stdin.write(JSON.stringify(envelope) + '\n')
    })
  }

  async dispose(): Promise<void> {
    const proc = this.process
    if (!proc) return
    proc.stdin?.end()
    if (proc.exitCode === null && proc.signalCode === null) {
      await new Promise<void>((resolve) => proc.once('exit', () => resolve()))
    }
    this.process = null
    this.rl = null
  }

  private onLine(line: string): void {
    let parsed: Record<string, unknown>
    try {
      parsed = JSON.parse(line) as Record<string, unknown>
    } catch {
      // Malformed line — drop. (forge_core only emits well-formed JSON.)
      return
    }

    const id = parsed.id
    if (typeof id !== 'number') return
    const handler = this.pending.get(id)
    if (!handler) return

    if (typeof parsed.event === 'string') {
      // Mid-stream progress event.
      handler.onProgress?.(parsed as ProgressEvent)
      return
    }

    // Final response: settle the promise and clear the entry.
    this.pending.delete(id)
    if (typeof parsed.error === 'string') {
      handler.reject(new Error(parsed.error))
    } else {
      handler.resolve(parsed.result)
    }
  }
}
