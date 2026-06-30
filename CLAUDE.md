# Claude Code Project Guidelines - Sitehubman App

This is a mobile-only React Native / Expo app. Follow these strict guidelines for all development tasks.

## Critical Task & Todo Management
- **Always maintain a `todo.md` file** in the project root directory.
- Before writing code, you must read the current tasks in `todo.md`.
- Automatically update `todo.md` with:
  - `[x]` Completed tasks.
  - `[/]` In-progress tasks.
  - `[ ]` Pending tasks.
- Keep the task list detailed, component-specific, and updated at the end of every turn.

## App Tech Stack & Keywords
- **Core**: React Native, Expo, TypeScript.
- **Styling**: Premium iOS/Android designs, Apple Human Interface Guidelines (HIG), custom gradients, layout stability.
- **State & Database**: Firebase Firestore (rules, indexes, collections), Local Draft Storage.
- **Animations & Interaction**: `react-native-reanimated`, layout animations, context haptics (`useNativeDriver: true`).

## Key Performance & UI/UX Rules
1. **Gen Y / Millennial Appeal (10/10 Score target)**:
   - Make buttons and clickable areas large (touch targets >= 48dp) using `hitSlop`.
   - Use high-contrast accessible colors (WCAG AA/AAA compliance).
   - Implement fluid, responsive transitions (under 16ms frame budget).
2. **Optimization Rules**:
   - Debounce all text inputs (e.g., 300ms) to eliminate keyboard input lag.
   - Run independent async calls in parallel using `Promise.all` to reduce delay.
   - Use `useMemo` and `useCallback` to prevent unnecessary component re-renders.
   - Use native driver or direct styles for animations instead of triggering state updates frequently.

## Common Development Commands
- Start dev server: `npx expo start`
- Clear cache: `npx expo start -c`
- Install package: `npm install <package-name>`
