import { useEffect, useRef, useState } from 'react';
import { useAppStore } from '../store';
import { useSourceStore } from '../store/useSourceStore';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import SwipeSlider from './SwipeSlider';

export default function MapCanvas() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const tile = useAppStore((s) => s.tile);
  const { comparisonStack } = useSourceStore();
  const [swipePosition, setSwipePosition] = useState(50);

  const comparisonLeft = comparisonStack.left;
  const comparisonRight = comparisonStack.right;
  const hasComparison = Boolean(comparisonLeft && comparisonRight);

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

    let leftImg: HTMLImageElement | null = null;
    let rightImg: HTMLImageElement | null = null;
    let hasCleanedUp = false;

    const updateComparisonLayers = () => {
      if (!hasComparison || !tile.bbox || !map.style) return;

      ['comparison-left', 'comparison-right'].forEach((id) => {
        if (map.getLayer(id)) map.removeLayer(id);
        if (map.getSource(id)) map.removeSource(id);
      });

      if (comparisonLeft?.assets?.thumbnail?.href && comparisonRight?.assets?.thumbnail?.href) {
        const leftUrl = comparisonLeft.assets.thumbnail.href;
        const rightUrl = comparisonRight.assets.thumbnail.href;
        const [minx, miny, maxx, maxy] = tile.bbox;

        if (!map.getSource('comparison-left')) {
          map.addSource('comparison-left', {
            type: 'image',
            url: leftUrl,
            coordinates: [[minx, maxy], [maxx, maxy], [maxx, miny], [minx, miny]],
          });
          map.addLayer({
            id: 'comparison-left',
            type: 'raster',
            source: 'comparison-left',
            paint: { 'raster-opacity': 1.0 },
          }, 'aoi-bbox-layer');
        } else {
          (map.getSource('comparison-left') as any).updateImage({
            url: leftUrl,
            coordinates: [[minx, maxy], [maxx, maxy], [maxx, miny], [minx, miny]],
          });
        }

        if (!map.getSource('comparison-right')) {
          map.addSource('comparison-right', {
            type: 'image',
            url: rightUrl,
            coordinates: [[minx, maxy], [maxx, maxy], [maxx, miny], [minx, miny]],
          });
          map.addLayer({
            id: 'comparison-right',
            type: 'raster',
            source: 'comparison-right',
            paint: { 'raster-opacity': 1.0 },
          }, 'comparison-left');
        } else {
          (map.getSource('comparison-right') as any).updateImage({
            url: rightUrl,
            coordinates: [[minx, maxy], [maxx, maxy], [maxx, miny], [minx, miny]],
          });
        }

        // Hide the default image layers - we'll render via canvas
        map.setLayoutProperty('comparison-left', 'visibility', 'none');
        map.setLayoutProperty('comparison-right', 'visibility', 'none');
      }
    };

    const setupCanvasOverlay = () => {
      if (!hasComparison || !tile.bbox || !containerRef.current || hasCleanedUp) return;

      // Remove old canvas
      const oldCanvas = containerRef.current.querySelector('.swipe-canvas');
      if (oldCanvas) oldCanvas.remove();

      const canvas = document.createElement('canvas');
      canvas.className = 'swipe-canvas absolute inset-0 pointer-events-none z-10';
      containerRef.current.appendChild(canvas);

      // Initial context check
      if (!canvas.getContext('2d')) return;

      const mapContainer = map.getContainer();
      const { width, height } = mapContainer.getBoundingClientRect();
      if (width === 0 || height === 0) return;

      canvas.width = width * window.devicePixelRatio;
      canvas.height = height * window.devicePixelRatio;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      canvas.style.position = 'absolute';
      canvas.style.top = '0';
      canvas.style.left = '0';
      canvas.style.pointerEvents = 'none';
      canvas.style.zIndex = '10';

      // Load images if not loaded
      if (!leftImg) {
        leftImg = new Image();
        leftImg.crossOrigin = 'anonymous';
        leftImg.src = comparisonLeft!.assets!.thumbnail!.href;
      }
      if (!rightImg) {
        rightImg = new Image();
        rightImg.crossOrigin = 'anonymous';
        rightImg.src = comparisonRight!.assets!.thumbnail!.href;
      }

      if (!leftImg.complete || !rightImg.complete) return;

      const render = () => {
        if (hasCleanedUp) return;

        // Re-check valid state
        if (!containerRef.current || !map.getContainer() || hasCleanedUp) return;

        const mapContainer = map.getContainer();
        const { width, height } = mapContainer.getBoundingClientRect();
        if (width === 0 || height === 0) return;

        canvas.width = width * window.devicePixelRatio;
        canvas.height = height * window.devicePixelRatio;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const [minx, miny, maxx, maxy] = tile.bbox!;
        
        const project = (lng: number, lat: number) => {
          const point = map.project([lng, lat]);
          return { x: point.x, y: point.y };
        };

        const tl = project(minx, maxy);
        const tr = project(maxx, maxy);
        const br = project(maxx, miny);
        const bl = project(minx, miny);

        const swipeX = width * (swipePosition / 100);

        ctx.clearRect(0, 0, width, height);

        // Draw full quad for an image
        const drawQuad = (
          img: HTMLImageElement,
          x1: number, y1: number,
          x2: number, y2: number,
          x3: number, y3: number,
          x4: number, y4: number,
          clipX?: number,
          clipSide?: 'left' | 'right'
        ) => {
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.lineTo(x3, y3);
          ctx.lineTo(x4, y4);
          ctx.closePath();
          ctx.clip();

          if (clipX !== undefined && clipSide) {
            ctx.beginPath();
            if (clipSide === 'left') {
              ctx.moveTo(0, 0);
              ctx.lineTo(clipX, 0);
              ctx.lineTo(clipX, height);
              ctx.lineTo(0, height);
            } else {
              ctx.moveTo(clipX, 0);
              ctx.lineTo(width, 0);
              ctx.lineTo(width, height);
              ctx.lineTo(clipX, height);
            }
            ctx.closePath();
            ctx.clip();
          }

          const minX = Math.min(x1, x2, x3, x4);
          const maxX = Math.max(x1, x2, x3, x4);
          const minY = Math.min(y1, y2, y3, y4);
          const maxY = Math.max(y1, y2, y3, y4);
          ctx.drawImage(img, 0, 0, img.width, img.height, minX, minY, maxX - minX, maxY - minY);

          ctx.restore();
        };

        // Clear
        ctx.clearRect(0, 0, width, height);

        // Draw left image (base) - full extent
        drawQuad(leftImg!, tl.x, tl.y, tr.x, tr.y, br.x, br.y, bl.x, bl.y);

        // Draw right image (overlay) - only right side of swipe
        drawQuad(rightImg!, tl.x, tl.y, tr.x, tr.y, br.x, br.y, bl.x, bl.y, swipeX, 'right');
      };

      render();
    };

    map.on('load', () => {
      // Add AOI bbox
      if (tile.bbox) {
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
      }

      updateComparisonLayers();

      // Create canvas overlay for swipe
      if (hasComparison && tile.bbox) {
        const canvas = document.createElement('canvas');
        canvas.className = 'swipe-canvas absolute inset-0 pointer-events-none z-10';
        canvas.style.position = 'absolute';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.pointerEvents = 'none';
        canvas.style.zIndex = '10';
        containerRef.current?.appendChild(canvas);
      }

      map.fitBounds(
        [
          [tile.bbox![0], tile.bbox![1]],
          [tile.bbox![2], tile.bbox![3]],
        ],
        { padding: 20, maxZoom: 13, duration: 500 },
      );
    });

    // Update canvas on map move/zoom/swipe
    map.on('moveend', setupCanvasOverlay);
    map.on('zoomend', setupCanvasOverlay);

    const updateSwipe = () => {
      if (!hasCleanedUp) requestAnimationFrame(setupCanvasOverlay);
    };

    if (map.loaded()) {
      updateComparisonLayers();
    } else {
      map.once('load', updateComparisonLayers);
    }

    const swipeInterval = setInterval(updateSwipe, 100);

    return () => {
      hasCleanedUp = true;
      clearInterval(swipeInterval);
      try {
        map.remove();
      } catch (err) {
        // ignore
      }
    };
  }, [
    tile.bbox,
    tile.center,
    tile.tileId,
    comparisonLeft?.id,
    comparisonRight?.id,
    swipePosition,
    hasComparison,
  ]);

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />
      {hasComparison && <SwipeSlider position={swipePosition} onPositionChange={setSwipePosition} enabled />}
      {tile.bbox && (
        <div className="absolute bottom-4 left-4 z-10 rounded-md bg-black/70 px-3 py-2 text-xs text-white/90 backdrop-blur pointer-events-none">
          <div>BBox: {tile.bbox.map((n) => n.toFixed(4)).join(', ')}</div>
          <div>Center: {tile.center?.map((n) => n.toFixed(4)).join(', ')}</div>
        </div>
      )}
    </div>
  );
}