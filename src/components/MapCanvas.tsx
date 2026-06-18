import { useEffect, useRef } from 'react';
import { useAppStore } from '../store';
import { useSourceStore } from '../store/useSourceStore';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

export default function MapCanvas() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const activeSource = useSourceStore((s) => s.activeSource);
  const tile = useAppStore((s) => s.tile);
  const selectedItem = useAppStore((s) => s.selectedItem);

  useEffect(() => {
    if (!containerRef.current) return;

    const MapCtor = maplibregl.Map;
    if (!MapCtor) {
      containerRef.current!.innerHTML =
        '<div style="color:#f87171;padding:12px">MapLibre missing.</div>';
      return;
    }

    const map = new MapCtor({
      container: containerRef.current,
      style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
      center: tile.center ?? [151.2093, -33.8688],
      zoom: tile.bbox ? 11 : 10,
    });

    const addImageryLayer = () => {
      if (!tile.bbox) return;

      // Add AOI rectangle
      if (map.getSource('aoi-bbox')) {
        (map.getSource('aoi-bbox') as any).setData({
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [tile.bbox[0], tile.bbox[1]],
                [tile.bbox[2], tile.bbox[1]],
                [tile.bbox[2], tile.bbox[3]],
                [tile.bbox[0], tile.bbox[3]],
                [tile.bbox[0], tile.bbox[1]],
              ],
            ],
          },
        });
      } else {
        map.addSource('aoi-bbox', {
          type: 'geojson',
          data: {
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [
                [
                  [tile.bbox[0], tile.bbox[1]],
                  [tile.bbox[2], tile.bbox[1]],
                  [tile.bbox[2], tile.bbox[3]],
                  [tile.bbox[0], tile.bbox[3]],
                  [tile.bbox[0], tile.bbox[1]],
                ],
              ],
            },
          },
        });
        map.addLayer({
          id: 'aoi-bbox-layer',
          type: 'line',
          source: 'aoi-bbox',
          paint: {
            'line-color': '#22d3ee',
            'line-width': 2,
            'line-dasharray': [4, 4],
          },
        });
      }

      // Add tile imagery layer (visual/TCI asset)
      if (selectedItem?.assets?.thumbnail?.href && tile.bbox) {
        const thumbUrl = selectedItem.assets.thumbnail.href;
        const [minx, miny, maxx, maxy] = tile.bbox;
        if (map.getSource('tile-imagery')) {
          (map.getSource('tile-imagery') as any).updateImage({ url: thumbUrl, coordinates: [[minx, maxy], [maxx, maxy], [maxx, miny], [minx, miny]] });
        } else {
          map.addSource('tile-imagery', {
            type: 'image',
            url: thumbUrl,
            coordinates: [
              [minx, maxy], // top-left
              [maxx, maxy], // top-right
              [maxx, miny], // bottom-right
              [minx, miny], // bottom-left
            ],
          });
          map.addLayer({
            id: 'tile-imagery-layer',
            type: 'raster',
            source: 'tile-imagery',
            paint: {
              'raster-opacity': 0.9,
            },
          }, 'aoi-bbox-layer');
        }
      }
    };

    map.on('load', () => {
      addImageryLayer();
    });

    // Update center/zoom when tile changes
    if (tile.bbox && tile.center) {
      map.fitBounds(
        [
          [tile.bbox[0], tile.bbox[1]],
          [tile.bbox[2], tile.bbox[3]],
        ],
        { padding: 20, maxZoom: 13, duration: 500 },
      );
    }

    return () => {
      try {
        map.remove();
      } catch (err) {
        // ignore
      }
    };
  }, [activeSource?.id, tile.bbox, tile.center, tile.tileId, selectedItem?.id]);

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />
      {tile.bbox && (
        <div className="absolute bottom-4 left-4 z-10 rounded-md bg-black/70 px-3 py-2 text-xs text-white/90 backdrop-blur pointer-events-none">
          <div>BBox: {tile.bbox.map((n) => n.toFixed(4)).join(', ')}</div>
          <div>Center: {tile.center?.map((n) => n.toFixed(4)).join(', ')}</div>
        </div>
      )}
    </div>
  );
}