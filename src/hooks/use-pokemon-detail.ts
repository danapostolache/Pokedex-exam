import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';

import { getPokemonDetail, getPokemonSpecies, normalizePokemonIdentifier, PokemonNotFoundError } from '@/services/pokeapi';

export type DetailSection = 'About' | 'Stats' | 'Evolution';
export const detailQueryOptions = {
  staleTime: 60 * 60 * 1000,
  gcTime: 30 * 60 * 1000,
  retry: (count: number, error: Error) => !(error instanceof PokemonNotFoundError) && count < 1,
  retryDelay: 700,
  networkMode: 'always' as const,
};

export function openPokemon(identifier: string | number) {
  router.push({ pathname: '/pokemon/[id]', params: { id: String(identifier) } });
}

export function usePokemonDetail(value: string | string[] | undefined) {
  const identifier = normalizePokemonIdentifier(value);
  const [section, setSection] = useState<DetailSection>('About');
  const pokemon = useQuery({
    ...detailQueryOptions, queryKey: ['pokemon', 'detail', identifier],
    queryFn: ({ signal }) => getPokemonDetail(identifier ?? '', signal), enabled: identifier !== null,
  });
  const speciesUrl = pokemon.data?.speciesUrl;
  const species = useQuery({
    ...detailQueryOptions, queryKey: ['pokemon', 'species', speciesUrl],
    queryFn: ({ signal }) => getPokemonSpecies(speciesUrl ?? '', signal), enabled: Boolean(speciesUrl),
  });
  const back = () => { if (router.canGoBack()) router.back(); else router.replace('/'); };
  return { pokemon, species, section, setSection, back, openPokemon, notFound: identifier === null || pokemon.error instanceof PokemonNotFoundError };
}
