# Compare Pokemon

## Goal

Choose any two Pokemon and see them side by side so it is immediately clear which one is stronger for each base stat.

## Constraints

- Compare is a third bottom-navigation screen designed in the visual language of the supplied Figma because no compare screen is provided.
- Show two selection slots. Tapping either slot opens a searchable Pokemon picker; after both slots are filled, show the comparison on the same screen and emphasize the stronger value for each stat.
- Each selection searches the complete lightweight Pokemon name catalogue, not only loaded list pages.
- Fetch both selected Pokemon through the shared TanStack Query Pokemon service and reuse artwork, type badges, stat names, and theme tokens.
- Keep selections in screen state; comparison history and persistence are not required.
- Prevent comparing until two different valid Pokemon are selected, and provide a clear way to replace either selection.
- Include loading, empty, and recoverable error states. Add no charting or search dependency.

## Acceptance Criteria

- [ ] The Compare tab starts with two selection slots, and tapping either one opens a searchable picker containing the complete API catalogue.
- [ ] Before two selections are complete, the screen clearly prompts for the missing Pokemon and does not show a misleading result.
- [ ] Two selected Pokemon appear side by side with formatted names, numbers, artwork, and type badges.
- [ ] HP, Attack, Defense, Special Attack, Special Defense, and Speed are shown for both, with the higher value visually emphasized and ties shown equally.
- [ ] Either selection can be replaced without leaving the screen, and selecting the same Pokemon twice is prevented with clear feedback.
- [ ] Loading both details is visible; a failed request shows Retry while preserving the selections that succeeded.

## Out of Scope

- Battle simulation, type-effectiveness predictions, moves, levels, abilities, and declaring an overall winner.
- Comparing more than two Pokemon or saving and sharing comparison history.
- A charting library or complex animated chart.
