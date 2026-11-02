// Run: node --test scripts/check-pokemon-detail.mjs
// Optional live contract check: node scripts/check-pokemon-detail.mjs --live
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

const source = await readFile(new URL('../src/services/pokeapi.ts', import.meta.url), 'utf8');
const code = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }).outputText;
const api = await import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'));
const base = api.POKEAPI_BASE_URL;
const resource = (kind, id, name = String(id)) => ({ name, url: `${base}${kind}/${id}/` });
const pokemon = (id = 10002, name = 'deoxys-attack') => ({
  id, name, base_experience: 270, height: 17, weight: 608,
  species: resource('pokemon-species', 386, 'deoxys'),
  sprites: { front_default: 'sprite.png', other: { 'official-artwork': { front_default: 'official.png' } } },
  types: [{ slot: 1, type: resource('type', 14, 'psychic') }],
  abilities: [{ slot: 1, is_hidden: false, ability: resource('ability', 46, 'pressure') }],
  stats: ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed'].map((name, i) => ({ base_stat: 50 + i, stat: resource('stat', i + 1, name) })),
});
const species = () => ({
  flavor_text_entries: [{ flavor_text: 'An\nEnglish\fdescription. ', language: { name: 'en' } }],
  evolution_chain: { url: `${base}evolution-chain/202/` },
  varieties: [{ is_default: true, pokemon: resource('pokemon', 386, 'deoxys-normal') }],
});
const link = (id, name, children = []) => ({ species: resource('pokemon-species', id, name), evolves_to: children });
function mock(t, fetcher) { const original = globalThis.fetch; globalThis.fetch = fetcher; t.after(() => { globalThis.fetch = original; }); }
function response(body, status = 200) { return new Response(JSON.stringify(body), { status }); }

if (process.argv.includes('--live')) {
  for (const name of ['bulbasaur', 'eevee', 'ditto', 'deoxys-attack', 'wormadam-sandy']) {
    const detail = await api.getPokemonDetail(name);
    const info = await api.getPokemonSpecies(detail.speciesUrl);
    const chain = info.evolutionUrl ? await api.getPokemonEvolution(info.evolutionUrl) : [];
    const members = await Promise.all(chain.map((entry) => api.getPokemonEvolutionMember(entry.speciesUrl)));
    assert.equal(detail.stats.length, 6);
    assert(members.every((member) => member.id > 0));
    if (name === 'eevee') assert.equal(chain.filter((entry) => entry.parent === 'Eevee').length, 8);
    if (name === 'ditto') assert.equal(chain.length, 1);
    if (name === 'deoxys-attack') assert(detail.speciesUrl.endsWith('/386/'));
    console.log(`${name}: #${detail.id}, species ${detail.speciesUrl}, ${chain.length} evolution members OK`);
  }
  await assert.rejects(api.getPokemonDetail('999999999'), api.PokemonNotFoundError);
  console.log('Live unknown-ID contract OK');
} else {
  test('maps form reference, artwork, measurements, abilities and six ordered stats', async (t) => {
    mock(t, async () => response(pokemon()));
    const detail = await api.getPokemonDetail(' DEOXYS-ATTACK ');
    assert.equal(detail.speciesUrl, `${base}pokemon-species/386/`);
    assert.equal(detail.artwork, 'official.png'); assert.equal(detail.cardArtwork, 'sprite.png');
    assert.equal(detail.weight, 60.8); assert.equal(detail.height, 1.7);
    assert.deepEqual(detail.abilities, ['Pressure']);
    assert.deepEqual(detail.stats.map((stat) => stat.name), ['HP', 'Attack', 'Defense', 'Special Attack', 'Special Defense', 'Speed']);
  });
  test('missing optional data uses null and English text is normalized', async (t) => {
    mock(t, async (url) => {
      if (url.includes('pokemon-species')) return response(species());
      return response({ ...pokemon(), base_experience: null, sprites: { front_default: null }, height: null, weight: null });
    });
    const detail = await api.getPokemonDetail('10002');
    assert.equal(detail.artwork, null); assert.equal(detail.weight, null); assert.equal(detail.height, null); assert.equal(detail.baseExperience, null);
    const info = await api.getPokemonSpecies(`${base}pokemon-species/386/`);
    assert.equal(info.description, 'An English description.'); assert.equal(info.defaultPokemon, '386');
    globalThis.fetch = async () => response({ ...species(), flavor_text_entries: [], evolution_chain: null });
    assert.equal((await api.getPokemonSpecies(`${base}pokemon-species/386/`)).description, null);
  });
  test('unknown/invalid IDs differ from recoverable network failures and Retry succeeds', async (t) => {
    let calls = 0;
    mock(t, async () => { calls++; return response({}, 404); });
    await assert.rejects(api.getPokemonDetail('no-such-pokemon'), api.PokemonNotFoundError);
    await assert.rejects(api.getPokemonDetail('../bad'), api.PokemonNotFoundError); assert.equal(calls, 1);
    globalThis.fetch = async () => { throw new Error('offline'); };
    await assert.rejects(api.getPokemonDetail('1'), /Could not reach PokeAPI/);
    globalThis.fetch = async () => response(pokemon(1, 'bulbasaur'));
    assert.equal((await api.getPokemonDetail('1')).id, 1);
    globalThis.fetch = async () => response({}, 500);
    await assert.rejects(api.getPokemonDetail('1'), /PokeAPI could not load/);
  });
  test('evolution preserves branches, linear order and single-member chains', async (t) => {
    mock(t, async () => response({ chain: link(133, 'eevee', [link(134, 'vaporeon'), link(135, 'jolteon')]) }));
    const entries = await api.getPokemonEvolution(`${base}evolution-chain/67/`);
    assert.deepEqual(entries.map((entry) => entry.parent), [null, 'Eevee', 'Eevee']);
    globalThis.fetch = async () => response({ chain: link(1, 'bulbasaur', [link(2, 'ivysaur', [link(3, 'venusaur')])]) });
    assert.deepEqual((await api.getPokemonEvolution(`${base}evolution-chain/1/`)).map((entry) => entry.parent), [null, 'Bulbasaur', 'Ivysaur']);
    globalThis.fetch = async () => response({ chain: link(132, 'ditto') });
    assert.equal((await api.getPokemonEvolution(`${base}evolution-chain/66/`)).length, 1);
  });
  test('member resolves default variety; rejects untrusted resource URLs and invalid stats', async (t) => {
    const urls = [];
    mock(t, async (url) => { urls.push(url); return response(url.includes('pokemon-species') ? species() : pokemon(386, 'deoxys-normal')); });
    assert.equal((await api.getPokemonEvolutionMember(`${base}pokemon-species/386/`)).name, 'deoxys-normal');
    assert.equal(urls[1], `${base}pokemon/386`);
    await assert.rejects(api.getPokemonSpecies('https://elsewhere.example/386'), /invalid resource/);
    await assert.rejects(api.getPokemonEvolution(`${base}evolution-chain/../../bad`), /invalid resource/);
    globalThis.fetch = async () => response({ ...pokemon(), stats: [] });
    await assert.rejects(api.getPokemonDetail('10002'), /invalid stats/);
    globalThis.fetch = async () => response(pokemon());
    await assert.rejects(api.getPokemonDetail('386'), /wrong Pokemon/);
  });
  test('six-request limit, queued cancellation, active cancellation and timeout release slots', async (t) => {
    let active = 0; let maximum = 0;
    const releases = [];
    mock(t, (url, { signal }) => new Promise((resolve, reject) => {
      active++; maximum = Math.max(maximum, active);
      const finish = (action) => { active--; action(); };
      signal.addEventListener('abort', () => finish(() => reject(new Error('aborted'))), { once: true });
      releases.push(() => finish(() => resolve(response(pokemon()))));
    }));
    const requests = Array.from({ length: 6 }, () => api.getPokemonDetail('10002'));
    const queued = new AbortController(); const canceled = api.getPokemonDetail('10002', queued.signal);
    queued.abort(); await assert.rejects(canceled, { name: 'AbortError' });
    await new Promise((resolve) => setImmediate(resolve)); assert.equal(maximum, 6);
    releases.splice(0).forEach((release) => release()); await Promise.all(requests);
    const controller = new AbortController(); const request = api.getPokemonDetail('10002', controller.signal);
    await new Promise((resolve) => setImmediate(resolve)); controller.abort(); await assert.rejects(request, { name: 'AbortError' });
    const originalTimer = globalThis.setTimeout;
    t.after(() => { globalThis.setTimeout = originalTimer; });
    globalThis.setTimeout = (callback, ms, ...args) => originalTimer(callback, ms === 12000 ? 5 : ms, ...args);
    await assert.rejects(api.getPokemonDetail('10002'), /took too long/);
    globalThis.fetch = async () => response(pokemon());
    assert.equal((await api.getPokemonDetail('10002')).id, 10002);
  });
  test('species and evolution failures recover independently from loaded Pokemon data', async (t) => {
    let failing = 'species';
    const calls = [];
    mock(t, async (url) => {
      calls.push(url);
      if (url.includes('/pokemon-species/')) return response(species(), failing === 'species' ? 503 : 200);
      if (url.includes('/evolution-chain/')) return response({ chain: link(386, 'deoxys') }, failing === 'chain' ? 503 : 200);
      return response(pokemon());
    });
    const detail = await api.getPokemonDetail('10002');
    await assert.rejects(api.getPokemonSpecies(detail.speciesUrl), /PokeAPI could not load/);
    failing = 'chain';
    const info = await api.getPokemonSpecies(detail.speciesUrl);
    await assert.rejects(api.getPokemonEvolution(info.evolutionUrl), /PokeAPI could not load/);
    failing = '';
    assert.equal((await api.getPokemonEvolution(info.evolutionUrl))[0].name, 'deoxys');
    assert.equal(detail.stats.length, 6);
    assert.equal(calls.filter((url) => url.includes('/pokemon/')).length, 1);
    assert.equal(calls.filter((url) => url.includes('/evolution-chain/202')).length, 2);
  });
}
