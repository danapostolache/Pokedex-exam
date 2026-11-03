# Pokedex

Pokedex is a mobile catalogue for people who want to discover and compare Pokemon. It follows the supplied Pokemon Code Challenge design and uses live PokeAPI data to browse the complete catalogue, search by name, inspect details and evolution, save favorites, and compare two Pokemon.

## Core action

Find a Pokemon and understand its key information and strengths.

## Features

1. [Browse the Pokemon list](./features/pokemon-list.md)
2. [Search Pokemon](./features/search.md)
3. [View Pokemon details](./features/pokemon-detail.md)
4. [Save favorites](./features/favorites.md)
5. [Compare Pokemon](./features/compare.md)

## Data

- **API**: [PokeAPI v2](https://pokeapi.co/docs/v2). It is public and needs no API key or login.
- **Endpoints**:
  - `/pokemon?limit=<limit>&offset=<offset>` for the paginated catalogue.
  - `/pokemon?limit=100000&offset=0` for the lightweight name catalogue used by full-catalogue search and selection.
  - `/pokemon/{id-or-name}` for artwork, types, measurements, abilities, and base stats.
  - `/pokemon-species/{id}` for the English description and evolution-chain URL.
  - `/evolution-chain/{id}` for the complete evolution chain.
- **Stored on the phone**: a SQLite `favorites` table containing `pokemon_id` as the primary key and `created_at`. Pokemon details remain live API data and are not duplicated in SQLite.

## Technical choices

- **List loading**: use a TanStack Query infinite query with PokeAPI `limit` and `offset`, rather than requesting details for every Pokemon at startup. This keeps the initial screen fast and adds pages while the user scrolls.
- **Search**: keep search on the Pokemon home route and filter the grid immediately while the user types. Fetch the lightweight full name catalogue once, filter it locally with case-insensitive substring matching, and fetch details only for visible results. Searching only loaded list pages would fail to find Pokemon the user has not scrolled to.
- **Stored in SQLite**: store only favorite Pokemon IDs and timestamps. Storing complete API responses would become stale and duplicate remote data.
- **Compare state**: keep the two current selections in screen state. Comparisons are temporary and do not need persistence.
- **Navigation**: use three bottom tabs for Pokemon, Favorites, and Compare. Open Pokemon details as a stack screen above the tabs so the native back action returns to the previous tab.
- **Native feature**: use the React Native Share sheet from the card options shown in the Figma design. The alternative considered was haptic feedback when favoriting. Share was chosen because it is already part of the supplied design, provides a useful and clearly testable native interaction, needs no new dependency, and can share a Pokemon's name and PokeAPI link through native iOS or Android apps.
- **Design**: use the supplied Rubik font through Expo Font, theme tokens for every color and spacing value, type-specific colors, and responsive layouts that closely match the Figma screens.

## Technical core

- [x] Runs in Expo Go
- [x] Live data through TanStack Query
- [x] At least 2 screens with Expo Router
- [x] Something in SQLite that survives a restart
- [x] Loading and error state on every load
- [x] One native feature: native Share from a Pokemon card
- [x] TypeScript and ESLint without errors
- [x] UI, data and logic in separate files

## Optional

- [x] Pagination: page by page while scrolling
- [x] Clean TypeScript: no `any`, no `as` casts, no `@ts-ignore`
- [x] No warnings: no `console.log`, none in the terminal or on screen
- [x] Accessibility: labels for every action and support for large text
- [ ] Optimistic update for favorites

## Out of scope

- User accounts, login, and cloud synchronization.
- Catching, training, battling, moves, items, and team building.
- Comparing more than two Pokemon at once or saving comparison history.
- Editing Pokemon data or using an API other than PokeAPI.
- A dedicated web design; the assessed experience is the Expo mobile app.
