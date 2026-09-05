# Cross-Platform Build Design

## Overview

Configure Electron desktop pet to build installable packages for Windows, macOS, and Linux with both portable and installer formats per platform. No code signing required.

## Platform Targets

| Platform | Portable | Installer |
|----------|----------|-----------|
| Windows | portable (.exe) | NSIS (.exe) |
| macOS | zip (.app) | DMG |
| Linux | AppImage | deb |

## electron-builder Config

Add `build` section to `package.json`:

```
appId: com.desktop-pet.app
productName: Desktop Pet
directories.output: dist
files: main.js, preload.js, renderer/**, assets/**
win: { target: [portable, nsis] }
mac: { target: [dmg, zip] }
linux: { target: [AppImage, deb] }
```

## npm Scripts

```
start:   cross-env ELECTRON_RUN_AS_NODE= electron .
build:win:   electron-builder --win
build:linux: electron-builder --linux
build:mac:   electron-builder --mac
build:all:   electron-builder --win --linux --mac
```

## Build Strategy

- **Local (WSL2):** `npm run build:linux` and `npm run build:win` produce Linux/Windows artifacts directly
- **macOS:** Must be built on macOS. Use GitHub Actions for cross-platform CI
- **CI (GitHub Actions):** Triggered by tag push or manual `workflow_dispatch`. Three parallel platform jobs (ubuntu-latest, windows-latest, macos-latest). Artifacts uploaded to workflow run. On tag push, a release job assembles all artifacts into a GitHub Release.

## Files Changed

- `package.json` — add `build` config, update scripts
- `.github/workflows/build.yml` — new CI workflow
- No code changes needed (app already cross-platform compatible)

## Key Decisions

- No macOS code signing (user choice — DMG opens via right-click → Open)
- Default Electron icon initially (can be replaced later)
- Keep `cross-env` for start script (already present)
- Electron 28 (already pinned)
