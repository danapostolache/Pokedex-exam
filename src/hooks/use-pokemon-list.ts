import { useInfiniteQuery } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';

import { getPokemonPage, type PokemonSummary } from '@/services/pokeapi';

export function usePokemonList() {
  const query = useInfiniteQuery({
    queryKey: ['pokemon', 'catalogue'],
    initialPageParam: 0,
    queryFn: ({ pageParam, signal }) => getPokemonPage(pageParam, signal),
    getNextPageParam: (page) => page.nextOffset,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 1,
    retryDelay: 700,
    networkMode: 'always',
  });
  const pokemon = useMemo(() => {
    const unique = new Map<number, PokemonSummary>();
    for (const page of query.data?.pages ?? []) {
      for (const entry of page.pokemon) if (!unique.has(entry.id)) unique.set(entry.id, entry);
    }
    return [...unique.values()];
  }, [query.data]);
  const [visibleIndices, setVisibleIndices] = useState<Set<number> | null>(null);
  const visibleIds = useMemo(() => visibleIndices ? new Set(pokemon.filter((_, index) => visibleIndices.has(index)).map((entry) => entry.id)) : null, [pokemon, visibleIndices]);
  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: { index?: number | null }[] }) => {
    if (viewableItems.length) setVisibleIndices(new Set(viewableItems.map((token) => token.index).filter((index) => typeof index === 'number')));
  }, []);
  const { hasNextPage, isFetching, fetchNextPage } = query;
  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetching) void fetchNextPage({ cancelRefetch: false });
  }, [hasNextPage, isFetching, fetchNextPage]);

  return {
    ...query,
    pokemon,
    total: query.data?.pages[0]?.total ?? 0,
    visibleIds,
    onViewableItemsChanged,
    loadMore,
  };
}
