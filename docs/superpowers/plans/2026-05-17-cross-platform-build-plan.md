# Cross-Platform Build Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Configure electron-builder for Windows/Linux/macOS packaging and add GitHub Actions CI for multi-platform builds.

**Architecture:** Two-file change — add `build` config + scripts to `package.json`, create `.github/workflows/build.yml` for CI. No code changes to the app itself (already cross-platform compatible).

**Tech Stack:** Electron 28, electron-builder 25, GitHub Actions

---

### Task 1: Add electron-builder config and scripts to package.json

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Read current package.json**

Read `package.json` to confirm current content before editing.

- [ ] **Step 2: Add `build` field and update scripts**

Replace the `scripts` block and add a `build` block. The final `package.json` should be:

```json
{
  "name": "desktop-pet",
  "version": "1.0.0",
  "description": "Desktop pet — floating dog companion",
  "main": "main.js",
  "scripts": {
    "start": "cross-env ELECTRON_RUN_AS_NODE= electron .",
    "build:win": "electron-builder --win",
    "build:linux": "electron-builder --linux",
    "build:mac": "electron-builder --mac",
    "build:all": "electron-builder --win --linux --mac"
  },
  "build": {
    "appId": "com.desktop-pet.app",
    "productName": "Desktop Pet",
    "directories": {
      "output": "dist"
    },
    "files": [
      "main.js",
      "preload.js",
      "renderer/**/*",
      "assets/**/*"
    ],
    "win": {
      "target": ["portable", "nsis"]
    },
    "mac": {
      "target": ["dmg", "zip"]
    },
    "linux": {
      "target": ["AppImage", "deb"]
    }
  },
  "devDependencies": {
    "cross-env": "^7.0.0",
    "electron": "^28.0.0",
    "electron-builder": "^25.0.0"
  }
}
```

- [ ] **Step 3: Verify npm scripts parse correctly**

```bash
npm run --help 2>&1 | head -1
```
Expected: Shows npm help, no parse errors from package.json.

- [ ] **Step 4: Test build:linux locally (WSL2)**

```bash
npm run build:linux
```
Expected: Builds `dist/Desktop Pet-1.0.0.AppImage` and `dist/desktop-pet_1.0.0_amd64.deb`.

- [ ] **Step 5: Test build:win locally (WSL2)**

```bash
npm run build:win
```
Expected: Builds `dist/Desktop Pet-1.0.0.exe` (portable) and `dist/Desktop Pet Setup-1.0.0.exe` (NSIS installer).

**Expected output to ignore from linux build:**
- `cannot find rpmbuild` — optional, rpm target not configured
- `cannot find snapcraft` — optional, snap target not configured

- [ ] **Step 6: Commit**

```bash
git add package.json
git commit -m "feat: add cross-platform electron-builder config and scripts"
```

---

### Task 2: Create GitHub Actions CI workflow

**Files:**
- Create: `.github/workflows/build.yml`

- [ ] **Step 1: Create the workflow directory**

```bash
mkdir -p .github/workflows
```

- [ ] **Step 2: Write the workflow file**

Create `.github/workflows/build.yml`:

```yaml
name: Build

on:
  push:
    tags:
      - 'v*'
  workflow_dispatch:

jobs:
  build-linux:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run build:linux
      - uses: actions/upload-artifact@v4
        with:
          name: linux-artifacts
          path: dist/*.AppImage
      - uses: actions/upload-artifact@v4
        with:
          name: linux-deb
          path: dist/*.deb

  build-windows:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run build:win
      - uses: actions/upload-artifact@v4
        with:
          name: windows-portable
          path: dist/*.exe

  build-macos:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run build:mac
      - uses: actions/upload-artifact@v4
        with:
          name: macos-artifacts
          path: dist/*.dmg
      - uses: actions/upload-artifact@v4
        with:
          name: macos-zip
          path: dist/*.zip

  release:
    needs: [build-linux, build-windows, build-macos]
    if: startsWith(github.ref, 'refs/tags/v')
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/download-artifact@v4
      - run: |
          mkdir release
          cp linux-artifacts/*.AppImage release/ 2>/dev/null || true
          cp linux-deb/*.deb release/ 2>/dev/null || true
          cp windows-portable/*.exe release/ 2>/dev/null || true
          cp macos-artifacts/*.dmg release/ 2>/dev/null || true
          cp macos-zip/*.zip release/ 2>/dev/null || true
      - uses: softprops/action-gh-release@v2
        with:
          files: release/*
```

- [ ] **Step 3: Validate YAML syntax**

```bash
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/build.yml')); print('YAML OK')"
```
Expected: `YAML OK`

If pyyaml not available, use:
```bash
npx --yes yaml-lint .github/workflows/build.yml
```

- [ ] **Step 4: Commit and push**

```bash
git add .github/workflows/build.yml
git commit -m "ci: add GitHub Actions cross-platform build workflow"
```

---

### Task 3: Verify full pipeline

- [ ] **Step 1: Test `build:all` locally (optional — will skip mac on Linux)**

```bash
npm run build:all 2>&1
```
Note: Will error on `build:mac` from WSL2 — this is expected. Mac target requires macOS.

- [ ] **Step 2: Verify git status is clean**

```bash
git status
```
Expected: `nothing to commit, working tree clean`

---

### Platform Notes for Engineers

- **WSL2 builds**: `build:linux` and `build:win` work natively. `build:mac` requires macOS.
- **macOS builds**: Run `npm run build:mac` on a Mac, or use CI (`workflow_dispatch`).
- **rpm/snap**: Not configured. Add `rpm` and `snap` to `linux.target` array if needed later.
- **Code signing**: Not configured. macOS users must right-click → Open on first launch.
