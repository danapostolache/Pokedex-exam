import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { getPokemonCatalogue, type PokemonSummary } from '@/services/pokeapi';

export const catalogueQueryOptions = {
  queryKey: ['pokemon', 'search-catalogue'],
  queryFn: ({ signal }: { signal: AbortSignal }) => getPokemonCatalogue(signal),
  staleTime: Infinity,
  gcTime: Infinity,
  retry: 1,
  retryDelay: 700,
  networkMode: 'always' as const,
};

export function filterPokemonCatalogue(pokemon: PokemonSummary[], text: string) {
  const term = text.trim().toLowerCase();
  return pokemon.filter((entry) => entry.name.toLowerCase().includes(term));
}

export function pokemonSearchOptions(text: string, { browse = false, enabled = true } = {}) {
  return { ...catalogueQueryOptions, enabled: enabled && (browse || text.trim().length > 0) };
}

export function usePokemonSearch(text: string, options: { browse?: boolean; enabled?: boolean } = {}) {
  const term = text.trim().toLowerCase();
  const active = term.length > 0;
  const query = useQuery(pokemonSearchOptions(text, options));
  const browse = options.browse ?? false;
  const pokemon = useMemo(() => active || browse ? filterPokemonCatalogue(query.data ?? [], term) : [], [active, browse, query.data, term]);
  return { ...query, active, pokemon };
}
