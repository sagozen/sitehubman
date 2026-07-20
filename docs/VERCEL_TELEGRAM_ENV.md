# Vercel — Telegram login env vars

Add these in **Vercel → Project → Settings → Environment Variables** (Production + Preview), then **Redeploy**.

| Variable | Example value |
|----------|----------------|
| `EXPO_PUBLIC_TELEGRAM_BOT_USERNAME` | `GENNFC_Bot` |
| `EXPO_PUBLIC_TELEGRAM_AUTH_ENDPOINT` | `https://us-central1-sitehub-8dd56.cloudfunctions.net/telegramLogin` |
| `EXPO_PUBLIC_TELEGRAM_WIDGET_URL` | `https://sitehubman.vercel.app/telegram-login.html` |
| `EXPO_PUBLIC_TELEGRAM_AUTH_CALLBACK_URL` | `https://sitehubman.vercel.app/telegram-auth-callback.html` |
| `EXPO_PUBLIC_PROFILE_HOST` | `https://sitehubman.vercel.app` |
| `EXPO_PUBLIC_FIREBASE_PROJECT_ID` | `sitehub-8dd56` |
| (all other `EXPO_PUBLIC_FIREBASE_*` from `.env`) | … |

Backend token is **not** set on Vercel — deploy to Firebase Functions:

```powershell
npx firebase functions:secrets:set TELEGRAM_BOT_TOKEN
npx firebase deploy --only functions:telegramLogin
```

BotFather `/setdomain` must include: `sitehubman.vercel.app`

### Localhost shows “bot invalid”

Telegram only allows the widget on domains you linked in @BotFather. If the bot is linked to `sitehubman.vercel.app`, **localhost will fail**.

**Option A — test on production (recommended)**

https://sitehubman.vercel.app/telegram-login.html

**Option B — local dev**

1. In @BotFather: `/setdomain` → `localhost` (replaces Vercel until you set `sitehubman.vercel.app` again)
2. Use `http://localhost:8081/telegram-login.html` (port is not part of the domain)

Test widget (works without query params after deploy):

https://sitehubman.vercel.app/telegram-login.html
