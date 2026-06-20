# SiteHub Production Launch Gate

Last updated: 2026-06-08

## Required Gates

Run the static gate before every deploy:

```bash
npm run verify:production:static
```

Run the full gate after Firebase rules/functions are deployed:

```bash
npm run verify:production
```

The full gate runs security checks, TypeScript, lint, Firestore rules dry-run, high-severity production audit, and launch verification across all demo roles.

## Deploy Order

1. Deploy Firestore rules and indexes.

```bash
npm run deploy:firestore
```

2. Deploy access-claim and payment functions.

```bash
npm run deploy:payments
```

3. Sign out and sign back in for staff accounts so custom claims refresh.

4. Run the full production gate.

```bash
npm run verify:production
```

## Tenant Backfill

Dry-run first:

```bash
npm run backfill:company-id -- --company-id sitehub-main
```

Apply only after reviewing the dry-run counts:

```bash
npm run backfill:company-id -- --company-id sitehub-main --apply
```

Use `--limit 50` for a small test run and `--force` only when intentionally overwriting existing `companyId` values.

## Secrets

Payment sandbox secrets are server-managed. Generate or rotate from Admin Settings, or set `PAYMENT_SANDBOX_SECRET` locally for smoke tests.

Do not store production payment provider credentials in Firestore or `EXPO_PUBLIC_*` variables. Use Firebase Secret Manager for backend-only credentials.

## Rollback

1. Re-deploy the previous known-good Firestore rules from git.
2. Re-deploy the previous known-good functions bundle.
3. Disable production payment provider mode by setting `PAYMENT_PROVIDER=sandbox` until the merchant integration is verified.
4. Re-run `npm run verify:production`.

## Remaining Hardening

- Backfill `companyId` before enforcing strict tenant-only reads on legacy data.
- Complete real ABA/KHQR merchant API integration before accepting production online payments.
- Initialize Firebase Storage before validating/deploying storage rules.
- Plan the Expo SDK upgrade to clear remaining moderate dependency advisories.
