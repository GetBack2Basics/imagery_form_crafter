export type ImageryMode = 'open' | 'internal';

export interface AppConfig {
  mode: ImageryMode;
  stacApiUrl: string;
  localRasterDir: string;
  localTileUrl: string;
}

const isBrowser = typeof window !== 'undefined';

export const config: AppConfig = {
  mode: (isBrowser ? (import.meta.env.VITE_IMAGERY_MODE as ImageryMode) : 'open') || 'open',
  stacApiUrl: isBrowser ? import.meta.env.VITE_STAC_API_URL || 'https://earth-search.aws.element84.com/v1' : 'https://earth-search.aws.element84.com/v1',
  localRasterDir: isBrowser ? import.meta.env.VITE_LOCAL_RASTER_DIR || '/mnt/imagery' : '/mnt/imagery',
  localTileUrl: isBrowser ? import.meta.env.VITE_LOCAL_TILE_URL || 'http://localhost:8080/tiles/{z}/{x}/{y}.png' : 'http://localhost:8080/tiles/{z}/{x}/{y}.png',
};

export const isInternalMode = (): boolean => config.mode === 'internal';
