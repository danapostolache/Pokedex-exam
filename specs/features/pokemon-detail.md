# View Pokemon details

## Goal

Open a Pokemon from the normal list or search results and quickly understand its identity, measurements, abilities, base stats, and evolution chain.

## Constraints

- Use a dynamic Expo Router route keyed by Pokemon ID or name and a native back action.
- Follow all Figma detail states: colored header, artwork, name, number, type badges, favorite heart, and quick About, Stats, and Evolution tabs.
- Fetch `/pokemon/{id-or-name}` and its returned species reference through TanStack Query (form IDs can differ from species IDs). Fetch the evolution URL returned by the species response instead of constructing it.
- Use the English species description and format API names for display without changing their underlying identifiers.
- Evolution is part of this feature and has its own loading and recoverable error state.
- Reuse shared Pokemon presentation components, the single QueryClient, and the existing PokeAPI service with its cancellation, concurrency limit, and timeouts.
- Show an accessible disabled heart. Favorites entry, mutations, hooks/services, and SQLite belong to issue #4.

## Acceptance Criteria

- [x] Detail opens from normal-list and search-result card taps and Open Pokemon options, showing name, number, official artwork, and type badges in type-specific colors.
- [x] About shows the Figma information: ID, base experience, weight, height, types, abilities, and an English description when available.
- [x] Stats shows HP, Attack, Defense, Special Attack, Special Defense, and Speed with values and proportional visual bars.
- [x] Evolution shows the complete API evolution tree in order, preserving all branches, with number, artwork, and name; tapping a member opens that Pokemon's detail. Single-member chains have a clear state.
- [x] The About, Stats, and Evolution sections switch quickly. The heart and options Favorite remain visibly and accessibly disabled.
- [x] Pokemon, species, and evolution loads have appropriate loading and Retry states; an unknown ID shows a not-found state instead of crashing.
- [x] Back navigation and the iOS back gesture return to the previous screen with list/search state preserved; direct entry without history can return to the list.
- [x] Missing optional data/artwork has a fallback; dependent request failures preserve usable loaded details.
- [x] Safe areas, large text, accessible controls, and iPhone Expo Go behavior are verified.

## Out of Scope

- Moves, encounters, breeding details, forms, locations, and battle simulation.
- Editing stats or selecting a game version.
- Animated 3D Pokemon models.
- Favorites entry, favorite/unfavorite actions, and SQLite persistence (#4).

## Verification

The user confirmed the supplied iPhone Expo Go checklist works on 2026-11-02. Lint, typecheck, seven focused service tests, live PokeAPI contracts, browser checks, and iOS/Android bundle compilation passed. Favorites remain disabled for issue #4.
