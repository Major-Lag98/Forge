# Forge — Project State

**Last updated:** May 20, 2026
**Status:** 🟡 Phase 2 nearly done — cleanup, tag-triggered release artifact (validated via `v0.1.0-rc4`), remote catalog (separate `Forge-Manifest` repo + manual refresh + hard-fail UI), and the public README all landed. Playwright E2E + the Phase-1 test-gap sweep were de-scoped (see §6). Only demo GIF + architecture SVG remain before cutting v0.1.0.

---

## 1. Project overview

A C++/web hybrid desktop game launcher: an Electron UI talks to a C++ core that downloads, verifies, extracts, and launches a small catalog of games. Built as a portfolio project targeting the listed qualifications for game-client / publishing-platform roles.

---

## 2. Goals

**Primary (portfolio):**
- Demonstrate the qualifications listed for the Riot Client – Publishing Platform role: C++ application development, web development, Electron, desktop apps, build pipelines, and unit/functional/automation testing.
- Produce a working demo a recruiter can run (or watch a 30-second GIF of) and a README that reads cleanly.

**Secondary (learning):**
- Get hands-on with Electron + a C++ core talking to it over IPC, end-to-end.
- Set up a real GitHub Actions pipeline that builds and releases a desktop binary.

**Explicitly not a goal:**
- Going beyond the listing. No "stand out with hard engineering" arc — that's a different project.

---

## 3. Non-goals (explicit)

Scoping is half the battle on a side project. Out of scope:

- Differential / binary patching (bsdiff).
- Resumable downloads, chunk journals, parallel chunked transfers.
- Self-updater for the launcher itself.
- OS keychain integration; production-grade auth.
- Cross-platform matrix and code signing (pick one OS for v0.1).
- Telemetry, crash reporting, analytics.
- Multiplayer / social features, DRM, anti-cheat, storefront, payments, mobile.
- Supporting more than 1–2 sample "games" (an open-source binary or a stub is fine).

---

## 4. Design decisions & rationale

| Decision | Choice | Why |
|---|---|---|
| Native language | **C++23** | Listed as required. The C++ core does real work: HTTP download with SHA-256 verification, zip extraction, child-process launch. C++23 features (`std::print`, `std::expected`, ranges additions) make the code cleaner. Fallback: if toolchain support causes friction, drop to C++20 — mechanical change, mostly one-for-one swaps. |
| UI shell | **Electron** | Listed as desired. Mature, fast to iterate, good fit for a portfolio scope. |
| Frontend | **React + TypeScript** + Vite | Common stack, type safety across the IPC boundary. |
| Build (C++) | **CMake + vcpkg** | Cross-platform-ready, standard for modern C++. |
| C++ ↔ Electron | **Sidecar process spawned via `child_process`**, JSON over stdio | Simplest thing that gives a real "backend to web frontend flow" story. N-API addons were considered but add toolchain complexity for no portfolio benefit. |
| Auth | **Stub login screen** (username only, no password) | Real auth isn't a listed qualification. A button that fakes a session is enough to demo the flow. |
| Manifest / catalog | **Static JSON file** in the repo or on a public bucket | One file, no server. |
| "Install" | Download a zip from a public URL → verify SHA-256 → extract → record in a local JSON DB | Real C++ work, no novel engineering. |
| "Launch" | C++ core spawns the game binary, reports exit code back to UI | Demonstrates process supervision in a sentence. |
| Target platform | **macOS or Windows — pick one** for v0.1 | Cross-platform later if it's interesting; the listing doesn't ask. |
| CI | **GitHub Actions**, one platform, builds + tests + uploads artifact on tag | Hits the "build pipelines" desired qualification cleanly. |
| Tests | GoogleTest (C++ pure-function units), Vitest (TS unit/functional), one Playwright E2E in Phase 2. Test-driven mindset — write tests as you design the API, not after — but no strict separate-commits red/green discipline. Every feature merges with passing tests; refactors and pure wiring don't need new tests. | Hits "unit, functional, and automation tests." Avoids the friction of stub-only commits without giving up the substance — tests still exist for every behavioral unit. |

---

## 5. Architecture (current plan)

```
┌─────────────────┐    ┌──────────────┐
│  Forge Renderer │◄──►│ Forge Main   │
│   (TS/React)    │IPC │  (Electron)  │
└─────────────────┘    └──────┬───────┘
                              │ child_process (JSON over stdio)
                       ┌──────▼─────────┐    ┌────────────────┐
                       │   Forge Core   │◄──►│ Static catalog │
                       │     (C++)      │HTTP│   + game zips  │
                       │ download/hash/ │    │  (public URL)  │
                       │ extract/spawn  │    └────────────────┘
                       └────────────────┘
```

See [`design/README.md`](./design/README.md) for the visual design — hand sketches of each screen plus locked decisions on layout, colour palette, component patterns, and persistence.

---

## 6. Pending tasks

Three short phases. Goal is a working demo, not a flagship project.

### Phase 0 — Bootstrap (≈1 weekend)
- [x] Repo scaffolding: Electron + Vite + React + TypeScript (electron-vite + electron-builder, target Windows)
- [x] CMake + vcpkg setup for the C++ core; "hello" binary builds (vcpkg as git submodule, manifest mode; CMakePresets pinned to VS 2022 + x64 for the local default — `Visual Studio 17 2022` generator; `forge_core.exe` prints a JSON via nlohmann-json)
- [x] **GoogleTest + Vitest wired into the build with one trivial passing test each** — test infra runs in CI before any real code lands (`npm test` runs both; CTest preset for the C++ side, Vitest for TS; ESLint ignores extended for `vcpkg/` and `core/build/`)
- [x] Electron `child_process` spawns the C++ core; one round-trip JSON message renderer ↔ main ↔ core, exercised by an integration test (line-delimited JSON over stdin/stdout, `{"op":"ping"}` → `{"pong":true}`; `CoreBridge` class in main; `window.api.request` in renderer; gtest unit covers `dispatch`, vitest integration spawns the real binary)
- [x] GitHub Actions: lint, format, build, **run tests** on the chosen target OS (`.github/workflows/ci.yml`, runs on `windows-latest`, Node 22, vcvars via `ilammy/msvc-dev-cmd`. Uses a separate `ninja` CMake preset so the local `default` preset (VS 2022) stays untouched. Vitest's bridge test resolves the binary via `FORGE_CORE_PATH` env var with the local default as fallback. Verified locally end-to-end; first GitHub run pending an actual push.)

### Phase 1 — Core flow (≈1–2 weeks)
- [x] Stub login screen → fake session
- [x] Catalog page: render games from a static JSON manifest
- [x] C++ core: HTTP download + SHA-256 verification + zip extract, with gtest unit coverage
- [x] C++ core: spawn the installed binary, surface exit code to the UI, with an integration test (`launch.cpp` uses `CreateProcessW` + `CREATE_NEW_CONSOLE` so child stdio doesn't pollute the IPC bridge; vitest IPC integration test covers the full round-trip)
- [x] (4.5a) C++ install orchestrator (download + verify + extract) wired to IPC; install state persisted to a JSON file under `app.getPath('userData')` and reloaded on startup; Install → Play button transition works (Install button shows "Installing…" text — real progress percentage deferred to 4.5b-progress)
- [x] (4.5b-uninstall) Uninstall button below Play with two-click inline confirm; main-process `fs.rm` of `install_dir` + remove the record from persisted state
- [x] Build & host the stub binaries: `stubs/` CMake sub-project produces `forge-stub-success` and `forge-stub-crash`; `stubs/package.ps1` builds + zips them; published as zips on this repo's `stubs-1.0.0` release (kept artifacts in the same repo for v0.1 — separate `forge-catalog` repo deferred); real SHA-256 values in `manifest.json`. Bundled in the same step: launch errors (`last_launch_error` on `'installed'` status) surfaced in the right pane below Play.
- [x] (4.5b-progress) Protocol IDs + event messages on the IPC bridge so install can stream progress; button-as-progress with real percentage during install (every request now carries an `id`; final responses come back wrapped as `{id, result}` or `{id, error}`; mid-stream events are `{id, event:"progress", percent}`. Bridge correlates by id, exposes `request(msg, onProgress?)`. Renderer subscribes to `onInstallProgress` from preload; install button fills via a CSS linear-gradient with `--progress-fill` set inline.)
- [x] **Milestone: log in, install a sample game, launch it from the UI** — demo-ready, all tests green (ctest 20/20, vitest 33/33), CI green on `windows-latest`

### Phase 2 — Polish & ship (≈1 week)
- [x] Cleanup sweep: dropped the `stubs/` sub-project (artifacts on the GitHub `stubs-1.0.0` release left alone), de-brittled `manifest.test.ts`, rewrote §9 of this doc to point at the live catalog, neutralised dangling `mindustry`/`forge-stub-success` test fixtures, switched the local default CMake preset to VS 2022 to match the installed toolchain
- [x] CI publishes a release artifact on tagged commits (`.github/workflows/release.yml` triggers on `v*` tags, builds the C++ core via the new `ninja-release` preset, runs gtest + vitest, packages an NSIS installer via `npm run build:win`, uploads to GitHub Releases. `scripts/stage-core.mjs` copies `forge_core.exe` + its vcpkg runtime DLLs to `staging/`, `electron-builder.yml` bundles them via `extraResources`, `src/main/index.ts` resolves `corePath` from `process.resourcesPath` when `app.isPackaged`, and `core-bridge.ts` spawns with `windowsHide: true` so the console-subsystem child doesn't pop a CMD window in the packaged app. Validated end-to-end via `v0.1.0-rc3`.)
- [x] Remote catalog: manifest is fetched from a separate `Forge-Manifest` GitHub repo at startup; manual refresh button on the catalog rail; hard-fail UI (loading / error-with-retry) when the network is unreachable. `src/main/catalog.ts` does the fetch + JSON schema validation, `App.tsx` owns the `CatalogState` machine, `FORGE_CATALOG_URL` env var overrides the default URL for offline dev. Bundled `src/main/manifest.json` retired in the same commit. (Promoted from stretch.)
- [ ] Demo GIF, architecture diagram (a real SVG, not ASCII)
- [x] README finalized (full standalone build instructions, subtle tech-stack table, SmartScreen note explaining why the installer is unsigned, links into project-state.md for the deeper history. Demo GIF reference is a placeholder until the demo-GIF task lands.)

**De-scoped late in Phase 2:** the Playwright E2E test and the "fill in any test gaps surfaced during Phase 1" sweep were both cut as the project entered wrap-up. Rationale: the existing GoogleTest harness (21 cases covering download / hash / extract / launch / install orchestrator) plus Vitest integration tests that spawn the real `forge_core.exe` over the IPC bridge already exercise the full stack from the renderer's `window.api` boundary down to the C++ binary. A Playwright run on top of that would mostly retest the same paths through a more brittle harness. The "automation testing" qualification is carried by the CI workflow itself + the IPC-spawning integration tests, not by a Selenium-family tool.

### Stretch (only if there's time and interest)
- Second platform target.
- Real OAuth flow (still no keychain — just in-memory tokens).
- One small case-study doc on something you found interesting while building.

---

## 7. Risks & known unknowns

- **Scope creep — by far the biggest risk.** It's tempting to add patching, resumable downloads, and so on. Don't. They were already cut once. Re-read the listing if the urge returns.
- **First-time Electron + C++ IPC.** Will eat a day or two figuring out the wiring. That's the point — it's the main thing to learn.

---

## 8. Definition of done (v0.1)

- Public GitHub repo with green CI on the chosen platform.
- A downloadable release binary for that platform.
- README with a demo GIF and an architecture diagram.
- A user can: log in, install a sample game, and launch it — from the UI, without touching a terminal.
- Each required/desired qualification on the listing maps to something visible in the repo.

---

## 9. Sample catalog

The live catalog lives in a separate repo, [Forge-Manifest](https://github.com/Major-Lag98/Forge-Manifest), at `manifest.json` on `main`. The client fetches it at startup from the raw URL `https://raw.githubusercontent.com/Major-Lag98/Forge-Manifest/refs/heads/main/manifest.json` (overridable via the `FORGE_CATALOG_URL` env var for offline dev). The catalog entries are self-authored sample games (Unity + Unreal builds) hosted as zips on GitHub Releases under separate per-game repos. The `executable` field is the path inside the extracted zip — the C++ core uses it for the launch step.

Schema (unchanged since Phase 1):

```jsonc
{
  "schema_version": 1,
  "games": [
    {
      "id": "...",            // stable slug
      "name": "...",          // display name
      "version": "1.0.0",
      "description": "...",
      "platform": "windows-x64",
      "url": "https://...zip",
      "sha256": "<64-char hex>",
      "size_bytes": 0,
      "executable": "path/inside/zip.exe"
    }
  ]
}
```

Adding a new game today: build the zip, hash it, upload to a GitHub Release, paste the entry into the Forge-Manifest repo's `manifest.json`, commit + push. Already-running clients see the new entry on the next refresh-button click or app restart — no Forge client release needed.
