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
  name: string;
  base_experience: number | null;
  weight: number;
  height: number;
  abilities: { slot: number; is_hidden: boolean; ability: NamedResource }[];
  stats: { base_stat: number; stat: NamedResource }[];
  species: NamedResource;
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

export class PokemonNotFoundError extends Error {
  constructor() { super('Pokemon not found.'); this.name = 'PokemonNotFoundError'; }
}

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
    if (response.status === 404) throw new PokemonNotFoundError();
    if (!response.ok) throw new Error('PokeAPI could not load this request. Please try again.');
    return await response.json();
  } catch (error) {
    if (signal?.aborted) throw aborted();
    if (timedOut) throw new Error('The request took too long. Check your connection and try again.');
    if (error instanceof PokemonNotFoundError) throw error;
    if (error instanceof Error && error.message.startsWith('PokeAPI')) throw error;
    throw new Error('Could not reach PokeAPI. Check your connection and try again.');
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', cancel);
    activeRequests -= 1;
    waiting.shift()?.();
  }
}

export type PokemonDetailData = PokemonSummary & PokemonCardData & {
  speciesUrl: string; cardArtwork: string | null; baseExperience: number | null; weight: number | null; height: number | null;
  abilities: string[]; stats: { name: string; value: number }[];
};
export type PokemonSpeciesData = { description: string | null; evolutionUrl: string | null; defaultPokemon: string };
type SpeciesResponse = {
  flavor_text_entries: { flavor_text: string; language: NamedResource }[];
  evolution_chain: { url: string } | null;
  varieties: { is_default: boolean; pokemon: NamedResource }[];
};
type ChainLink = { species: NamedResource; evolves_to: ChainLink[] };
export type EvolutionEntry = { speciesUrl: string; name: string; displayName: string; parent: string | null };

/** Accept only PokeAPI resource references, never arbitrary remote URLs. */
function resourcePath(url: string, resource: string): string {
  const prefix = POKEAPI_BASE_URL + resource + '/';
  if (typeof url !== 'string' || !url.startsWith(prefix)) throw new Error('PokeAPI returned an invalid resource. Please try again.');
  const identifier = url.slice(prefix.length).replace(/\/$/, '');
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(identifier)) throw new Error('PokeAPI returned an invalid resource. Please try again.');
  return resource + '/' + identifier;
}

export function normalizePokemonIdentifier(value: string | string[] | undefined): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalized)) return null;
  if (/^\d+$/.test(normalized)) return Number.isSafeInteger(Number(normalized)) && Number(normalized) > 0 ? String(Number(normalized)) : null;
  return normalized;
}

const statNames: Record<string, string> = { hp: 'HP', attack: 'Attack', defense: 'Defense', 'special-attack': 'Special Attack', 'special-defense': 'Special Defense', speed: 'Speed' };
function measurement(value: number): number | null { return Number.isFinite(value) && value >= 0 ? value / 10 : null; }

export async function getPokemonDetail(identifier: string, signal?: AbortSignal): Promise<PokemonDetailData> {
  const normalized = normalizePokemonIdentifier(identifier);
  if (!normalized) throw new PokemonNotFoundError();
  const data = await request<PokemonResponse>('pokemon/' + normalized, signal);
  if (!Number.isSafeInteger(data.id) || data.id <= 0 || typeof data.name !== 'string' || !data.name || !data.sprites || !Array.isArray(data.types) || !Array.isArray(data.abilities) || !Array.isArray(data.stats)) {
    throw new Error('PokeAPI returned invalid Pokemon details. Please try again.');
  }
  if (/^\d+$/.test(normalized) && data.id !== Number(normalized)) throw new Error('PokeAPI returned the wrong Pokemon. Please try again.');
  const speciesUrl = POKEAPI_BASE_URL + resourcePath(data.species?.url, 'pokemon-species') + '/';
  const stats = Object.entries(statNames).map(([key, name]) => {
    const value = data.stats.find((stat) => stat.stat.name === key)?.base_stat;
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) throw new Error('PokeAPI returned invalid stats. Please try again.');
    return { name, value };
  });
  return {
    id: data.id, name: data.name, displayName: formatPokemonName(data.name), speciesUrl,
    artwork: data.sprites.other?.['official-artwork']?.front_default ?? data.sprites.front_default ?? null,
    cardArtwork: data.sprites.front_default ?? data.sprites.other?.['official-artwork']?.front_default ?? null,
    types: [...data.types].sort((a, b) => a.slot - b.slot).map((entry) => entry.type.name),
    baseExperience: Number.isFinite(data.base_experience) ? data.base_experience : null,
    weight: measurement(data.weight), height: measurement(data.height),
    abilities: [...data.abilities].sort((a, b) => a.slot - b.slot).map((entry) => formatPokemonName(entry.ability.name) + (entry.is_hidden ? ' (hidden)' : '')),
    stats,
  };
}

export async function getPokemonSpecies(url: string, signal?: AbortSignal): Promise<PokemonSpeciesData> {
  const data = await request<SpeciesResponse>(resourcePath(url, 'pokemon-species'), signal);
  const defaultPokemon = data.varieties?.find((entry) => entry.is_default)?.pokemon;
  if (!defaultPokemon || !Array.isArray(data.flavor_text_entries)) throw new Error('PokeAPI returned invalid species information. Please try again.');
  const defaultPath = resourcePath(defaultPokemon.url, 'pokemon');
  const description = data.flavor_text_entries.find((entry) => entry.language.name === 'en')?.flavor_text.replace(/\s+/g, ' ').trim() || null;
  return {
    description, defaultPokemon: defaultPath.slice('pokemon/'.length),
    evolutionUrl: data.evolution_chain ? POKEAPI_BASE_URL + resourcePath(data.evolution_chain.url, 'evolution-chain') + '/' : null,
  };
}

export async function getPokemonEvolution(url: string, signal?: AbortSignal): Promise<EvolutionEntry[]> {
  const data = await request<{ chain: ChainLink }>(resourcePath(url, 'evolution-chain'), signal);
  const entries: EvolutionEntry[] = [];
  const seen = new Set<string>();
  function visit(link: ChainLink, parent: string | null) {
    if (!link?.species?.name || !Array.isArray(link.evolves_to)) throw new Error('PokeAPI returned an invalid evolution chain. Please try again.');
    const speciesUrl = POKEAPI_BASE_URL + resourcePath(link.species.url, 'pokemon-species') + '/';
    if (seen.has(speciesUrl)) throw new Error('PokeAPI returned an invalid evolution chain. Please try again.');
    seen.add(speciesUrl);
    const displayName = formatPokemonName(link.species.name);
    entries.push({ speciesUrl, name: link.species.name, displayName, parent });
    for (const child of link.evolves_to) visit(child, displayName);
  }
  visit(data.chain, null);
  return entries;
}

/** Default variety references handle species names such as deoxys and wormadam. */
export async function getPokemonEvolutionMember(speciesUrl: string, signal?: AbortSignal): Promise<PokemonDetailData> {
  const species = await getPokemonSpecies(speciesUrl, signal);
  return getPokemonDetail(species.defaultPokemon, signal);
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
