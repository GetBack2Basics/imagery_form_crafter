import { useEffect, useRef } from 'react';
import { useSourceStore } from '../store/useSourceStore';

export default function MapCanvas() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const activeSource = useSourceStore((s) => s.activeSource);

  useEffect(() => {
    if (!containerRef.current || !activeSource) return;

    const MapCtor = (window as any).maplibregl?.Map;
    if (!MapCtor) {
      containerRef.current!.innerHTML =
        '<div style="color:#f87171;padding:12px">MapLibre missing.</div>';
      return;
    }

    const map = new MapCtor({
      container: containerRef.current,
      style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
      center: [151.2093, -33.8688],
      zoom: 10,
    });

    return () => {
      try {
        map.remove();
      } catch (err) {
        // ignore
      }
    };
  }, [activeSource?.id]);

  return <div className="h-full w-full" />;
}
