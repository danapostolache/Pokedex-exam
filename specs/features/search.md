# Search Pokemon

## Goal

Find any Pokemon by typing part of its name, including Pokemon that have not yet appeared in the paginated home list.

## Constraints

- Search lives in the Figma search field at the top of the home screen; it does not create a separate route.
- Fetch the lightweight full Pokemon name catalogue through TanStack Query, then filter locally.
- Matching is case-insensitive substring matching after trimming whitespace; for example, `pika` finds Pikachu.
- Search result cards reuse the same card component and options action as the normal list.
- Use the supplied Rubik font and existing theme tokens. Add no search dependency.
- Include loading, empty, and recoverable error states for the catalogue query.

## Acceptance Criteria

- [ ] The home screen has the Figma-style search field with placeholder `Search for Pokemon...`.
- [ ] Results update while the user types and match any part of a name regardless of letter case.
- [ ] Search covers the complete API catalogue, including Pokemon that the user has not scrolled to in the main list.
- [ ] Search results use the same Pokemon cards and open the same detail and options actions as the main list.
- [ ] A query with no matches shows a clear empty state, and clearing the field restores the paginated catalogue.
- [ ] Loading the searchable catalogue has a visible state; failure shows an error and Retry action without crashing the list.

## Out of Scope

- Search by number, type, ability, generation, or fuzzy spelling.
- Search history, suggestions, and recent searches.
- A separate search-results route.
