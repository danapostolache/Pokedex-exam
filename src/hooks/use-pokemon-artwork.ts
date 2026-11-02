import { useEffect, useState } from 'react';

/** Image state belongs to the exact URI; remount the image when retrying. */
export function usePokemonArtwork() {
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!loading) return;
    const timeout = setTimeout(() => { setFailed(true); setLoading(false); }, 12000);
    return () => clearTimeout(timeout);
  }, [loading, attempt]);
  return {
    failed, loading, attempt,
    onError: () => { setFailed(true); setLoading(false); },
    onLoad: () => setLoading(false),
    retry: () => { setFailed(false); setLoading(true); setAttempt((value) => value + 1); },
  };
}
