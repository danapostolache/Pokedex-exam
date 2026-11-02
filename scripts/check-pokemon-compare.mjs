// node --test scripts/check-pokemon-compare.mjs
// Runs the actual reducer, search logic, service and query options; no test dependency.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { QueryClient, QueryObserver } from '@tanstack/react-query';
import ts from 'typescript';

const dataURL = (code) => 'data:text/javascript;base64,' + Buffer.from(code).toString('base64');
async function load(path, imports = {}) {
  const source = await readFile(new URL('../' + path, import.meta.url), 'utf8');
  let code = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }).outputText;
  for (const [name, url] of Object.entries({ react: import.meta.resolve('react'), '@tanstack/react-query': import.meta.resolve('@tanstack/react-query'), ...imports })) {
    code = code.replaceAll("'" + name + "'", JSON.stringify(url));
  }
  return dataURL(code);
}
const apiURL = await load('src/services/pokeapi.ts');
const detailURL = await load('src/hooks/use-pokemon-detail.ts', {
  '@/services/pokeapi': apiURL,
  'expo-router': dataURL('export const router = {};'),
  '@/hooks/use-favorites': dataURL('export function useFavorite() { throw new Error("Unexpected favorites query"); }'),
});
const searchURL = await load('src/hooks/use-pokemon-search.ts', { '@/services/pokeapi': apiURL });
const compare = await import(await load('src/hooks/use-pokemon-compare.ts', {
  '@/services/pokeapi': apiURL, '@/hooks/use-pokemon-detail': detailURL, '@/hooks/use-pokemon-search': searchURL,
}));
const search = await import(searchURL);
const api = await import(apiURL);
const base = api.POKEAPI_BASE_URL;
const summary = (id, name = 'pokemon-' + id) => ({ id, name, displayName: api.formatPokemonName(name) });
const statKeys = ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed'];
const pokemon = (id, values = [45, 49, 49, 65, 65, 45]) => ({
  id, name: 'pokemon-' + id, weight: 69, height: 7, base_experience: 64, abilities: [],
  species: { name: 'pokemon-' + id, url: base + 'pokemon-species/' + id + '/' },
  sprites: { front_default: null, other: { 'official-artwork': { front_default: 'official-' + id + '.png' } } },
  types: [{ slot: 1, type: { name: 'grass' } }],
  stats: statKeys.map((name, index) => ({ stat: { name }, base_stat: values[index] })),
});
const response = (body, status = 200) => new Response(JSON.stringify(body), { status });
const catalogue = [summary(1, 'bulbasaur'), summary(1025, 'pecharunt'), summary(10002, 'deoxys-attack')];
const page = { count: catalogue.length, next: null, results: catalogue.map(({ id, name }) => ({ name, url: base + 'pokemon/' + id + '/' })) };

function mock(t, fetcher) {
  const original = globalThis.fetch;
  globalThis.fetch = fetcher;
  t.after(() => { globalThis.fetch = original; });
}
function fixture(t) {
  const client = new QueryClient();
  const subscriptions = [];
  t.after(() => { subscriptions.forEach((unsubscribe) => unsubscribe()); client.clear(); });
  const observe = (options) => {
    const observer = new QueryObserver(client, options);
    const unsubscribe = observer.subscribe(() => {});
    subscriptions.push(unsubscribe);
    return observer;
  };
  return { client, observe };
}
async function until(predicate) {
  const deadline = Date.now() + 4000;
  while (!predicate()) {
    if (Date.now() > deadline) throw new Error('Query did not reach expected state');
    await new Promise((resolve) => setTimeout(resolve, 2));
  }
}
const choose = (state, slot, id) => compare.compareReducer(compare.compareReducer(state, { type: 'open', slot }), { type: 'select', pokemon: summary(id) });

test('empty/missing selections stay disabled and never produce a comparison', async (t) => {
  let requests = 0;
  mock(t, async () => { requests++; return response(pokemon(1)); });
  const { observe } = fixture(t);
  const observer = observe(compare.pokemonComparisonQuery(null));
  assert.equal(observer.getCurrentResult().fetchStatus, 'idle');
  assert.equal(requests, 0);
  assert.deepEqual(compare.initialCompareState.selections, [null, null]);
  assert.deepEqual(compare.getComparisonRows(), []);
  assert.deepEqual(compare.getComparisonRows(await api.getPokemonDetail('1')), []);
});

test('picker browses complete catalogue, home search stays lazy, and both reuse one cache', async (t) => {
  let requests = 0;
  mock(t, async (url) => { requests++; assert.equal(url, base + 'pokemon?limit=100000&offset=0'); return response(page); });
  const { observe } = fixture(t);
  const home = observe(search.pokemonSearchOptions('  '));
  const picker = observe(search.pokemonSearchOptions('', { browse: true, enabled: false }));
  assert.equal(requests, 0);
  picker.setOptions(search.pokemonSearchOptions('', { browse: true }));
  await until(() => picker.getCurrentResult().isSuccess);
  home.setOptions(search.pokemonSearchOptions('  DEOXYS-ATT  '));
  await until(() => home.getCurrentResult().isSuccess);
  assert.equal(requests, 1);
  assert.equal(home.getCurrentResult().data.length, 3);
  assert.deepEqual(search.filterPokemonCatalogue(home.getCurrentResult().data, '  DEOXYS-ATT  ').map((entry) => entry.id), [10002]);
  assert.deepEqual(search.filterPokemonCatalogue(home.getCurrentResult().data, '').map((entry) => entry.id), [1, 1025, 10002]);
  assert.equal(search.filterPokemonCatalogue(catalogue, 'pech')[0].id, 1025);
  assert.deepEqual(search.filterPokemonCatalogue(catalogue, 'no-such-name'), []);
  picker.setOptions(search.pokemonSearchOptions('', { browse: true, enabled: false }));
  assert.equal(requests, 1);
});

test('catalogue failure is recoverable with Retry and never becomes a false empty result', async (t) => {
  let fail = true;
  mock(t, async () => response(fail ? {} : page, fail ? 503 : 200));
  const { observe } = fixture(t);
  const observer = observe(search.pokemonSearchOptions('', { browse: true }));
  assert.equal(observer.getCurrentResult().isPending, true);
  await until(() => observer.getCurrentResult().isError);
  assert.equal(observer.getCurrentResult().data, undefined);
  fail = false;
  await observer.refetch();
  assert.equal(observer.getCurrentResult().data.length, 3);
});

test('duplicate guard, cancel and replacement preserve the opposite selection, including rapid taps', () => {
  let state = choose(compare.initialCompareState, 0, 1);
  const one = state;
  state = compare.compareReducer(state, { type: 'select', pokemon: summary(4) });
  assert.equal(state, one); // A second tap after selection cannot overwrite the slot.
  state = compare.compareReducer(state, { type: 'open', slot: 1 });
  const open = state;
  state = compare.compareReducer(state, { type: 'select', pokemon: summary(1) });
  assert.equal(state, open);
  state = compare.compareReducer(state, { type: 'search', text: 'temporary' });
  state = compare.compareReducer(state, { type: 'close' });
  assert.deepEqual(state.selections.map((entry) => entry?.id), [1, undefined]);
  assert.equal(state.searchText, '');
  state = choose(state, 1, 4);
  state = choose(state, 0, 10002);
  assert.deepEqual(state.selections.map((entry) => entry.id), [10002, 4]);
  state = choose(state, 1, 10001); // Separate form ID is valid.
  assert.deepEqual(state.selections.map((entry) => entry.id), [10002, 10001]);
  const beforeCancel = state.selections;
  state = compare.compareReducer(compare.compareReducer(state, { type: 'open', slot: 0 }), { type: 'close' });
  assert.equal(state.selections, beforeCancel);
});

test('all six stats use the actual mapping with left/right/tied values and no duplicate comparison', async (t) => {
  mock(t, async (url) => response(pokemon(Number(url.split('/').at(-1)), url.endsWith('/1') ? [45, 49, 49, 65, 65, 45] : [39, 52, 43, 60, 65, 65])));
  const [left, right] = await Promise.all([api.getPokemonDetail('1'), api.getPokemonDetail('4')]);
  const rows = compare.getComparisonRows(left, right);
  assert.deepEqual(rows.map((row) => row.name), ['HP', 'Attack', 'Defense', 'Special Attack', 'Special Defense', 'Speed']);
  assert.deepEqual(rows.map((row) => row.higher), ['left', 'right', 'left', 'left', null, 'right']);
  assert.deepEqual(rows.map(({ left, right }) => [left, right]), [[45, 39], [49, 52], [49, 43], [65, 60], [65, 65], [45, 65]]);
  assert.deepEqual(compare.getComparisonRows(left, left), []);
});

test('both details load independently; failure/Retry keeps the successful side and uses the detail cache', async (t) => {
  const calls = [];
  let fail = true;
  mock(t, async (url) => { calls.push(url); const id = Number(url.split('/').at(-1)); return response(pokemon(id), fail && id === 4 ? 503 : 200); });
  const { client, observe } = fixture(t);
  const left = observe(compare.pokemonComparisonQuery(summary(1)));
  const right = observe(compare.pokemonComparisonQuery(summary(4)));
  assert.equal(left.getCurrentResult().isPending, true);
  assert.equal(right.getCurrentResult().isPending, true);
  await until(() => left.getCurrentResult().isSuccess && right.getCurrentResult().isError);
  const saved = left.getCurrentResult().data;
  assert.equal(saved.id, 1);
  assert.deepEqual(compare.getComparisonRows(saved, right.getCurrentResult().data), []);
  fail = false;
  await right.refetch();
  assert.equal(right.getCurrentResult().data.id, 4);
  assert.equal(left.getCurrentResult().data, saved);
  assert.equal(calls.filter((url) => url.endsWith('/1')).length, 1);
  assert.equal(calls.filter((url) => url.endsWith('/4')).length, 3); // Initial, automatic retry, manual Retry.
  assert.equal(calls.some((url) => url.includes('species') || url.includes('evolution')), false);
  assert.equal(client.getQueryData(['pokemon', 'detail', '1']), saved);
  const cached = observe(compare.pokemonComparisonQuery(summary(1)));
  assert.equal(cached.getCurrentResult().data, saved);
  assert.equal(calls.filter((url) => url.endsWith('/1')).length, 1);
});

test('both failed selections can independently recover', async (t) => {
  let fail = true;
  mock(t, async (url) => response(pokemon(Number(url.split('/').at(-1))), fail ? 503 : 200));
  const { observe } = fixture(t);
  const left = observe(compare.pokemonComparisonQuery(summary(1)));
  const right = observe(compare.pokemonComparisonQuery(summary(4)));
  await until(() => left.getCurrentResult().isError && right.getCurrentResult().isError);
  fail = false;
  await left.refetch();
  assert.equal(right.getCurrentResult().isError, true);
  assert.deepEqual(compare.getComparisonRows(left.getCurrentResult().data, right.getCurrentResult().data), []);
  await right.refetch();
  assert.equal(compare.getComparisonRows(left.getCurrentResult().data, right.getCurrentResult().data).length, 6);
});

test('replacement cancels the old request and late results cannot overwrite the new Pokemon', async (t) => {
  let release;
  let oldSignal;
  mock(t, async (url, { signal }) => {
    const id = Number(url.split('/').at(-1));
    if (id === 1) { oldSignal = signal; await new Promise((resolve) => { release = resolve; }); }
    return response(pokemon(id));
  });
  const { observe } = fixture(t);
  const left = observe(compare.pokemonComparisonQuery(summary(1)));
  const right = observe(compare.pokemonComparisonQuery(summary(4)));
  await until(() => release && right.getCurrentResult().isSuccess);
  left.setOptions(compare.pokemonComparisonQuery(summary(7)));
  assert.equal(left.getCurrentResult().data, undefined);
  assert.equal(oldSignal.aborted, true);
  assert.deepEqual(compare.getComparisonRows(left.getCurrentResult().data, right.getCurrentResult().data), []);
  await until(() => left.getCurrentResult().isSuccess);
  release();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(left.getCurrentResult().data.id, 7);
  assert.equal(right.getCurrentResult().data.id, 4);
});
