import { useQueries, useQuery } from '@tanstack/react-query';

import { detailQueryOptions } from '@/hooks/use-pokemon-detail';
import { getPokemonEvolution, getPokemonEvolutionMember } from '@/services/pokeapi';

export function usePokemonEvolution(url: string | null | undefined, enabled: boolean) {
  const chain = useQuery({
    ...detailQueryOptions, queryKey: ['pokemon', 'evolution', url], enabled: enabled && Boolean(url),
    queryFn: ({ signal }) => getPokemonEvolution(url ?? '', signal),
  });
  const entries = chain.data ?? [];
  const members = useQueries({ queries: entries.map((entry) => ({
    ...detailQueryOptions, queryKey: ['pokemon', 'evolution-member', entry.speciesUrl], enabled,
    queryFn: ({ signal }: { signal: AbortSignal }) => getPokemonEvolutionMember(entry.speciesUrl, signal),
  })) });
  return { chain, members: entries.map((entry, index) => ({ entry, query: members[index] })) };
}
