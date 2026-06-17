import { create } from 'zustand';

export interface TileMetadata {
  tileId?: string;
  date?: string;
  cloudCover?: number;
  productId?: string;
  bbox?: [number, number, number, number];
  center?: [number, number];
  band?: string;
  projection?: string;
  locationName?: string;
  changeFlag?: 'Y' | 'N';
}

export interface AppState {
  loading: boolean;
  error: string | null;
  tile: TileMetadata;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setTile: (tile: TileMetadata) => void;
}

export const useAppStore = create<AppState>((set) => ({
  loading: true,
  error: null,
  tile: {
    tileId: 'T56HLK',
    date: new Date().toISOString().split('T')[0],
    cloudCover: 8,
    productId: 's2a_t56hlk_20260607',
    bbox: [150.5, -34.2, 152.0, -33.4],
    center: [151.2093, -33.8688],
    band: 'B04 (Red)',
    projection: 'WGS84',
    locationName: 'Sydney Coast',
    changeFlag: 'N',
  },
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setTile: (tile) => set({ tile }),
}));
