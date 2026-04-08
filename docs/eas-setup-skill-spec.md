# Skill Spec: /eas-setup

## Purpose
Pre-build validation checklist for EAS Android builds. Run this before triggering the first EAS build on any new Expo + NativeWind project. Catches every dependency and config error we hit on pins-inventory before they surface as cryptic Gradle failures.

## Trigger
`/eas-setup` — run once per new project, before the first `eas build`.

## Location
Should live at `~/.claude/commands/eas-setup.md` (global — reusable across all mobile projects).

## What the skill should do (in order)

### 1. Verify eas-cli is up to date
- Run `eas --version`
- If behind latest, run `npm install -g eas-cli` before continuing
- Outdated eas-cli has caused mysterious build failures

### 2. Check NativeWind peer dependencies (if NativeWind is in package.json)
NativeWind v4 requires ALL of the following — check each is in node_modules:
- `react-dom` — needed by @expo/log-box for web error overlay (Metro fails without it)
- `react-native-reanimated` — unconditionally imported by react-native-css-interop at runtime
- `react-native-worklets` — required by react-native-reanimated/plugin babel plugin

If any are missing, install them:
```bash
npx expo install react-native-reanimated
npm install react-dom react-native-worklets --legacy-peer-deps
```

### 3. Validate babel.config.js (if NativeWind is present)
The correct setup for NativeWind v4 + Reanimated:
```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }]],
    plugins: [
      require.resolve('react-native-css-interop/dist/babel-plugin'),
      require.resolve('react-native-reanimated/plugin'),
    ],
  };
};
```

**Do NOT use `plugins: ['nativewind/babel']`** — nativewind/babel returns a preset-like `{plugins:[...]}` object. Newer @babel/core rejects it as an invalid plugin property, crashing the autolinking node command during Gradle settings evaluation.

### 4. Run the autolinking command locally
This is the exact command EAS runs during Gradle settings evaluation. If it fails here, the EAS build will fail with a cryptic "node exited with code 1" error.

```bash
node --no-warnings --eval "require('expo/bin/autolinking')" expo-modules-autolinking react-native-config --platform android --json
```

Run from the project root. Must exit with code 0 and output valid JSON. If it fails, the error will be in stderr — read it carefully, it will identify the missing/broken dependency.

### 5. Check EAS environment variables
- Run `eas env:list --environment development`
- Confirm `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` (or equivalent) are set
- These must be "Plain text" visibility (NOT "Secret" — EAS rejects EXPO_PUBLIC_* as secret)
- If missing: `eas secret:create --scope project --name VAR_NAME --value "value" --visibility plaintext --environment development`

### 6. Run expo-doctor
```bash
npx expo-doctor
```
Must pass all checks. Fix any failures before building.

### 7. Confirm git is clean
EAS builds from the committed state. Any local changes won't be included.
- Run `git status`
- If there are uncommitted changes relevant to the build (package.json, babel.config.js, etc.), commit and push first

### 8. Report
Print a summary:
- ✅ or ❌ for each check
- If all pass: "Ready to build. Run `/buildeas` to trigger."
- If any fail: stop and fix before building

## Why each check exists (context from pins-inventory debugging)

| Check | Why |
|-------|-----|
| eas-cli version | Outdated CLI has caused silent failures |
| react-dom | @expo/log-box unconditionally imports it; Metro 500 error without it |
| react-native-reanimated | react-native-css-interop runtime unconditionally imports it |
| react-native-worklets | react-native-reanimated/plugin requires it at babel load time |
| babel.config.js | nativewind/babel is a preset not a plugin; @babel/core rejects it, crashes autolinking |
| autolinking command | Exactly what EAS runs at Gradle settings:29 — if it fails here it fails in EAS |
| EAS env vars | EXPO_PUBLIC_* vars not in .env on EAS server; must be set as EAS secrets |
| expo-doctor | Catches SDK version mismatches before they become Gradle errors |
| git clean | EAS builds the commit, not the working tree |

## Notes
- This skill should be REUSABLE across all Expo + NativeWind projects, not pins-inventory-specific
- The autolinking check (step 4) is the single most valuable check — it reproduces the EAS Gradle failure locally in seconds
- All of these issues were discovered the hard way on pins-inventory's first EAS build (2026-03-10)
