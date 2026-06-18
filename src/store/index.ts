import type { DataSource, SourceState, ComparisonScenes } from './types';

const initialComparisonStack: ComparisonScenes = {
  left: null,
  right: null,
};

export const withDefaultSource =
  (createState: (set: (fn: (state: SourceState) => Partial<SourceState>) => void) => SourceState) =>
  (set: (fn: (state: SourceState) => Partial<SourceState>) => void) => {
    const state = createState(set) as SourceState;
    const sources = state.sources || [];
    if (!sources.find((s: DataSource) => s.id === 'open-global-stac')) {
      state.sources = [
        {
          id: 'open-global-stac',
          name: 'Open Global STAC (AWS)',
          url: 'https://earth-search.aws.element84.com/v1',
          type: 'STAC',
          isActive: true,
        },
        {
          id: 'planetary-computer',
          name: 'Planetary Computer (Microsoft)',
          url: 'https://planetarycomputer.microsoft.com/api/stac/v1',
          type: 'STAC',
          isActive: false,
        },
        {
          id: 'copernicus-dataspace',
          name: 'Copernicus Data Space (ESA)',
          url: 'https://stac.dataspace.copernicus.eu/v1',
          type: 'STAC',
          isActive: false,
        },
        {
          id: 'landsat-stac',
          name: 'Landsat STAC (USGS)',
          url: 'https://landsatlook.usgs.gov/stac-server',
          type: 'STAC',
          isActive: false,
        },
        {
          id: 'creodias-stac',
          name: 'CREODIAS STAC',
          url: 'https://stac.creodias.eu/v1',
          type: 'STAC',
          isActive: false,
        },
        ...sources,
      ];
      state.activeSource = state.sources[0];
    }
    // Ensure comparisonStack is always initialized
    state.comparisonStack = state.comparisonStack ?? initialComparisonStack;
    return state as SourceState;
  };
