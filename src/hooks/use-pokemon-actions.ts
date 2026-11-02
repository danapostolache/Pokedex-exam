import { useCallback, useRef, useState } from 'react';
import { Keyboard, Platform, Share } from 'react-native';

import { openPokemon } from '@/hooks/use-pokemon-detail';
import { useFavorite } from '@/hooks/use-favorites';
import { pokemonLink, type PokemonSummary } from '@/services/pokeapi';

export function usePokemonActions() {
  const [selected, setSelected] = useState<PokemonSummary | null>(null);
  const [sharing, setSharing] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const favorite = useFavorite(selected?.id);
  const inFlight = useRef(false);
  const pendingOpen = useRef<PokemonSummary | null>(null);
  const openOptions = useCallback((pokemon: PokemonSummary) => {
    setShareError(null);
    setSelected(pokemon);
  }, []);
  const dismiss = () => {
    if (!inFlight.current && !favorite.pending) {
      setSelected(null);
      setShareError(null);
    }
  };
  const finishOpen = useCallback(() => {
    const pokemon = pendingOpen.current;
    pendingOpen.current = null;
    if (pokemon) openPokemon(pokemon.id);
  }, []);
  const open = useCallback((pokemon: PokemonSummary) => {
    if (inFlight.current || pendingOpen.current) return;
    Keyboard.dismiss();
    setSelected(null);
    setShareError(null);
    // UIKit must finish dismissing the native modal before pushing the stack screen.
    if (selected && Platform.OS === 'ios') pendingOpen.current = pokemon;
    else openPokemon(pokemon.id);
  }, [selected]);
  const share = async () => {
    if (!selected || inFlight.current || favorite.pending) return;
    inFlight.current = true;
    setSharing(true);
    setShareError(null);
    try {
      await Share.share({
        title: selected.displayName,
        message: selected.displayName + '\n' + pokemonLink(selected.id),
      }, { dialogTitle: 'Share ' + selected.displayName });
      setSelected(null);
    } catch {
      setShareError('Sharing did not open. Please try again.');
    } finally {
      inFlight.current = false;
      setSharing(false);
    }
  };
  return { selected, sharing, shareError, favorite, openOptions, dismiss, share, open, finishOpen };
}
