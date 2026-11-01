import { useCallback, useRef, useState } from 'react';
import { Share } from 'react-native';

import { pokemonLink, type PokemonSummary } from '@/services/pokeapi';

export function usePokemonActions() {
  const [selected, setSelected] = useState<PokemonSummary | null>(null);
  const [sharing, setSharing] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const inFlight = useRef(false);
  const openOptions = useCallback((pokemon: PokemonSummary) => {
    setShareError(null);
    setSelected(pokemon);
  }, []);
  const dismiss = () => {
    if (!inFlight.current) {
      setSelected(null);
      setShareError(null);
    }
  };
  const share = async () => {
    if (!selected || inFlight.current) return;
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
  return { selected, sharing, shareError, openOptions, dismiss, share };
}
