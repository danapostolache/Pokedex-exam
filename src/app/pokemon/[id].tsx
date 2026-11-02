import { useLocalSearchParams } from 'expo-router';

import { PokemonDetail } from '@/components/pokemon-detail';
import { usePokemonDetail } from '@/hooks/use-pokemon-detail';
import { usePokemonEvolution } from '@/hooks/use-pokemon-evolution';

export default function PokemonDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <DetailScreen key={id} id={id} />;
}

function DetailScreen({ id }: { id: string }) {
  const detail = usePokemonDetail(id);
  const evolution = usePokemonEvolution(detail.species.data?.evolutionUrl, detail.section === 'Evolution');
  return <PokemonDetail detail={detail} evolution={evolution} />;
}
