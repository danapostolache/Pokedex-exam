# View Pokemon details

## Goal

Open a Pokemon from the list or favorites and quickly understand its identity, measurements, abilities, base stats, and evolution chain.

## Constraints

- Use a dynamic Expo Router route keyed by Pokemon ID or name and a native back action.
- Follow all Figma detail states: colored header, artwork, name, number, type badges, favorite heart, and quick About, Stats, and Evolution tabs.
- Fetch `/pokemon/{id-or-name}` and `/pokemon-species/{id}` through TanStack Query. Fetch the evolution URL returned by the species response instead of constructing it.
- Use the English species description and format API names for display without changing their underlying identifiers.
- Evolution is part of this feature and has its own loading and recoverable error state.
- Reuse the favorites hook/service and shared Pokemon presentation components; do not execute SQL in the route.

## Acceptance Criteria

- [ ] Detail is reachable from both the list and favorites and shows name, number, official artwork, and type badges in type-specific colors.
- [ ] About shows the Figma information: ID, base experience, weight, height, types, abilities, and an English description when available.
- [ ] Stats shows HP, Attack, Defense, Special Attack, Special Defense, and Speed with values and proportional visual bars.
- [ ] Evolution shows the complete API evolution chain in order with number, artwork, and name; tapping a member opens that Pokemon's detail.
- [ ] The About, Stats, and Evolution sections switch quickly, and the favorite heart adds or removes the current Pokemon.
- [ ] Pokemon, species, and evolution loads have appropriate loading and Retry states; an unknown ID shows a not-found state instead of crashing.

## Out of Scope

- Moves, encounters, breeding details, forms, locations, and battle simulation.
- Editing stats or selecting a game version.
- Animated 3D Pokemon models.
