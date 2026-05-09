# Forge — Project State

**Last updated:** May 7, 2026
**Status:** 🟢 Phase 1 in progress — login, catalog, install primitives (download / hash / extract), launch primitive, and the install → play UI flow all in. Progress percentage, uninstall, and stub binaries pending before the demo milestone.

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
- [x] CMake + vcpkg setup for the C++ core; "hello" binary builds (vcpkg as git submodule, manifest mode; CMakePresets pinned to VS 2026 + x64; `forge_core.exe` prints a JSON via nlohmann-json)
- [x] **GoogleTest + Vitest wired into the build with one trivial passing test each** — test infra runs in CI before any real code lands (`npm test` runs both; CTest preset for the C++ side, Vitest for TS; ESLint ignores extended for `vcpkg/` and `core/build/`)
- [x] Electron `child_process` spawns the C++ core; one round-trip JSON message renderer ↔ main ↔ core, exercised by an integration test (line-delimited JSON over stdin/stdout, `{"op":"ping"}` → `{"pong":true}`; `CoreBridge` class in main; `window.api.request` in renderer; gtest unit covers `dispatch`, vitest integration spawns the real binary)
- [x] GitHub Actions: lint, format, build, **run tests** on the chosen target OS (`.github/workflows/ci.yml`, runs on `windows-latest`, Node 22, vcvars via `ilammy/msvc-dev-cmd`. Uses a separate `ninja` CMake preset so the user's local `default` preset (VS 2026) stays untouched. Vitest's bridge test resolves the binary via `FORGE_CORE_PATH` env var with the local default as fallback. Verified locally end-to-end; first GitHub run pending an actual push.)

### Phase 1 — Core flow (≈1–2 weeks)
- [x] Stub login screen → fake session
- [x] Catalog page: render games from a static JSON manifest
- [x] C++ core: HTTP download + SHA-256 verification + zip extract, with gtest unit coverage
- [ ] C++ core: spawn the installed binary, surface exit code to the UI, with an integration test
- [x] (4.5a) C++ install orchestrator (download + verify + extract) wired to IPC; install state persisted to a JSON file under `app.getPath('userData')` and reloaded on startup; Install → Play button transition works (Install button shows "Installing…" text — real progress percentage deferred to 4.5b-progress)
- [ ] (4.5b-uninstall) Uninstall button below Play with two-click inline confirm; main-process `fs.rm` of `install_dir` + remove the record from persisted state
- [ ] Build & host the stub binaries: tiny CMake sub-project for `forge-stub-success` and `forge-stub-crash`; mirror as zips to a `forge-catalog` GitHub release; fill real SHA-256 values in `manifest.json`
- [ ] (4.5b-progress) Protocol IDs + event messages on the IPC bridge so install can stream progress; button-as-progress with real percentage during install
- [ ] **Milestone: log in, install a sample game, launch it from the UI** ← demo-ready, with passing tests

### Phase 2 — Polish & ship (≈1 week)
- [ ] One Playwright E2E test: launch app, install game, verify it runs
- [ ] Fill in any test gaps surfaced during Phase 1
- [ ] CI publishes a release artifact on tagged commits
- [ ] Demo GIF, architecture diagram (a real SVG, not ASCII)
- [ ] README finalized

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

Three entries for v0.1: one real game for the demo, plus two stubs for tests and to make the catalog feel populated.

### Games

| ID | What | Source | Why |
|---|---|---|---|
| `mindustry` | [Mindustry](https://mindustrygame.github.io/) v8 — GPLv3 factory / tower defense game | Mirror the official build to your own GitHub Release | Demo headliner. Recognizable, ~150 MB, downloads in a reasonable time, looks great in a GIF. GPLv3 redistribution is fine — include the license file in the mirror. Re-verify before mirroring. |
| `forge-stub-success` | A 30-line program that opens a window, prints "Hello from Forge", waits, exits 0 | Build it yourself; ~kilobytes | Fast, deterministic E2E test of the happy-path launch flow. |
| `forge-stub-crash` | Same as above, but exits with code 1 after a moment | Build it yourself | Tests the C++ core's error-surfacing path. Most launcher bugs hide in failure modes — this stub is the one you'll thank yourself for later. |

### Hosting

- **GitHub Releases** on a separate `forge-catalog` repo. Stable URLs, free, supports SHA-256 verification naturally.
- One release per (game, version, platform).
- The static manifest JSON also lives in this repo (or as a Pages-served file).

### Sample manifest entry

```json
{
  "schema_version": 1,
  "games": [
    {
      "id": "mindustry",
      "name": "Mindustry",
      "version": "8.0",
      "description": "Open-source factory / tower defense game.",
      "platform": "macos-arm64",
      "url": "https://github.com/<you>/forge-catalog/releases/download/mindustry-8.0/mindustry-macos-arm64.zip",
      "sha256": "<fill in after mirroring>",
      "size_bytes": 152000000,
      "executable": "Mindustry.app/Contents/MacOS/Mindustry"
    },
    {
      "id": "forge-stub-success",
      "name": "Forge Stub (Success)",
      "version": "1.0.0",
      "description": "Test stub — exits 0.",
      "platform": "macos-arm64",
      "url": "https://github.com/<you>/forge-catalog/releases/download/stubs-1.0.0/forge-stub-success-macos-arm64.zip",
      "sha256": "<fill in after building>",
      "size_bytes": 50000,
      "executable": "forge-stub-success"
    }
  ]
}
```

### Notes
- The `executable` field is the path inside the extracted zip — the C++ core uses it for the launch step.
- Build the stubs first, before the launcher itself. Phase 1's tests need them to exist.
- One stub per platform, hosted as a separate zip per platform — keeps the manifest schema simple (no nested platform map).
