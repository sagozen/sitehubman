/**
 * Loads .env for local builds and passes EXPO_PUBLIC_* into the native bundle.
 * EAS cloud builds need the same vars in Expo dashboard → Environment variables (preview).
 */
const fs = require('node:fs');
const path = require('node:path');
const appJson = require('./app.json');

function loadEnvFile() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) return {};
  const out = {};
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

const localEnv = loadEnvFile();

function readEnv(name) {
  return (process.env[name] ?? localEnv[name] ?? '').trim();
}

const expoPublicExtra = {};
for (const key of Object.keys({ ...process.env, ...localEnv })) {
  if (!key.startsWith('EXPO_PUBLIC_')) continue;
  const value = readEnv(key);
  if (value) expoPublicExtra[key] = value;
}

module.exports = {
  expo: {
    ...appJson.expo,
    extra: {
      ...appJson.expo.extra,
      ...expoPublicExtra,
      firebaseConfigured: Boolean(
        readEnv('EXPO_PUBLIC_FIREBASE_API_KEY') &&
          readEnv('EXPO_PUBLIC_FIREBASE_PROJECT_ID') &&
          readEnv('EXPO_PUBLIC_FIREBASE_APP_ID')
      ),
    },
  },
};
