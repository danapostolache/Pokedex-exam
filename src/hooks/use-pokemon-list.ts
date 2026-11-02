import { useInfiniteQuery } from '@tanstack/react-query';
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { usePokemonSearch } from '@/hooks/use-pokemon-search';
import { getPokemonPage, type PokemonSummary } from '@/services/pokeapi';

export function usePokemonList() {
  const [searchText, setSearchText] = useState('');
  const search = usePokemonSearch(searchText);
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
  const catalogue = useMemo(() => {
    const unique = new Map<number, PokemonSummary>();
    for (const page of query.data?.pages ?? []) {
      for (const entry of page.pokemon) if (!unique.has(entry.id)) unique.set(entry.id, entry);
    }
    return [...unique.values()];
  }, [query.data]);
  const pokemon = search.active ? search.pokemon : catalogue;
  const displayedPokemon = useRef(pokemon);
  useLayoutEffect(() => { displayedPokemon.current = pokemon; }, [pokemon]);
  // Associate visibility with this exact result set; old indices must not activate new cards.
  const [visibility, setVisibility] = useState<{ pokemon: PokemonSummary[]; ids: Set<number> } | null>(null);
  const visibleIds = visibility?.pokemon === pokemon ? visibility.ids : null;
  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: { item: PokemonSummary }[] }) => {
    setVisibility({ pokemon: displayedPokemon.current, ids: new Set(viewableItems.map((token) => token.item.id)) });
  }, []);
  const { hasNextPage, isFetching, fetchNextPage } = query;
  const loadMore = useCallback(() => {
    if (!search.active && hasNextPage && !isFetching) void fetchNextPage({ cancelRefetch: false });
  }, [search.active, hasNextPage, isFetching, fetchNextPage]);

  return {
    ...query,
    search,
    searchText,
    setSearchText,
    pokemon,
    total: query.data?.pages[0]?.total ?? 0,
    visibleIds,
    onViewableItemsChanged,
    loadMore,
  };
}
