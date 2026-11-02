# Issue #5 testing

On 2026-11-02, the user confirmed: “I tested all the steps on my iPhone and everything works.” Checked native items below record that user-reported Expo Go acceptance, alongside the developer verification recorded separately below. No specific iPhone model, iOS version, chosen server port, or separate debugger fault-injection run is inferred. After final review, the user authorized committing as `Implement Pokemon comparison` with `Closes #5` in the body, pushing to `origin/main`, and confirming issue closure.

## Open on iPhone

1. On the computer run `npx expo start --port 8083`, or use the existing development server on that port. Keep the computer and iPhone on the same Wi-Fi and scan the terminal QR code with iPhone Camera to open this project in Expo Go.
2. Reload the project to pick up the Compare implementation. If LAN cannot connect, stop that server and use `npx expo start --tunnel --port 8083`. Use the address shown by the current server.
3. Compare selections and API caches are temporary. A full JavaScript reload clears them; switching tabs retains the current mounted Compare screen. Favorites remain stored separately in SQLite. For offline tests, load the JavaScript bundle online first and disable both Wi-Fi and cellular in iPhone Settings. Cached details/images can keep working offline, so choose uncached Pokemon as described below.

## Selection and full catalogue

- [x] Compare initially shows two empty slots and asks for two different Pokemon. Open/cancel each picker, including iOS swipe dismissal. No selection or result appears from Cancel.
- [x] Select only one Pokemon. Its identity/artwork/types load while the other slot remains empty, and the screen explicitly asks for the missing Pokemon. There are no zero-filled stats or implied comparison.
- [x] The empty-search picker lists the complete catalogue. Without scrolling the home list, find `pecharunt` and `deoxys-attack`; check the form's correct number/artwork/types. Search `  PIKA  ` to check trimming, mixed case and substring matching. Try `zz-no-such-pokemon`, then clear the input: guidance appears and the complete catalogue returns.
- [x] With the keyboard open, tap a result once: it selects and dismisses the picker/keyboard. Scroll results, hide the keyboard with its Search key, and check Cancel remains reachable.
- [x] After selecting one Pokemon, open the other picker and find that same Pokemon. Its row says Already selected, is disabled, and explains that the other slot contains it. Different forms with distinct API IDs remain allowed.
- [x] With both selected, use Replace on either side. The other Pokemon stays unchanged. Cancel/swipe dismissal preserves both old selections. Repeated/rapid replacement never assigns a late response or former artwork/stats to the new identity. A double tap on a result cannot fill or overwrite another slot.

## Six stats and ties

Use **Pikachu #025** and **Eevee #133** for a live pair with a tie. These values were verified against the live service and rendered preview on 2026-11-02:

| Base stat | Pikachu | Eevee | Expected emphasis |
| --- | ---: | ---: | --- |
| HP | 35 | 55 | Eevee |
| Attack | 55 | 55 | Both Equal, identical styling |
| Defense | 40 | 50 | Eevee |
| Special Attack | 50 | 45 | Pikachu |
| Special Defense | 50 | 65 | Eevee |
| Speed | 90 | 55 | Pikachu |

- [x] Check both formatted names/numbers, artwork, Electric/Normal badges, and all six rows above. Higher values have accent color, bold type and Higher text; tied values are treated equally. The screen declares no overall winner.
- [x] Scroll to the final Speed row, then replace a selection. During an uncached load, old comparison rows disappear immediately and return only when both valid details are available.

## Loading, error and Retry

Requests have a 12-second timeout and one automatic retry, so a genuinely unavailable connection can take about 25 seconds to reach the final error. Keep the bundle loaded; reconnect before any reload that needs Metro.

- [x] **Catalogue failure:** reload online and stay out of home search/Compare picker so the full catalogue is uncached. Disconnect both network connections, open Compare's picker, and verify loading followed by an error and Retry. Restore networking and Retry: catalogue names return and selection works. This must not be mislabeled as no search matches.
- [x] **One detail failure:** reload online, open Compare's picker to cache the catalogue, and select Pikachu online. Disconnect, open the second slot, and select an uncached Pokemon such as Eevee. Pikachu and both chosen identities remain; Eevee shows loading then error/Retry. No comparison rows appear. Restore networking and Retry only Eevee: both details and stats appear. Also verify Replace can recover a failed slot.
- [x] **Both detail failures:** in a fresh session, cache only the picker catalogue, dismiss it, then disconnect. Select two uncached Pokemon. Each slot shows loading and then its own error/Retry. Restore networking and retry one at a time; the first success remains while the other is still failed. Complete the second Retry to show the comparison.
- [x] **Artwork:** check the loading indicator and stable missing/failed-image fallback. Image Retry is distinct from data Retry and must not erase either selection or loaded stats. Native image caching can prevent an offline image failure; use the controlled procedure below if needed.

## Accessibility and navigation

- [x] Check a small iPhone width, long/form names, large text and an accessibility text size. Both columns, type badges, all six labels/values, errors and Replace/Retry stay readable and reachable by scrolling. The keyboard and safe areas never cover Cancel or results.
- [x] Check light and dark appearance, including accent text and Equal values. Meaning must remain clear without distinguishing colors.
- [x] With VoiceOver, verify slot number/name, Replace, disabled duplicate explanation, busy/loading state, error and Retry controls. Each stat announces its name, both Pokemon and values, plus which is higher or that values are equal. Modal focus stays in the picker, Cancel/accessibility escape dismiss it, and focus returns to a usable Compare control.
- [x] Switch to Pokemon/Favorites and return: current Compare selections stay in the session. Home search still searches the full catalogue only when text is entered, clears back to pagination normally, and retains its existing grid behavior. Open detail to check shared type badges/artwork; smoke-check Favorites and native Share without changing their intended behavior.

## Controlled failures (developer-assisted, no shipped debug switch)

Use React Native DevTools from the Expo terminal (`j`) with the iPhone connected. These steps are only needed when caching/network timing makes a failure impossible to reproduce. Record them as native verification only after actually observing the behavior.

For a selected-data failure, set a Sources breakpoint immediately before `fetch` in `src/services/pokeapi.ts`. On the paused request, save and temporarily override the global fetch from the DevTools console:

```js
var issue5OriginalFetch = globalThis.fetch;
globalThis.fetch = async function (input, init) {
  if (String(input).includes('/pokemon/133')) {
    throw new Error('Controlled Eevee request failure');
  }
  return issue5OriginalFetch(input, init);
};
```

Remove the breakpoint and resume. Both the initial request and automatic retry for Eevee fail while other Pokemon still load. Observe the failed slot and preserved successful slot. Restore with `globalThis.fetch = issue5OriginalFetch`, then tap Eevee's Retry and confirm recovery. For catalogue failure use `String(input).includes('/pokemon?')` instead; do not intercept all requests. Restore the override and remove breakpoints after testing. A JavaScript reload also discards the override.

For image fallback, set a breakpoint at the return in the `Artwork` function in `src/components/pokemon-artwork.tsx`. While paused on the chosen Pokemon, temporarily assign its local `uri` parameter to `null` to verify No artwork available, or to `https://pokeapi.co/api/v2/pokemon/25/` (JSON, not an image) to trigger the native image error path. Remove the breakpoint and resume. For the latter, tap Retry image: the next render receives the original artwork prop and should recover. These debugger-only parameter changes never alter repository files or saved data.

## Developer verification

Run from the repository root:

```sh
npx expo lint
npx tsc --noEmit
node --test scripts/check-pokemon-compare.mjs scripts/check-pokemon-detail.mjs scripts/check-pokemon-favorites.mjs
node scripts/check-pokemon-detail.mjs --live
npx expo export --platform ios --output-dir .expo/issue-5-ios
npx expo export --platform android --output-dir .expo/issue-5-android
```

Verified on 2026-11-02: ESLint, TypeScript, all 25 automated checks (8 Compare, 7 detail, 10 favorites), live PokeAPI detail/form/evolution contracts, and final iOS/Android Hermes compilation. The Compare checks execute the actual reducer, search functions, service and TanStack Query options/observers, including cache reuse, duplicate/rapid selection, higher/lower/equal stats, independent failures/Retry and cancellation/late results after replacement. Node's existing SQLite adapter emits an experimental-runtime warning during favorites checks; this is not an app warning.

The local browser preview at 390px verified initial empty slots, full catalogue browsing, mixed-case/trimmed search, no matches, duplicate feedback, replacing either side, alternate form identity/artwork/types, preserving the successful side during an uncached replacement, six live stats, Equal styling, canceling replacement, and retaining selections across tabs. The layout was also inspected at 320px. Home search, opening detail with the shared type badges, Back preserving search, and clearing search back to the paginated list passed regression smoke checks. No browser runtime warnings/errors were observed. Browser results alone do not establish native behavior. The user subsequently confirmed all iPhone testing steps passed; the checked native checklist records that user-reported acceptance.

## Final review — 2026-11-02

Reviewed all issue #5 changes against the six acceptance criteria and repository architecture. Full-catalogue selection retains the shared lazy catalogue cache and home-search behavior; duplicate IDs are prevented; replacements use independent detail query keys without placeholder data; successful selections survive failures on the other side; six mapped base stats use higher/lower/equal presentation; artwork and type badges reuse shared components. No dependency, SQL, root QueryClient or tab-navigation changes were introduced.

Final review found no actionable defects requiring a code change. ESLint, TypeScript and all 25 automated Compare/detail/favorites checks passed again after the user's iPhone acceptance. Earlier live API checks and final iOS/Android Hermes exports remain valid: application source has not changed since those checks. The existing Node SQLite experimental warning belongs to the test runtime.

No outstanding required fixes or acceptance items. At the end of this review no commit, push or issue closure had been performed; the user subsequently authorized those actions as recorded above.
