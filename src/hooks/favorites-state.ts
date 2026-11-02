import { type QueryClient } from '@tanstack/react-query';

import { getFavorites, setFavorite } from '@/services/favorites';

export const favoritesKey = ['favorites'] as const;
export const favoriteWritesKey = ['favorite-writes'] as const;
export type FavoriteWrite = { pending: boolean; saved: boolean; error?: string };
export type FavoriteWrites = Record<number, FavoriteWrite | undefined>;

export const favoritesQueryOptions = {
  queryKey: favoritesKey,
  queryFn: async ({ signal }: { signal: AbortSignal }) => {
    const records = await getFavorites();
    signal.throwIfAborted();
    return records;
  },
  staleTime: Infinity,
  gcTime: Infinity,
  retry: false,
  retryOnMount: false,
  networkMode: 'always' as const,
  refetchOnWindowFocus: false,
};

/** Shared query-cache operation state also acts as a synchronous lock between hook consumers. */
export async function saveFavorite(client: QueryClient, id: number, saved: boolean) {
  const writes = client.getQueryData<FavoriteWrites>(favoriteWritesKey);
  if (writes?.[id]?.pending) return;
  const update = (write: FavoriteWrite | undefined) => client.setQueryData<FavoriteWrites>(favoriteWritesKey, (current) => ({ ...current, [id]: write }));
  update({ pending: true, saved });
  try {
    await client.cancelQueries({ queryKey: favoritesKey, exact: true });
    const records = await setFavorite(id, saved);
    client.setQueryData(favoritesKey, records);
    update(undefined);
  } catch (error) {
    update({ pending: false, saved, error: error instanceof Error ? error.message : 'Favorites could not be updated. Please retry.' });
  }
}
