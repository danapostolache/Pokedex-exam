import { skipToken, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import { favoritesQueryOptions, favoriteWritesKey, saveFavorite, type FavoriteWrites } from '@/hooks/favorites-state';

export function useFavorites() {
  const writes = useQuery<FavoriteWrites>({ queryKey: favoriteWritesKey, queryFn: skipToken, initialData: {}, staleTime: Infinity, gcTime: Infinity });
  const operations = writes.data ?? {};
  const writing = Object.values(operations).some((operation) => operation?.pending);
  const query = useQuery({ ...favoritesQueryOptions, enabled: !writing });
  const ids = useMemo(() => new Set(query.data?.map((record) => record.pokemon_id)), [query.data]);
  const retry = () => { if (!writing) void query.refetch(); };
  return { ...query, ids, writes: operations, writing, retry };
}

export function useFavorite(id: number | undefined) {
  const client = useQueryClient();
  const favorites = useFavorites();
  const operation = id === undefined ? undefined : favorites.writes[id];
  const saved = id === undefined || favorites.data === undefined ? undefined : favorites.ids.has(id);
  const loading = id !== undefined && favorites.data === undefined && !favorites.isError;
  const pending = operation?.pending ?? false;
  const disabled = id === undefined || favorites.data === undefined || favorites.isError || pending;
  const error = operation?.error ?? (favorites.isError ? favorites.error.message : undefined);
  const toggle = () => { if (!disabled && id !== undefined) void saveFavorite(client, id, !saved); };
  const retry = () => {
    if (pending || id === undefined) return;
    if (operation?.error) void saveFavorite(client, id, operation.saved);
    else favorites.retry();
  };
  return { saved, loading, pending, disabled, error, retrying: pending || favorites.isFetching || favorites.writing, toggle, retry };
}
