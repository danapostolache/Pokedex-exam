import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { getPokemonCard } from '@/services/pokeapi';

export function usePokemonCard(id: number, enabled: boolean) {
  const query = useQuery({
    queryKey: ['pokemon', 'card', id],
    queryFn: ({ signal }) => getPokemonCard(id, signal),
    enabled,
    staleTime: 60 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 1,
    retryDelay: 700,
    networkMode: 'always',
  });
  const [imageFailed, setImageFailed] = useState(false);
  const [imageAttempt, setImageAttempt] = useState(0);
  const retryArtwork = () => {
    setImageFailed(false);
    setImageAttempt((attempt) => attempt + 1);
    void query.refetch();
  };
  return { ...query, imageFailed, imageAttempt, onImageError: () => setImageFailed(true), retryArtwork };
}
