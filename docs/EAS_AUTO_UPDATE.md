# Auto-update app (EAS Update) — no new APK every time

After **one** preview APK build with this config, you can push **JavaScript/UI** changes to phones without reinstalling.

Docs: [EAS Update getting started](https://docs.expo.dev/eas-update/getting-started)

## One-time: build APK with updates enabled

```powershell
npm run eas:build:apk
```

Install that APK on Android (and build iOS `preview` for iPhone). **Older APKs without `updates.url` cannot receive OTA.**

## Push an update (after you change code)

```powershell
npm run eas:update:preview
```

Users: **fully close the app** → open again → new JS loads (may reload once automatically).

## When you still need a **new APK**

| Change | Action |
|--------|--------|
| React screens, styles, logic | `npm run eas:update:preview` |
| New npm package with **native** code | New `eas build` + reinstall |
| `app.json` plugins, NFC, permissions | New `eas build` + reinstall |
| Bump `runtimeVersion` or `version` in app.json (bare workflow) | New `eas build` + reinstall |

## Channels (this project)

| EAS build profile | Channel / branch |
|-------------------|------------------|
| `preview`, `preview-apk` | `preview` |
| `production` | `production` |

Always publish updates to the **same branch** as the build:

```powershell
npm run eas:update:preview
```

## iPhone + Android

Same flow: install build from channel `preview`, then `eas:update:preview` updates both.

## Not the same as

- **Expo Go** / dev server — still needs `npm run start`
- **Vercel web** — separate deploy; does not update the APK
