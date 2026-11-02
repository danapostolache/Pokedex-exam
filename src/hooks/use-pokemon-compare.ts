import { useQuery } from '@tanstack/react-query';
import { useReducer } from 'react';

import { detailQueryOptions } from '@/hooks/use-pokemon-detail';
import { usePokemonSearch } from '@/hooks/use-pokemon-search';
import { getPokemonDetail, type PokemonDetailData, type PokemonSummary } from '@/services/pokeapi';

export type CompareSlot = 0 | 1;
export type CompareState = { selections: [PokemonSummary | null, PokemonSummary | null]; picker: CompareSlot | null; searchText: string };
type Action = { type: 'open'; slot: CompareSlot } | { type: 'close' } | { type: 'search'; text: string } | { type: 'select'; pokemon: PokemonSummary };
export const initialCompareState: CompareState = { selections: [null, null], picker: null, searchText: '' };

export function compareReducer(state: CompareState, action: Action): CompareState {
  switch (action.type) {
    case 'open': return { ...state, picker: action.slot, searchText: '' };
    case 'close': return { ...state, picker: null, searchText: '' };
    case 'search': return { ...state, searchText: action.text };
    case 'select': {
      const slot = state.picker;
      if (slot === null || state.selections[slot === 0 ? 1 : 0]?.id === action.pokemon.id) return state;
      const selections: CompareState['selections'] = [...state.selections];
      selections[slot] = action.pokemon;
      return { selections, picker: null, searchText: '' };
    }
  }
}

export function pokemonComparisonQuery(selection: PokemonSummary | null) {
  const identifier = selection ? String(selection.id) : null;
  return {
    ...detailQueryOptions,
    queryKey: ['pokemon', 'detail', identifier],
    queryFn: ({ signal }: { signal: AbortSignal }) => getPokemonDetail(identifier ?? '', signal),
    enabled: identifier !== null,
  };
}

export type ComparisonRow = { name: string; left: number; right: number; higher: 'left' | 'right' | null };

export function getComparisonRows(left?: PokemonDetailData, right?: PokemonDetailData): ComparisonRow[] {
  if (!left || !right || left.id === right.id) return [];
  return left.stats.flatMap((stat) => {
    const other = right.stats.find((entry) => entry.name === stat.name);
    return other ? [{ name: stat.name, left: stat.value, right: other.value, higher: stat.value > other.value ? 'left' : stat.value < other.value ? 'right' : null }] : [];
  });
}

export function usePokemonCompare() {
  const [state, dispatch] = useReducer(compareReducer, initialCompareState);
  const catalogue = usePokemonSearch(state.searchText, { browse: true, enabled: state.picker !== null });
  const left = useQuery(pokemonComparisonQuery(state.selections[0]));
  const right = useQuery(pokemonComparisonQuery(state.selections[1]));
  const rows = getComparisonRows(left.data, right.data);
  const opposite = state.picker === null ? null : state.selections[state.picker === 0 ? 1 : 0];
  return {
    ...state, catalogue, left, right, rows, opposite,
    openPicker: (slot: CompareSlot) => dispatch({ type: 'open', slot }),
    closePicker: () => dispatch({ type: 'close' }),
    setSearchText: (text: string) => dispatch({ type: 'search', text }),
    select: (pokemon: PokemonSummary) => {
      const entry = catalogue.data?.find((item) => item.id === pokemon.id);
      if (entry) dispatch({ type: 'select', pokemon: entry });
    },
  };
}
