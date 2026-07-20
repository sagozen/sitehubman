# Icons

Customer icon-driven flows:

- `src/constants/customerFlows.ts` — flow ids, routes, labels, real icon ids, storage keys
- `src/constants/flowRealIcons.ts` — brand PNGs + native symbol ids
- `src/components/RealIcon.tsx` — SF Symbol / Ionicons / brand image
- `src/components/CustomerFlowIcon.tsx` — squircle tile per flow
- `src/components/CustomerFlowHub.tsx` — customer home hub UI
- `src/services/customerFlowStorage.ts` — AsyncStorage open counts + recents

Legacy line icons: `src/components/AppIcon.tsx`

Preview: open `/icon-preview` in the app.
