# Save favorites

## Goal

Save Pokemon for quick access and find them again after closing and reopening the app.

## Constraints

- Favorites has its own bottom-navigation screen matching the Figma My favorites screen.
- Persist only Pokemon IDs and timestamps in one SQLite `favorites` table through a shared service in `src/services/`.
- Read and mutate favorites through hooks; routes and components must not execute SQL.
- Fetch current Pokemon display data through the existing TanStack Query Pokemon service and reuse list cards.
- Favorite and unfavorite are available from the detail heart and card options sheet.
- Include database initialization/error handling, API loading/error handling, and an empty state.

## Acceptance Criteria

- [ ] Tapping the detail heart or card option adds an unfavorited Pokemon and removes a favorited Pokemon.
- [ ] Favorite state is consistent on list cards, search results, detail, and the Favorites screen.
- [ ] The Favorites screen uses the Figma-style grid and opens the same detail and options actions as the main list.
- [ ] Favorites remain after fully closing and restarting the app because their IDs are stored in SQLite.
- [ ] With no saved Pokemon, the screen shows a designed empty state explaining how to add one.
- [ ] Database or remote-data failure shows a recoverable error state and does not crash or silently discard saved IDs.

## Out of Scope

- Accounts, cloud backup, synchronization, folders, and manual ordering.
- Storing full Pokemon API responses in SQLite.
- Importing or exporting a favorites collection.
