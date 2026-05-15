// Stages forge_core.exe + its runtime DLLs to staging/, which
// electron-builder bundles into the packaged app via `extraResources`.
//
// The C++ build places the binary in a different sub-directory depending
// on the preset:
//   - default (VS multi-config): core/build/default/core/Debug|Release/
//   - ninja (Debug):             core/build/ninja/core/
//   - ninja-release (Release):   core/build/ninja-release/core/
// We try each in turn until one exists. FORGE_CORE_PATH wins if set.
//
// We copy every .dll in the same directory as forge_core.exe alongside
// it — vcpkg defaults to dynamic linking, so cpr, libzip, libcurl, zlib,
// etc. are real runtime deps and must ship with the binary or Windows
// will fail to load it and the spawned child exits immediately (which
// surfaces as "CoreBridge not connected" in the renderer).

import { copyFileSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const candidatePaths = [
  process.env.FORGE_CORE_PATH,
  resolve(repoRoot, 'core/build/ninja-release/core/forge_core.exe'),
  resolve(repoRoot, 'core/build/ninja/core/forge_core.exe'),
  resolve(repoRoot, 'core/build/default/core/Release/forge_core.exe'),
  resolve(repoRoot, 'core/build/default/core/Debug/forge_core.exe')
].filter(Boolean)

const source = candidatePaths.find((p) => existsSync(p))
if (!source) {
  console.error('stage-core: forge_core.exe not found. Checked:')
  for (const p of candidatePaths) console.error('  -', p)
  console.error('Build the C++ core first (e.g. `npm run test:cpp`).')
  process.exit(1)
}

const sourceDir = dirname(source)
const destDir = resolve(repoRoot, 'staging')

if (existsSync(destDir)) rmSync(destDir, { recursive: true, force: true })
mkdirSync(destDir, { recursive: true })

const filesToStage = readdirSync(sourceDir).filter((name) => {
  const lower = name.toLowerCase()
  return lower === 'forge_core.exe' || lower.endsWith('.dll')
})

if (!filesToStage.some((n) => n.toLowerCase() === 'forge_core.exe')) {
  console.error(`stage-core: forge_core.exe missing from ${sourceDir}`)
  process.exit(1)
}

let totalBytes = 0
for (const name of filesToStage) {
  const from = resolve(sourceDir, name)
  const to = resolve(destDir, name)
  copyFileSync(from, to)
  totalBytes += statSync(to).size
}

console.log(
  `stage-core: copied ${filesToStage.length} file(s) from ${sourceDir} -> ${destDir} (${totalBytes} bytes total)`
)
for (const name of filesToStage) console.log(`  - ${name}`)
