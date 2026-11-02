# Issue #4 iPhone testing

The user confirmed “Everything works” after receiving the iPhone Expo Go checklist on 2026-11-02, then confirmed all required tests pass. Checked functional items below record that user-reported acceptance. The user explicitly skipped the optional native SQLite fault-injection test; its service behavior is covered by automated SQLite tests.

## Open in Expo Go

1. Keep the computer and iPhone on the same Wi-Fi. In the project terminal run `npx expo start --port 8083` if the verification server is not already running. Scan its QR code using the iPhone Camera and open Expo Go. Use the address printed by the running server; the computer's LAN address can change.
2. Reload the project to load the updated code. If LAN cannot connect, stop that server and use `npx expo start --tunnel --port 8083`. No package installation is needed.
3. Do not uninstall Expo Go or clear its project data during persistence testing. A normal reload and a force-close/reopen should retain saved favorites in this project's database.

## Empty state, add/remove and shared state

- [x] With no favorites, open Favorites. It shows “My favorites”, then “No favorites yet” and instructions to use a detail heart or card options. It must not briefly show an empty collection while reading the database. If favorites already exist, remove them normally to reach the empty state.
- [x] From the Pokemon list, open Bulbasaur and tap its heart. It becomes filled after saving; open Favorites and find Bulbasaur. Return to the list and open its options: the action says “Remove from favorites”.
- [x] Remove Bulbasaur through its card options. The options action changes to “Favorite”, the detail heart is unfilled, and Favorites updates without a manual reload.
- [x] Search for `pika`, save Pikachu through options, open its detail and check the filled heart. Remove with the heart, go Back and reopen search-result options: it says “Favorite”. Search text/results remain intact.
- [x] Save several Pokemon from list/search/detail. Favorites uses the same responsive cards, showing newest saved first. Add/remove repeatedly and tap quickly; there are no duplicate cards, stale hearts, crashes or stuck pending controls.
- [x] Search for `deoxys-attack`, save it and check the correct form appears in Favorites. Save an evolution member from its detail too. Different Pokemon/forms retain independent favorite states.
- [x] Remove an entry using the options on Favorites. It disappears after the write succeeds; Cancel still works. Remove the last saved entry and check the empty guidance returns.

## Full-close persistence

- [x] Save at least two Pokemon, including one from search. Note their identities and order.
- [x] Open the iPhone app switcher and swipe Expo Go away to fully close it. Reopen Expo Go and the **same project** through its QR/address. Both saved Pokemon are still on Favorites and their detail hearts are filled.
- [x] Remove one Pokemon, fully close Expo Go again, and reopen. The removed Pokemon stays removed while the other remains saved. A Fast Refresh or merely backgrounding the app is not this test.

## API loading, error and Retry

Cached card data/images may continue to work offline. To force an uncached Favorites card request: save several Pokemon, reload the app online but stay on the Pokemon tab, then disconnect before opening Favorites. A full JavaScript reload clears the in-memory API query cache while leaving SQLite intact. Do not open their details or search results first in that fresh session.

- [x] With the bundle loaded, disable both Wi-Fi and cellular in iPhone Settings and open Favorites. Uncached cards show loading, then a data error and Retry (allow about 25 seconds for timeout/retry). Saved IDs remain represented by numbered fallback cards; this must not become “No favorites yet”.
- [x] Restore networking and tap each failed card's Retry. The correct name/artwork loads. Retry must not clear the rest of the collection. Missing/failed artwork has a stable fallback and image Retry.
- [x] While offline with the JavaScript bundle already loaded, remove a saved Pokemon through Favorites options. SQLite removal works independently of API availability, and other saved IDs remain. Restore networking before relaunching Expo Go if the bundle needs the development server.

## Navigation and accessibility

- [x] From Favorites open details by tapping artwork/name, then by choosing Open Pokémon. Back and iOS swipe-back return to Favorites with its current membership. Opening from options must dismiss the sheet first.
- [x] Share opens the native iOS share sheet with the Pokemon name/link; cancel sharing and use Cancel to dismiss options. Also check Share/Cancel from normal list and search results.
- [x] Check light/dark appearance and large iOS text, including an accessibility text size. Names, empty/error messages, options and Retry remain readable/reachable; the grid changes to one column when necessary.
- [x] With VoiceOver, check the heart and options announce Save/Remove plus the Pokemon name, selected state, and disabled/busy state while loading/saving. Errors and Retry are discoverable. An unread database must announce unavailable/loading state rather than claiming the Pokemon is unsaved.

## Controlled database failure verification (developer-assisted)

Optional and explicitly skipped by the user. The procedure is retained for future diagnostics; no native fault-injection result is claimed.

Airplane Mode cannot simulate SQLite failures. Automated tests exercise real SQLite with failures at open, initialization, read, write, post-write read and commit, plus safe Retry and preservation of previously saved rows. The following procedure additionally checks the native error presentation without changing SQL, deleting data or shipping a debug switch.

Use React Native DevTools from the Expo terminal (`j`) and Sources breakpoints in `src/services/favorites.ts`. Each fault below replaces one method for one call on the **paused local `db` object**, restoring the method before it throws. Clear each breakpoint after injecting, then resume. Use a developer working with the iPhone tester for these steps.

1. Initialization: set a breakpoint immediately before the first `db.execAsync` in `openDatabase` and reload the project. While paused, evaluate:

   ```js
   var issue4Exec = db.execAsync;
   db.execAsync = async function () {
     db.execAsync = issue4Exec;
     throw new Error('Controlled initialization failure');
   };
   ```

   Open Favorites: it must show a load error and Retry, never a false empty collection. Tap Retry after removing the breakpoint; saved entries must return and detail/options must re-enable.

2. Read: set a breakpoint immediately before `db.getAllAsync` in `readRecords`, reload and inject the same one-shot override for `getAllAsync`. Resume, confirm the load error, and tap Retry. Existing favorites remain saved.
3. Write: set a breakpoint immediately before `db.runAsync` in `setFavorite`. Attempt to save/remove a known Pokemon. While paused, evaluate:

   ```js
   var issue4Run = db.runAsync;
   db.runAsync = async function () {
     db.runAsync = issue4Run;
     throw new Error('Controlled write failure');
   };
   ```

   Resume. The prior saved/unsaved state remains on every screen, an error and Retry appear, and the app does not claim success. Retry performs the original intended operation exactly once. Repeat once for add and once for removal.
4. Remove all breakpoints, reload normally, and repeat the full-close persistence test. These temporary debugger overrides do not survive reloads. Do not delete/rename the database, uninstall Expo Go, or corrupt a saved collection to force an error.

- Not performed (optional): native initialization/read failure presentation and Retry.
- Not performed (optional): native add/remove failure presentation, Retry and subsequent restart.

## Developer checks

```sh
npx expo lint
npx tsc --noEmit
node --test scripts/check-pokemon-favorites.mjs
node --test scripts/check-pokemon-detail.mjs
node scripts/check-pokemon-detail.mjs --live
npx expo export --platform ios --output-dir .expo/issue-4-ios
npx expo export --platform android --output-dir .expo/issue-4-android
```

The favorites tests use Node 22's built-in SQLite adapter and the actual service SQL, including reopening the database in another process. Node 22.14 emits its own experimental SQLite warning; this is a test-runtime warning, not an app warning. No dependency, native directory or app configuration changes are required. Generated bundles stay under ignored `.expo/` directories. After confirming all required tests pass, the user authorized committing as `Implement Pokemon favorites` with `Closes #4` in the body and pushing to `origin/main`.

Verified on 2026-11-02: ESLint, TypeScript, all 10 favorites checks, all 7 detail checks, live PokeAPI contracts, and final iOS/Android Hermes bundle compilation. Browser smoke verification confirmed the Favorites grid and shared detail navigation with matching saved heart state and no runtime warnings/errors. `metro.config.js` adds the documented SQLite WebAssembly support and local development isolation headers so importing SQLite does not break the browser preview. The user subsequently confirmed the iPhone experience works. Optional native database fault injection was explicitly skipped by the user.
