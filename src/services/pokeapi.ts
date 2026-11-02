/** Shared remote-data boundary. Catalogue pages never request every Pokemon's details. */
export const POKEAPI_BASE_URL = 'https://pokeapi.co/api/v2/';
export const POKEMON_PAGE_SIZE = 24;

export type PokemonSummary = { id: number; name: string; displayName: string };
export type PokemonPage = { pokemon: PokemonSummary[]; total: number; nextOffset: number | null };
export type PokemonCardData = { artwork: string | null; types: string[] };

type NamedResource = { name: string; url: string };
type PokemonPageResponse = { count: number; next: string | null; results: NamedResource[] };
type PokemonResponse = {
  id: number;
  sprites: {
    front_default: string | null;
    other?: { 'official-artwork'?: { front_default: string | null } };
  };
  types: { slot: number; type: NamedResource }[];
};

const MAX_REQUESTS = 6;
const REQUEST_TIMEOUT = 12000;
let activeRequests = 0;
const waiting: (() => void)[] = [];

function aborted() {
  const error = new Error('Request cancelled.');
  error.name = 'AbortError';
  return error;
}

function acquire(signal?: AbortSignal): Promise<void> {
  if (signal?.aborted) return Promise.reject(aborted());
  if (activeRequests < MAX_REQUESTS) {
    activeRequests += 1;
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    const cancel = () => {
      const index = waiting.indexOf(start);
      if (index >= 0) waiting.splice(index, 1);
      reject(aborted());
    };
    const start = () => {
      signal?.removeEventListener('abort', cancel);
      activeRequests += 1;
      resolve();
    };
    waiting.push(start);
    signal?.addEventListener('abort', cancel, { once: true });
  });
}

async function request<T>(endpoint: string, signal?: AbortSignal): Promise<T> {
  await acquire(signal);
  const controller = new AbortController();
  let timedOut = false;
  const cancel = () => controller.abort();
  signal?.addEventListener('abort', cancel, { once: true });
  if (signal?.aborted) controller.abort();
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, REQUEST_TIMEOUT);
  try {
    const response = await fetch(POKEAPI_BASE_URL + endpoint, { signal: controller.signal });
    if (!response.ok) throw new Error('PokeAPI could not load this request. Please try again.');
    return await response.json();
  } catch (error) {
    if (signal?.aborted) throw aborted();
    if (timedOut) throw new Error('The request took too long. Check your connection and try again.');
    if (error instanceof Error && error.message.startsWith('PokeAPI')) throw error;
    throw new Error('Could not reach PokeAPI. Check your connection and try again.');
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', cancel);
    activeRequests -= 1;
    waiting.shift()?.();
  }
}

export function formatPokemonName(name: string): string {
  return name.split('-').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
}

export function pokemonLink(id: number): string {
  return POKEAPI_BASE_URL + 'pokemon/' + id + '/';
}

async function getCataloguePage(offset: number, limit: number, signal?: AbortSignal): Promise<PokemonPage> {
  const page = await request<PokemonPageResponse>('pokemon?limit=' + limit + '&offset=' + offset, signal);
  if (!Number.isSafeInteger(page.count) || page.count < 0 || !Array.isArray(page.results)) {
    throw new Error('PokeAPI returned an invalid catalogue. Please try again.');
  }
  const pokemon = page.results.map((entry) => {
    const match = typeof entry.url === 'string' && entry.url.match(/\/pokemon\/(\d+)\/?$/);
    const id = match ? Number(match[1]) : 0;
    if (!Number.isSafeInteger(id) || id <= 0 || typeof entry.name !== 'string' || !entry.name.trim()) {
      throw new Error('PokeAPI returned an invalid Pokemon. Please try again.');
    }
    return { id, name: entry.name, displayName: formatPokemonName(entry.name) };
  });
  const nextMatch = page.next?.match(/[?&]offset=(\d+)/);
  const nextOffset = nextMatch ? Number(nextMatch[1]) : null;
  if (page.next && (!nextOffset || nextOffset <= offset)) {
    throw new Error('PokeAPI returned invalid pagination. Please try again.');
  }
  return { pokemon, total: page.count, nextOffset: pokemon.length ? nextOffset : null };
}

export function getPokemonPage(offset: number, signal?: AbortSignal): Promise<PokemonPage> {
  return getCataloguePage(offset, POKEMON_PAGE_SIZE, signal);
}

/** Names only: artwork remains a separate query for each visible card. */
export async function getPokemonCatalogue(signal?: AbortSignal): Promise<PokemonSummary[]> {
  const limit = 100000;
  let page = await getCataloguePage(0, limit, signal);
  const total = page.total;
  const unique = new Map<number, PokemonSummary>();
  while (true) {
    if (page.total !== total) throw new Error('PokeAPI catalogue changed while loading. Please try again.');
    for (const pokemon of page.pokemon) unique.set(pokemon.id, pokemon);
    if (page.nextOffset === null) break;
    page = await getCataloguePage(page.nextOffset, limit, signal);
  }
  if (unique.size !== total) throw new Error('PokeAPI returned an incomplete catalogue. Please try again.');
  return [...unique.values()];
}

export async function getPokemonCard(id: number, signal?: AbortSignal): Promise<PokemonCardData> {
  const pokemon = await request<PokemonResponse>('pokemon/' + id, signal);
  if (pokemon.id !== id || !pokemon.sprites || !Array.isArray(pokemon.types)) {
    throw new Error('PokeAPI returned invalid artwork information. Please try again.');
  }
  // The live sprite matches the supplied pixel-art cards; fall back for alternate forms.
  return {
    artwork: pokemon.sprites.front_default ?? pokemon.sprites.other?.['official-artwork']?.front_default ?? null,
    types: pokemon.types.map((entry) => entry.type.name),
  };
}
