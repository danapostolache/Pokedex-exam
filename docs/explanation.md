# Explanation - Pokedex

**Route:** Pokedex  
**Tools:** Codex

## 1. My technical choices

For the Pokemon list, I chose pagination because loading every Pokemon and all their details at once would make the app slow. TanStack Query loads the list page by page in `src/hooks/use-pokemon-list.ts:10`, and the API request is in `src/services/pokeapi.ts:196`.

For search, I load the full list of Pokemon names once and keep it in the TanStack Query cache. The search happens locally, and the app only loads details for the results it needs to show. The catalogue request is in `src/services/pokeapi.ts:222`, and the filtering is in `src/hooks/use-pokemon-search.ts:16`.

I used SQLite for favorites because they need to stay saved after the app is closed. I only save the Pokemon ID and the time it was added. The rest of the Pokemon information still comes from the API. The table is created in `src/services/favorites.ts:15`, and favorites are added or removed in `src/services/favorites.ts:67`.

The two Pokemon selected for comparison are only kept in screen state. I did not save them because the comparison does not need to stay after restarting the app. This is handled in `src/hooks/use-pokemon-compare.ts:13` and `src/hooks/use-pokemon-compare.ts:48`.

For navigation, I used three tabs: Pokemon, Favorites, and Compare. The detail page opens on top of those tabs using a stack. The stack is in `src/app/_layout.tsx:27`, and the tabs are in `src/app/(tabs)/_layout.tsx:14`.

For the native feature, I chose Share. It opens the normal iPhone share screen so the user can share a Pokemon link. This is in `src/hooks/use-pokemon-actions.ts:39`.

For the design, I followed the Figma file and used the Rubik fonts, theme values, and Pokemon type colours. These are defined in `src/constants/theme.ts:43`. I did change one thing after testing on my iPhone. With larger text, some Pokemon names did not fit well in two columns, so the list now changes to one column when needed. That check is in `src/components/pokemon-list.tsx:28`.

## 2. Search: from the API to the screen

The search starts with `getPokemonCatalogue` in `src/services/pokeapi.ts:222`. It gets the Pokemon names and URLs from PokeAPI. `usePokemonSearch` saves that list in the TanStack Query cache. It also removes extra spaces, ignores uppercase or lowercase differences, and checks whether a name contains what the user typed. This happens in `src/hooks/use-pokemon-search.ts:6` and `src/hooks/use-pokemon-search.ts:16`.

`usePokemonList` decides whether the screen should show the normal pages or the search results. While the user is searching, it also stops loading more normal list pages. That logic is in `src/hooks/use-pokemon-list.ts:28` and `src/hooks/use-pokemon-list.ts:38`. `PokemonList` then shows the results and handles loading, errors, Retry, and no results in `src/components/pokemon-list.tsx:64`.

## 3. A suggestion I changed

During issue #1, the agent suggested keeping Open Pokemon and Favorite disabled, but also leaving those requirements unfinished in issue #1. This can be seen in `chat-history/issue-1-pokemon-list.md:62`. I did not want that because I wanted to finish and close each issue before moving on to the next one.

I explained that the detail page belongs to issue #3, favorites to issue #4, search to issue #2, and compare to issue #5. I also asked to update the feature specification and the GitHub checklist. My message starts in `chat-history/issue-1-pokemon-list.md:76`. After that change, issue #1 only contained the Pokemon list work, so I could test it and close it separately.
