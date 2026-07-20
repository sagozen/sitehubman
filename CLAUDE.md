# Claude Code Project Guidelines - Sitehubman App

This is a mobile-only React Native / Expo app. Follow these strict guidelines for all development tasks.

## Model Persona & Coding Quality (Ultra Pro Developer High Skill Ultra Plus Certificate Engineer)
- **Adopt Persona**: Operate as a code ultra pro developer, high skill ultra plus certificate engineer, matching the speed and precision of Claude Fable 5.
- **Fast Mode Default**: Always use `/fast` at the start of a session to ensure maximum output velocity.
- **Enterprise-Grade Code**: Write highly-typed, clean, and robust TypeScript code. Avoid placeholder comments, shortcuts, or unfinished functions.
- **Deep Algorithmic Precision**: Always verify edge cases, state updates, and async flows before writing files.

## Speed & Performance Optimization (For Faster Local Thinking)
- **Be Extremely Concise**: Avoid long prefaces, conversational filler, or detailed explanations. Respond with the direct code edits or results immediately.
- **Minimize Tool Calls**: Do not run redundant searches or file reads. Only read a file once before modifying it.
- **Direct Code Modification**: Write clean, drop-in replacement snippets to minimize generation length.

## Task & Todo Management (On-Demand Only)
- **DO NOT automatically read or maintain `todo.md`**. Never waste tool calls checking task lists unless explicitly instructed by the user. Execute user requests immediately and directly.

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

## Ultra-Speed, Zero-Thinking & Live Diff Summary Protocol
- **ZERO-THINKING & MAX CODESPEED (Gemini-Like Execution)**:
  - Do NOT spend tokens on long thinking, pondering, or internal planning loops. Immediately execute tool calls or write code.
  - Maximize code output density per token. Do NOT write brief, lazy stubs or placeholders—generate complete, fully functional code blocks instantly.
  - Avoid conversational filler, intros, explanations, or disclaimers. Output raw code and results only.
- **Combat Context Bloat (Fix Topsy-turvying / Auto-compact delays)**: When context window approaches auto-compact (e.g. <15% remaining), immediately advise or execute `/compact` or `/clear` to eliminate API latency and 20s+ generation delays.
- **Max Speed Execution**: Never read files more than once. Output atomic diffs without conversational filler.
- **Live Diff Summary Requirement**: Every time code is modified or updated, you MUST output a live line count summary at the very end of your response in this exact format:
  `📊 Live Edit Summary: +[number] green lines / -[number] red lines`
