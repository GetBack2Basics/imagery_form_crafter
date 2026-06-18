import { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useAppStore } from '../store';
import { useSourceStore } from '../store/useSourceStore';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import SwipeSlider from './SwipeSlider';
import FormCrafterWidget from './FormCrafterWidget';
import LayerControlPanel from './LayerControlPanel';

interface AnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AnalysisModal({ isOpen, onClose }: AnalysisModalProps) {
  if (!isOpen) return null;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const tile = useAppStore((s) => s.tile);
  const { comparisonStack, swapComparison } = useSourceStore();
  const [swipePosition, setSwipePosition] = useState(50);
  const [overlayOpacity, setOverlayOpacity] = useState(50);
  const [basemap, setBasemap] = useState<'dark-matter' | 'satellite' | 'light'>('dark-matter');
  const [zoom, setZoom] = useState(11);

  const comparisonLeft = comparisonStack.left;
  const comparisonRight = comparisonStack.right;
  const hasComparison = Boolean(comparisonLeft && comparisonRight);

  const leftDate = comparisonLeft?.properties?.datetime
    ? new Date(comparisonLeft.properties.datetime).toLocaleDateString()
    : 'Unknown';
  const rightDate = comparisonRight?.properties?.datetime
    ? new Date(comparisonRight.properties.datetime).toLocaleDateString()
    : 'Unknown';
  const tileId = comparisonLeft?.properties?.['dea:region_code'] ?? comparisonLeft?.id ?? 'Unknown';

  const BASEMAPS = {
    'dark-matter': 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
    'satellite': 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    'light': 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
  };

  useEffect(() => {
    if (!containerRef.current || !hasComparison) return;

    const MapCtor = maplibregl.Map;
    if (!MapCtor) {
      containerRef.current!.innerHTML =
        '<div style="color:#f87171;padding:12px;text-align:center">MapLibre missing.</div>';
      return;
    }

    const map = new MapCtor({
      container: containerRef.current,
      style: BASEMAPS[basemap],
      center: tile.center ?? [151.2093, -33.8688],
      zoom: tile.bbox ? 11 : 10,
    });

    // Add NavigationControl
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

    let leftImg: HTMLImageElement | null = null;
    let rightImg: HTMLImageElement | null = null;
    let canvas: HTMLCanvasElement | null = null;
    let hasCleanedUp = false;

    const injectComparisonLayers = () => {
      if (!hasComparison || !tile.bbox || !map.style) return;

      ['comparison-left', 'comparison-right'].forEach((id) => {
        if (map.getLayer(id)) map.removeLayer(id);
        if (map.getSource(id)) map.removeSource(id);
      });

      if (comparisonLeft?.assets?.thumbnail?.href && comparisonRight?.assets?.thumbnail?.href) {
        const [minx, miny, maxx, maxy] = tile.bbox;

        if (!map.getSource('comparison-left')) {
          map.addSource('comparison-left', {
            type: 'image',
            url: comparisonLeft!.assets!.thumbnail!.href,
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
            url: comparisonLeft!.assets!.thumbnail!.href,
            coordinates: [[minx, maxy], [maxx, maxy], [maxx, miny], [minx, miny]],
          });
        }

        if (!map.getSource('comparison-right')) {
          map.addSource('comparison-right', {
            type: 'image',
            url: comparisonRight!.assets!.thumbnail!.href,
            coordinates: [[minx, maxy], [maxx, maxy], [maxx, miny], [minx, miny]],
          });
          map.addLayer({
            id: 'comparison-right',
            type: 'raster',
            source: 'comparison-right',
            paint: { 'raster-opacity': overlayOpacity / 100 },
          }, 'comparison-left');
        } else {
          (map.getSource('comparison-right') as any).updateImage({
            url: comparisonRight!.assets!.thumbnail!.href,
            coordinates: [[minx, maxy], [maxx, maxy], [maxx, miny], [minx, miny]],
          });
        }

        map.setLayoutProperty('comparison-left', 'visibility', 'none');
        map.setLayoutProperty('comparison-right', 'visibility', 'none');

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
      }
    };

    const setupCanvasOverlay = () => {
      if (!hasComparison || !tile.bbox || !containerRef.current || hasCleanedUp) return;

      const oldCanvas = containerRef.current.querySelector('.swipe-canvas');
      if (oldCanvas) oldCanvas.remove();

      canvas = document.createElement('canvas');
      canvas.className = 'swipe-canvas absolute inset-0 pointer-events-none z-10';
      canvas.style.position = 'absolute';
      canvas.style.top = '0';
      canvas.style.left = '0';
      canvas.style.pointerEvents = 'none';
      canvas.style.zIndex = '10';
      containerRef.current.appendChild(canvas);

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

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

        if (!containerRef.current || !map.getContainer() || hasCleanedUp) return;

        const mapContainer = map.getContainer();
        const { width, height } = mapContainer.getBoundingClientRect();
        if (width === 0 || height === 0) return;

        const canvasEl = canvas!;
        canvasEl.width = width * window.devicePixelRatio;
        canvasEl.height = height * window.devicePixelRatio;
        canvasEl.style.width = `${width}px`;
        canvasEl.style.height = `${height}px`;

        const ctx = canvasEl.getContext('2d');
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

        drawQuad(leftImg!, tl.x, tl.y, tr.x, tr.y, br.x, br.y, bl.x, bl.y);
        drawQuad(rightImg!, tl.x, tl.y, tr.x, tr.y, br.x, br.y, bl.x, bl.y, swipeX, 'right');
      };

      render();
    };

    map.on('load', () => {
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

      injectComparisonLayers();
      setupCanvasOverlay();

      map.fitBounds(
        [
          [tile.bbox![0], tile.bbox![1]],
          [tile.bbox![2], tile.bbox![3]],
        ],
        { padding: 20, maxZoom: 13, duration: 500 },
      );
    });

    map.on('zoom', () => {
      setZoom(map.getZoom());
    });

    map.on('moveend', setupCanvasOverlay);
    map.on('zoomend', setupCanvasOverlay);

    map.on('styledata', () => {
      injectComparisonLayers();
    });

    const updateOverlayOpacity = () => {
      if (map.getLayer('comparison-right')) {
        map.setPaintProperty('comparison-right', 'raster-opacity', overlayOpacity / 100);
      }
    };

    const handleBasemapChange = (newBasemap: 'dark-matter' | 'satellite' | 'light') => {
      map.setStyle(BASEMAPS[newBasemap]);
    };

    const handleBasemapChangeWrapper = useCallback((newBasemap: 'dark-matter' | 'satellite' | 'light') => {
      handleBasemapChange(newBasemap);
    }, []);

    useEffect(() => {
      if (map.loaded()) updateOverlayOpacity();
    }, [overlayOpacity]);

    useEffect(() => {
      handleBasemapChangeWrapper(basemap);
    }, [basemap, handleBasemapChangeWrapper]);

    const updateSwipe = () => {
      if (!hasCleanedUp) requestAnimationFrame(setupCanvasOverlay);
    };

    // Re-inject layers on style change (basemap switch)
    map.on('styledata', () => {
      if (map.getStyle().version === 8) {
        injectComparisonLayers();
      }
    });

    if (map.loaded()) {
      injectComparisonLayers();
    } else {
      map.once('load', injectComparisonLayers);
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
    swipePosition,
    hasComparison,
    overlayOpacity,
    basemap,
  ]);

  return createPortal(
    <div className="fixed inset-0 z-50 flex flex-col">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-2xl" onClick={onClose} />

      <div className="relative flex-1 flex flex-col z-10">
        <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-6 py-4 pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-4 bg-black/60 backdrop-blur-xl rounded-xl px-4 py-2 border border-teal-500/30">
            <div className="flex items-center gap-2 text-teal-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span className="font-medium text-white">Analyzing {tileId} Change Detection</span>
            </div>
            <div className="flex items-center gap-4 text-sm text-white/80">
              <span className="flex items-center gap-1.5 text-lime-400">
                <span className="w-2 h-2 rounded-full bg-lime-400" />
                Base: {leftDate}
              </span>
              <span className="w-px h-6 bg-white/20" />
              <span className="flex items-center gap-1.5 text-sky-400">
                <span className="w-2 h-2 rounded-full bg-sky-400" />
                Overlay: {rightDate}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="pointer-events-auto p-2 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-all"
            aria-label="Close comparison"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="relative flex-1 min-h-0">
          <div ref={containerRef} className="absolute inset-0" />
          <SwipeSlider position={swipePosition} onPositionChange={setSwipePosition} enabled={true} />
          <FormCrafterWidget />
          <LayerControlPanel
            overlayOpacity={overlayOpacity}
            onOpacityChange={setOverlayOpacity}
            basemap={basemap}
            onBasemapChange={setBasemap}
            zoom={zoom}
            onSwap={swapComparison}
            comparisonLeft={comparisonLeft}
            comparisonRight={comparisonRight}
          />
        </div>
      </div>
    </div>,
    document.body
  );
}