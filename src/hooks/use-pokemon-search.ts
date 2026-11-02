import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { getPokemonCatalogue } from '@/services/pokeapi';

export function usePokemonSearch(text: string) {
  const term = text.trim().toLowerCase();
  const active = term.length > 0;
  const query = useQuery({
    queryKey: ['pokemon', 'search-catalogue'],
    queryFn: ({ signal }) => getPokemonCatalogue(signal),
    enabled: active,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 1,
    retryDelay: 700,
    networkMode: 'always',
  });
  const pokemon = useMemo(() => active ? (query.data ?? []).filter((entry) => entry.name.toLowerCase().includes(term)) : [], [active, query.data, term]);
  return { ...query, active, pokemon };
}
