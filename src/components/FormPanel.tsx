import { useCallback } from 'react';
import { useAppStore } from '../store';

export default function FormPanel() {
  const tile = useAppStore((s) => s.tile);

  const copyRow = useCallback(() => {
    const row = [
      tile.locationName ?? '',
      tile.tileId ?? '',
      tile.changeFlag ?? 'N',
      tile.productId ?? '',
    ].join('\t');
    navigator.clipboard?.writeText(row).catch(() => {
      // noop fallback
    });
  }, [tile]);

  return (
    <div className="h-full w-96 border-l border-white/10 bg-white/5 backdrop-blur-lg p-4">
      <h2 className="mb-4 text-lg font-medium text-white/90">Form Crafter</h2>
      <div className="mb-4 space-y-1 text-sm text-white/70">
        <div>TILE_ID: {tile.tileId}</div>
        <div>ACQUISITION_DATE: {tile.date}</div>
        <div>PRODUCT_ID: {tile.productId}</div>
      </div>
      <pre className="rounded-md border border-white/10 bg-black/50 p-3 text-xs text-white/90">
        {[tile.locationName, tile.tileId, tile.changeFlag, tile.productId].join('\t')}
      </pre>
      <button
        onClick={copyRow}
        className="mt-3 rounded-md border border-white/20 px-3 py-1.5 text-sm text-white/80 hover:bg-white/10"
      >
        Copy Row
      </button>
    </div>
  );
}
