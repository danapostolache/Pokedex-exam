# Browse the Pokemon list

## Goal

Browse the complete live Pokemon catalogue in a fast, recognizable grid and share a Pokemon through the native share sheet. This feature can be completed independently of the other feature issues.

## Design references

- [Mobile screens](https://www.figma.com/design/QEo80GDW87L98KyTslTFol/Untitled?node-id=0-1)
- [Components and icons](https://www.figma.com/design/QEo80GDW87L98KyTslTFol/Untitled?node-id=1-16982)
- [Supplied fonts](https://github.com/Kevinvandenhoek/inholland-react-native-course/blob/main/exam/assets/fonts.zip): Rubik Regular, Medium, and Bold.

## Constraints

- Follow the supplied splash, Home, cards, and Options designs with a pale background, Rubik typography, and responsive layouts.
- Rework the existing AnimatedSplashOverlay as one splash flow; remove its obsolete Expo implementation.
- Use Expo Router Tabs for Pokemon, Favorites, and Compare. Pokemon is the live list; the others are navigable placeholders.
- Use PokeAPI /pokemon pagination through a TanStack Query infinite query and the shared QueryClient. Do not load details for the entire catalogue at startup.
- Cards are reusable presentation with live artwork. Cache metadata for rendered/near-visible cards through TanStack Query.
- Colors, spacing, typography, type colors, and card/sheet/tab styling come from theme tokens.
- Keep scrolling smooth with FlatList virtualization, stable keys and image dimensions.
- Include initial loading, empty, initial error/Retry, pagination loading/error/retry, and artwork fallback states.
- Offer disabled Open Pokemon (until #3), disabled Favorite (until #4), working Share, and Cancel.
- Search is disabled presentation only; no filtering or keyboard.
- Respect safe areas, touch targets, accessibility labels, contrast, and large text.
- Keep font scaling enabled and show names in full without a line limit or fixed footer height.

## Acceptance Criteria

- [x] Launch displays the Figma-style Pokemon splash before the list, using the supplied logo and Rubik font; the existing AnimatedSplashOverlay is reused/reworked with one splash flow and no unused Expo splash implementation.
- [x] Expo Router provides Pokemon, Favorites, and Compare tabs. Pokemon shows the live list; Favorites and Compare show navigable placeholders only.
- [x] Pokemon displays the full catalogue progressively through PokeAPI pagination in a responsive Figma-style two-column grid at standard text sizes, adapting to one column when larger text needs more room, using the API's returned total rather than a hardcoded entry count.
- [x] Each reusable card displays the Pokemon number, live artwork, formatted name, and an accessible options action. Card taps do not attempt detail navigation in this issue.
- [x] More pages load near the end while existing cards remain usable, with stable identity, no duplicated entries, smooth scrolling, and no noticeable layout jumps.
- [x] The options menu shows Open Pokemon, Favorite, Share, and Cancel. Open Pokemon is disabled until #3; Favorite is disabled until #4, with accessible unavailable states.
- [x] Share opens the native share sheet with the selected Pokemon's name and PokeAPI link; Cancel dismisses the options menu, and dismissing native sharing returns safely to the app.
- [x] Initial loading has a designed state; initial failures show an error and working Retry; empty results have a clear state; pagination failures retain loaded cards and offer retry. Artwork failure has a stable fallback.
- [x] Layouts respect safe areas, readable contrast, touch targets, and large text; list and options behavior is verified in Expo Go.

## Out of Scope

- Search behavior (#2).
- Details, stats, evolution, and detail navigation (#3).
- Adding/removing favorites and SQLite persistence (#4).
- Actual comparison functionality (#5).
- Filtering, sorting, generation filters, and type filters.
- Offline storage of the complete catalogue.

## Verification scope

Project acceptance testing is iOS-only. The user verified the feature and large-text behavior in Expo Go on an iPhone. Android device testing is not required; successful Android bundle compilation is recorded as a technical check.

## Review and completion

After implementation, wait for the user to review the changes, run the checks, and test the app on their phone. Do not close issue #1 directly or commit/push without explicit instructions. The approved final commit will include Closes #1 so GitHub closes the issue through that commit.
