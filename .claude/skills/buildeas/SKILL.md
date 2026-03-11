---
name: buildeas
description: Trigger EAS development build for Android — use when ready to build and test the app
allowed-tools: Bash, Read
---

# /buildeas — Trigger EAS Development Build (Android)

Trigger an EAS cloud build for the pins-inventory app and report the result clearly.

## Steps

1. **Verify working directory**
   Confirm you are in the pins-inventory project root (where `eas.json` exists). If not, navigate there before proceeding.

2. **Check for uncommitted changes**
   Run `git status`. If there are uncommitted changes, warn the user: EAS builds from the current commit state — local changes will not be included. Ask if they want to commit first before proceeding.

3. **Trigger the build**
   Run exactly:
   ```
   eas build --profile development --platform android --non-interactive
   ```
   Stream the output to the user in real time.

4. **Extract and report the build URL**
   Watch for a line containing `https://expo.dev` in the output. When it appears, extract the full URL and surface it clearly:
   > Build submitted. Track progress at: [URL]

5. **On success**
   When the build completes successfully, tell the user:
   - The APK is ready to download from the Expo dashboard URL above
   - Install it on the **Vivo Y72 5G** via USB or direct download
   - Once installed, test the full auth flow: open app → enter email → check inbox for magic link → tap link → confirm you land on the home screen

6. **On failure**
   - Show the exact error message from the build output
   - Diagnose the likely cause (common culprits: missing env vars in EAS secrets, eas.json misconfiguration, dependency version conflict, Expo SDK mismatch)
   - Suggest a specific fix — do not give a generic list of possibilities
   - If the error is ambiguous, check `eas.json` and `app.json` before speculating

## Notes
- EAS profile in use: `development`
- Platform: `android` only (iOS is v2 — do not offer to build for iOS)
- Build runs in the cloud — this can take 5–15 minutes; let the user know
- Do not run `expo build` (deprecated) — always use `eas build`
