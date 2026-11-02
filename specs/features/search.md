# Search Pokemon

## Goal

Find any Pokemon by typing part of its name, including Pokemon that have not yet appeared in the paginated home list.

## Constraints

- Search lives in the Figma search field at the top of the home screen; it does not create a separate route.
- Fetch the lightweight full Pokemon name catalogue through TanStack Query, then filter locally.
- Matching is case-insensitive substring matching after trimming whitespace; for example, `pika` finds Pikachu.
- Search result cards reuse the same card component and options action as the normal list.
- Card taps do not navigate to details. Open Pokemon remains disabled until issue #3, and Favorite remains disabled until issue #4; Share and Cancel work in the existing options sheet.
- Keep the normal paginated catalogue cached independently of search. Clearing the field or entering only whitespace restores its loaded pages and pagination.
- Use the supplied Rubik font and existing theme tokens. Add no search dependency.
- Include loading, empty, and recoverable error states for the catalogue query.

## Acceptance Criteria

- [x] The home screen has the Figma-style search field with placeholder `Search for Pokemon...`.
- [x] Results update while the user types and match any part of a name regardless of letter case.
- [x] Search covers the complete API catalogue, including Pokemon that the user has not scrolled to in the main list.
- [x] Search results reuse the normal Pokemon cards and options sheet, with working Share and Cancel. Card taps do not navigate; Open Pokemon is disabled until #3 and Favorite is disabled until #4.
- [x] A query with no matches shows a clear empty state, and clearing the field restores the paginated catalogue.
- [x] Loading the searchable catalogue has a visible state; failure shows an error and Retry action without crashing the list.

## Out of Scope

- Search by number, type, ability, generation, or fuzzy spelling.
- Search history, suggestions, and recent searches.
- A separate search-results route.
- Details, stats, evolution, and detail navigation (#3).
- Adding/removing favorites and SQLite persistence (#4).

## Verification

The user confirmed all supplied iPhone test points passed in Expo Go on 2026-11-02: full-catalogue search, case-insensitive substring matching and whitespace trimming, no-match and clear behavior, preserved paginated pages, loading/error/Retry recovery, native Share/Cancel, disabled detail/favorite actions, rapid typing, keyboard behavior, scrolling, safe areas, and larger iOS text. Android device testing is not required for this project.

Lint, typecheck, focused checks, the live API check, browser checks, and iOS bundle compilation passed during implementation. After successful iPhone acceptance, the user explicitly approved committing the issue #2 changes and pushing to `origin/main`, with `Closes #2` in the commit body so GitHub closes the issue.
