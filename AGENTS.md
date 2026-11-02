# Pokedex

Pokedex is an Expo and React Native app for browsing, searching, saving, and comparing Pokemon using live data from PokeAPI.

## Product scope

- Follow the supplied Pokemon Code Challenge Figma design for the list, search, detail, evolution, favorites, and comparison experiences.
- The required features are Pokemon list, search, details with stats and evolution, favorites, and comparison.
- Use `https://pokeapi.co/api/v2/` as the remote API. It does not require an API key.
- Favorites must persist in SQLite after the app restarts.
- Include loading, empty, and recoverable error states for asynchronous screens.
- The app must run in Expo Go from a QR code.

## Structure and ownership

- `src/app/`: Expo Router route files and screen composition only. Keep routes thin.
- `src/components/`: reusable presentation components. Components must not call `fetch` or execute SQL.
- `src/hooks/`: TanStack Query hooks and shared stateful or business logic.
- `src/services/`: PokeAPI requests and SQLite operations. Services do not render UI.
- `src/constants/`: theme tokens and stable application constants.
- A screen renders, a hook gets or coordinates data, and a service talks to the API or database. A file must not take on two of these responsibilities.

## Shared setup

- Reuse the single `QueryClient` and `QueryClientProvider` in `src/app/_layout.tsx`. Do not create another query client.
- Reuse `src/constants/theme.ts` and `src/hooks/use-theme.ts` for colors and spacing. Do not hardcode hex colors in screens or components.
- `expo-sqlite` is installed and configured in `app.json`; create one shared database service in `src/services/` when the favorites feature needs it.
- Create one shared PokeAPI service in `src/services/` when the first remote-data feature needs it, then reuse it in every later feature.
- The shared PokeAPI boundary is `src/services/pokeapi.ts`: paginated catalogue requests, mapped card metadata, cancellation, a six-request concurrency limit, and request timeouts. Reuse it in future features. Query hooks live in `src/hooks/use-pokemon-list.ts` and `src/hooks/use-pokemon-card.ts`.
- Search reuses `getPokemonCatalogue` in `src/services/pokeapi.ts` for validated full-catalogue names and `src/hooks/use-pokemon-search.ts` for a lazy, session-cached TanStack Query and trimmed, case-insensitive substring matching. `use-pokemon-list.ts` coordinates displayed entries and visibility while preserving the independent paginated query; it blocks pagination during search.
- Rubik Regular, Medium, and Bold are loaded from `assets/fonts/` by `src/hooks/use-app-fonts.ts`; reuse the font tokens in `src/constants/theme.ts`. The root coordinates readiness with the single `AnimatedSplashOverlay` in `src/components/animated-icon.tsx`.
- Expo Router tabs live in `src/app/(tabs)/_layout.tsx`. Favorites and Compare are placeholders until their feature issues.
- When a feature adds reusable setup, document what it is and where it lives in this section.

## Data and UI rules

- Use TanStack Query hooks for remote server state. Do not fetch with `useEffect` in a screen.
- Keep PokeAPI response types explicit and map remote responses into app-facing data when the UI does not need the full payload.
- Use SQLite only for persistent local product data such as favorites; do not copy live API responses into SQLite without a specification requiring it.
- Use `Pressable` for interactions and provide pressed, disabled, loading, and error states where relevant.
- Respect safe areas, accessibility labels, readable contrast, and touch targets on iOS and Android.
- Match the Figma layout and visual hierarchy while using responsive React Native layouts instead of fixed screen coordinates.
- Ask before adding a dependency. Install approved Expo-compatible packages with `npx expo install`.

## Issue workflow

- Implement one GitHub issue per chat and only the feature described by its specification and acceptance criteria.
- Before writing code for an issue, post one issue comment containing the plan, affected files, uncertainties, and a `- [ ]` task list using `gh issue comment`. Wait for the user's approval before coding.
- Keep the issue task list current while building and do not mark a task complete until it is verified.
- Touch only files required by the issue. Do not add unrelated refactors or features.
- Run `npx expo lint` and `npx tsc --noEmit`, then test the feature in Expo Go, including its loading and error behavior.
- Do not commit or push unless the user explicitly asks. A feature commit must reference and close its issue.

---

This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md
