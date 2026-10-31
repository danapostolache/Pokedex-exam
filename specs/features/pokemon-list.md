# Browse the Pokemon list

## Goal

Browse the complete live Pokemon catalogue in a fast, recognizable grid and open any Pokemon for more information.

## Constraints

- The home route follows the Figma splash and Home screens: pale background, Rubik font, search field, two-column cards, and bottom navigation.
- Use PokeAPI `/pokemon` pagination through a TanStack Query infinite query. Do not load details for the entire catalogue at startup.
- Pokemon cards are reusable UI and use artwork derived from live PokeAPI data, not a hardcoded Pokemon list.
- Colors, spacing, typography, type colors, and card styling come from theme tokens.
- Include loading and recoverable error states. Keep scrolling smooth with `FlatList` virtualization.
- The options action sheet follows the Figma and offers Open Pokemon, Add or Remove from favorites, Share, and Cancel.

## Acceptance Criteria

- [ ] App launch shows the Figma-style Pokemon splash before the home screen, using the supplied Rubik font and visual assets.
- [ ] Home displays the complete PokeAPI Pokemon catalogue, about 1,300 entries, in the Figma-style two-column grid.
- [ ] Each card displays the Pokemon number, artwork, formatted name, and options action; tapping the card opens its detail screen.
- [ ] More pages load as the user nears the end without blocking already visible cards, duplicated entries, or noticeable layout jumps.
- [ ] The card options action opens the native-style sheet with working Open Pokemon, Favorite, Share, and Cancel actions.
- [ ] Initial loading shows a designed loading state; a failed request shows an error message and Retry action.

## Out of Scope

- Filtering, sorting, generation filters, and type filters.
- Search behavior, which is specified separately.
- Offline storage of the complete catalogue.
