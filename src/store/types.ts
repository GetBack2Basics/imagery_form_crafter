import type { StacItem } from '../services/stacService';

export type SourceType = 'STAC' | 'WMTS';

export interface DataSource {
  id: string;
  name: string;
  url: string;
  type: SourceType;
  isActive: boolean;
}

export interface ComparisonScenes {
  left: StacItem | null;
  right: StacItem | null;
}

export interface StagingSlots {
  left: StacItem | null;
  right: StacItem | null;
}

export interface SourceState {
  sources: DataSource[];
  activeSource: DataSource | null;
  comparisonStack: ComparisonScenes;
  stagingSlots: StagingSlots;
  addSource: (source: Omit<DataSource, 'id'>) => void;
  removeSource: (id: string) => void;
  setActiveSource: (id: string) => void;
  setLeftScene: (scene: StacItem | null) => void;
  setRightScene: (scene: StacItem | null) => void;
  clearComparison: () => void;
  setStagingLeft: (scene: StacItem | null) => void;
  setStagingRight: (scene: StacItem | null) => void;
  clearStaging: () => void;
  swapStagingToComparison: () => void;
}