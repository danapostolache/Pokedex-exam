import { loadAsync, useFonts } from 'expo-font';
import { useState } from 'react';

const rubikFonts = {
  'Rubik-Regular': require('@/assets/fonts/Rubik-Regular.ttf'),
  'Rubik-Medium': require('@/assets/fonts/Rubik-Medium.ttf'),
  'Rubik-Bold': require('@/assets/fonts/Rubik-Bold.ttf'),
};

export function useAppFonts() {
  const [loaded, initialError] = useFonts(rubikFonts);
  const [recovered, setRecovered] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState<Error | null>(null);
  const retry = async () => {
    if (retrying) return;
    setRetrying(true);
    try {
      await loadAsync(rubikFonts);
      setRecovered(true);
      setRetryError(null);
    } catch (error) {
      setRetryError(error instanceof Error ? error : new Error('Could not load fonts.'));
    } finally {
      setRetrying(false);
    }
  };
  return { loaded: loaded || recovered, error: recovered ? null : retryError ?? initialError, retrying, retry };
}
