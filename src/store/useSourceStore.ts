import { create } from 'zustand';
import { withDefaultSource } from './index';

export type SourceType = 'STAC' | 'WMTS';

export interface DataSource {
  id: string;
  name: string;
  url: string;
  type: SourceType;
  isActive: boolean;
}

export interface SourceState {
  sources: DataSource[];
  activeSource: DataSource | null;
  addSource: (source: Omit<DataSource, 'id'>) => void;
  removeSource: (id: string) => void;
  setActiveSource: (id: string) => void;
}

const uid = () => Math.random().toString(36).slice(2, 10);

export const useSourceStore = create<SourceState>()(
  withDefaultSource((set) => ({
    sources: [],
    activeSource: null,
    addSource: (source) =>
      set((state) => ({
        sources: [...state.sources, { ...source, id: uid() }],
      })),
    removeSource: (id) =>
      set((state) => ({
        sources: state.sources.filter((s) => s.id !== id),
        activeSource:
          state.activeSource?.id === id
            ? state.sources.find((s) => s.id !== id) ?? null
            : state.activeSource,
      })),
    setActiveSource: (id) =>
      set((state) => ({
        activeSource: state.sources.find((s) => s.id === id) ?? null,
      })),
  })),
);
