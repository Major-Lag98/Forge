// Stages forge_core.exe to a fixed path that electron-builder bundles via
// `extraResources`. The C++ build places the binary in a different
// sub-directory depending on the CMake preset (`default` → VS multi-config,
// `ninja` → single-config), so we look in both before failing.

import { copyFileSync, existsSync, mkdirSync, statSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const candidatePaths = [
  process.env.FORGE_CORE_PATH,
  resolve(repoRoot, 'core/build/ninja/core/forge_core.exe'),
  resolve(repoRoot, 'core/build/default/core/Debug/forge_core.exe'),
  resolve(repoRoot, 'core/build/default/core/Release/forge_core.exe')
].filter(Boolean)

const source = candidatePaths.find((p) => existsSync(p))
if (!source) {
  console.error('stage-core: forge_core.exe not found. Checked:')
  for (const p of candidatePaths) console.error('  -', p)
  console.error('Build the C++ core first (e.g. `npm run test:cpp`).')
  process.exit(1)
}

const destDir = resolve(repoRoot, 'staging')
const dest = resolve(destDir, 'forge_core.exe')
mkdirSync(destDir, { recursive: true })
copyFileSync(source, dest)

const { size } = statSync(dest)
console.log(`stage-core: copied ${source} -> ${dest} (${size} bytes)`)
