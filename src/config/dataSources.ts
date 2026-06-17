export const DATA_SOURCES = {
  baseMapStyle: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  stacApi: 'https://explorer.sandbox.dea.ga.gov.au/stac',
  aerialWmts: 'https://maps.six.nsw.gov.au/arcgis/rest/services/public/NSW_Imagery/MapServer/WMTS/1.0.0/WMTSCapabilities.xml',
  elevationWms: 'https://elevation.fsdf.org.au/arcgis/services/ELVIS/Elevation_Foundation_Spatial_Data_Service/MapServer/WMSServer',
} as const;

export const APP_CONFIG = {
  defaultCenter: [151.2093, -33.8688],
  defaultZoom: 10,
  swipeDefaultLeftLayer: 'dea-sentinel-2',
  swipeDefaultRightLayer: 'dea-sentinel-2-prev',
} as const;
