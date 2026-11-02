# Issue #3 iPhone testing

The user confirmed that the supplied iPhone Expo Go checklist works on 2026-11-02. Checked items record that user-reported acceptance; automated and browser checks were performed separately. The user then authorized the final review, commit, and push with Closes #3 in the commit body.

## Open in Expo Go

1. Keep the computer and iPhone on the same Wi-Fi. Reload the project in Expo Go to get a clean launch after development changes.
2. The verification server uses port 8082. Open `exp://192.168.2.9:8082` on the iPhone while that server is running. This address is specific to the current local network; the QR/server address is authoritative if it changes.
3. To start a new server from the project terminal, run `npx expo start --port 8082` (stop the old server on that port first). Scan the terminal QR code with the iPhone Camera and open Expo Go. If LAN cannot connect, use `npx expo start --tunnel --port 8082` instead.

## Normal list and back navigation

- [x] Scroll down the normal list, tap a card's artwork and then its name on separate visits. Both open the correct detail. Back returns to the prior list position and loaded pages.
- [x] Open the card options and choose Open Pokémon. The sheet dismisses before detail opens. Return with Back and then repeat using the iOS swipe from the left edge.
- [x] The options button and artwork Retry (when shown) perform their own action rather than opening details. Share still opens the native iOS share sheet, and Cancel still dismisses the options sheet.

## Search

- [x] Type `pika`, open Pikachu, return, and check that the search and results remain. Also test Open Pokémon from a search result's options.
- [x] Search for `deoxys-attack`, open Deoxys Attack, and check its Psychic type, measurements, description, and Evolution. Its Pokemon ID differs from its species ID; the description must load successfully.
- [x] Clear the search. The previous normal-list pages return and scrolling still loads more pages.

## About, Stats and Evolution

- [x] Bulbasaur: official artwork, #001, Grass and Poison. About currently has 64 XP, 6.9 kg, 0.7 m, Overgrow and hidden Chlorophyll, plus an English description. Check live API values rather than the static Figma sample when they differ.
- [x] Bulbasaur Stats: HP 45, Attack 49, Defense 49, Special Attack 65, Special Defense 65, Speed 45. All bars use the same 255-point scale.
- [x] Switch sections repeatedly. Returning to loaded sections is quick and does not show another Pokemon's content.
- [x] Bulbasaur Evolution: Bulbasaur → Ivysaur → Venusaur. Tap Ivysaur, check its detail, then Back returns to Bulbasaur's Evolution section. Back again returns to the list/search.
- [x] Eevee Evolution: Eevee and all eight evolutions. Every branch says “Evolves from Eevee”; scrolling reaches Sylveon. Tap a member and return.
- [x] Ditto Evolution: one member and “This Pokémon has no further evolutions.”

## Loading, error, Retry and not found

For these offline checks, turn off **both Wi-Fi and cellular data in Settings**. Cached screens/images may still work; that is expected. Keep Expo Go open with the JavaScript bundle already loaded. Restore networking before reloading Expo Go itself.

- [x] Initial detail failure: load/search for a Pokemon whose detail you have not opened, disconnect networking, then open its card. Loading appears, followed by a recoverable error (allow about 25 seconds for timeout and one retry). Restore networking and tap Retry. Correct details load and Back remains usable.
- [x] Evolution failure independent of About/Stats: open a different Pokemon online and wait for About's description. Do not open its Evolution section yet. Disconnect networking, then select Evolution. Allow up to 25 seconds for the failure. About and Stats remain usable. Restore networking, return to Evolution and tap Retry; the chain loads.
- [x] A member-data failure can show an individual member's Retry. Retrying that member must not clear the other loaded members. Artwork failure offers Retry image separately; text remains readable.
- [x] Unknown ID: open `exp://192.168.2.9:8082/--/pokemon/999999999` while the current LAN server is running. Expect “Pokémon not found”, not a generic connection error or an endless spinner. Back works; a fresh direct entry without history can return to the list.
- [x] Invalid identifier: similarly open `exp://192.168.2.9:8082/--/pokemon/0`. The not-found state should appear immediately, with no API request needed.

Species-description failures, missing English text/artwork, malformed responses, cancellation, and the six-request limit are covered by automated service checks. A species failure shows a description Retry while base About/Stats remain available; Evolution offers a species Retry if it needs that missing reference. Reliably forcing only that very short request on a physical phone requires a controlled network test; ordinary airplane-mode timing is not a deterministic species-only check.

## Disabled Favorites and accessibility

- [x] The heart is visible and disabled. Tapping it changes nothing. The options Favorite stays disabled, and the Favorites tab remains its placeholder.
- [x] Turn on VoiceOver: Back, section controls, evolution-member Open actions and Retry controls have meaningful labels; Favorite is announced as disabled and the active section as selected.
- [x] Increase iOS text size, including a larger accessibility size. Names, measurements, abilities, branches and all buttons stay readable and reachable. Check both light and dark appearance, safe areas, and scrolling to the final section content.
- [x] Try quick repeated section changes and several member/back navigations. There are no crashes, mixed Pokemon data, stuck sheets or inaccessible controls.

## Developer verification

Run from the project root:

```sh
npx expo lint
npx tsc --noEmit
node --test scripts/check-pokemon-detail.mjs
node scripts/check-pokemon-detail.mjs --live
npx expo export --platform ios --output-dir .expo/issue-3-ios
npx expo export --platform android --output-dir .expo/issue-3-android
```

Native bundle compilation is a technical check, not confirmation of physical-device behavior. Android device acceptance is not required for this project. No dependencies or native project directories were added. After successful iPhone acceptance, the user explicitly authorized committing as Implement Pokemon details with Closes #3 in the body and pushing to origin/main so GitHub closes the issue through that commit.
