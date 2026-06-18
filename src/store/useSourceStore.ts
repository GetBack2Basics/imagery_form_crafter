import { create } from 'zustand';
import { withDefaultSource } from './index';
import type { DataSource, SourceState, ComparisonScenes } from './types';
import type { StacItem } from '../services/stacService';

const uid = () => Math.random().toString(36).slice(2, 10);

const initialComparisonStack: ComparisonScenes = {
  left: null,
  right: null,
};

export const useSourceStore = create<SourceState>()(
  withDefaultSource((set) => ({
    sources: [] as DataSource[],
    activeSource: null as DataSource | null,
    comparisonStack: initialComparisonStack,
    addSource: (source: Omit<DataSource, 'id'>) =>
      set((state: SourceState) => ({
        sources: [...state.sources, { ...source, id: uid() }],
      })),
    removeSource: (id: string) =>
      set((state: SourceState) => ({
        sources: state.sources.filter((s: DataSource) => s.id !== id),
        activeSource:
          state.activeSource?.id === id
            ? state.sources.find((s: DataSource) => s.id !== id) ?? null
            : state.activeSource,
      })),
    setActiveSource: (id: string) =>
      set((state: SourceState) => ({
        activeSource: state.sources.find((s: DataSource) => s.id === id) ?? null,
      })),
    setLeftScene: (scene: StacItem | null) =>
      set((state: SourceState) => ({
        comparisonStack: { ...state.comparisonStack, left: scene },
      })),
    setRightScene: (scene: StacItem | null) =>
      set((state: SourceState) => ({
        comparisonStack: { ...state.comparisonStack, right: scene },
      })),
    clearComparison: () =>
      set((_state: SourceState) => ({
        comparisonStack: initialComparisonStack,
      })),
  })),
);
