import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { useFavorites } from '@/hooks/use-favorites';

type Entry = { id: number };

export function usePokemonFavorites() {
  const favorites = useFavorites();
  const pokemon = useMemo(() => (favorites.data ?? []).map((record) => ({ id: record.pokemon_id })), [favorites.data]);
  const displayed = useRef(pokemon);
  useLayoutEffect(() => { displayed.current = pokemon; }, [pokemon]);
  const [visibility, setVisibility] = useState<{ entries: Entry[]; ids: Set<number> } | null>(null);
  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: { item: Entry }[] }) => {
    setVisibility({ entries: displayed.current, ids: new Set(viewableItems.map(({ item }) => item.id)) });
  }, []);
  const visibleIds = visibility?.entries === pokemon ? visibility.ids : null;
  return { ...favorites, pokemon, visibleIds, onViewableItemsChanged };
}
