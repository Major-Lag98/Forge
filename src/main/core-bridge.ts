import { spawn, type ChildProcess } from 'node:child_process'
import { createInterface, type Interface } from 'node:readline'

type PendingResolver = {
  resolve: (value: unknown) => void
  reject: (error: Error) => void
}

export class CoreBridge {
  private process: ChildProcess | null = null
  private rl: Interface | null = null
  private pending: PendingResolver[] = []

  init(executablePath: string): void {
    if (this.process) {
      throw new Error('CoreBridge already initialized')
    }
    const proc = spawn(executablePath, [], { stdio: ['pipe', 'pipe', 'inherit'] })
    this.process = proc

    proc.on('exit', (code, signal) => {
      const error = new Error(
        `forge_core exited (code=${code ?? 'null'}, signal=${signal ?? 'null'})`
      )
      const pending = this.pending
      this.pending = []
      for (const resolver of pending) resolver.reject(error)
    })

    if (proc.stdout) {
      this.rl = createInterface({ input: proc.stdout, crlfDelay: Infinity })
      this.rl.on('line', (line) => {
        const resolver = this.pending.shift()
        if (!resolver) return
        try {
          resolver.resolve(JSON.parse(line))
        } catch (e) {
          resolver.reject(e instanceof Error ? e : new Error(String(e)))
        }
      })
    }
  }

  request(message: unknown): Promise<unknown> {
    const proc = this.process
    const stdin = proc?.stdin
    if (!proc || !stdin || !stdin.writable) {
      return Promise.reject(new Error('CoreBridge not connected'))
    }
    return new Promise((resolve, reject) => {
      this.pending.push({ resolve, reject })
      stdin.write(JSON.stringify(message) + '\n')
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
}
