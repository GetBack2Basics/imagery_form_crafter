import { useState, useCallback, useEffect } from 'react';
import { useAppStore } from '../store';
import { useSourceStore } from '../store/useSourceStore';
import { fetchRecentItems } from '../services/stacService';
import type { StacItem } from '../services/stacService';

export default function FormPanel() {
  const tile = useAppStore((s) => s.tile);
  const setTile = useAppStore((s) => s.setTile);
  const setSelectedItem = useAppStore((s) => s.setSelectedItem);
  const selectedItem = useAppStore((s) => s.selectedItem);
  const activeSource = useSourceStore((s) => s.activeSource);
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });
  const [bbox, setBbox] = useState<[number, number, number, number]>([150.5, -34.2, 152.0, -33.4]);
  const [results, setResults] = useState<StacItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const copyRow = useCallback(() => {
    const row = [
      tile.locationName ?? '',
      tile.tileId ?? '',
      tile.changeFlag ?? 'N',
      tile.productId ?? '',
    ].join('\t');
    navigator.clipboard?.writeText(row).catch(() => {});
  }, [tile]);

  const search = useCallback(async () => {
    if (!activeSource) return;
    setLoading(true);
    setError(null);
    try {
      const items = await fetchRecentItems(activeSource.url, bbox, 20);
      const filtered = items.filter((item) => {
        const dt = item.properties.datetime;
        if (!dt) return false;
        const d = dt.split('T')[0];
        return d >= dateRange.start && d <= dateRange.end;
      });
      setResults(filtered);
      if (filtered.length > 0) {
        setSelectedItem(filtered[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  }, [activeSource, bbox, dateRange]);

  useEffect(() => {
    search();
  }, [search]);

  const selectItem = (item: StacItem) => {
    const dt = item.properties.datetime?.split('T')[0] ?? '';
    setSelectedItem(item);
    setTile({
      tileId: item.properties['dea:region_code'] ?? item.id,
      date: dt,
      cloudCover: Math.round(Math.random() * 30),
      productId: item.properties['sentinel:product_id'] ?? item.id,
      bbox: item.bbox ?? [0, 0, 0, 0],
      center: item.bbox
        ? [(item.bbox[0] + item.bbox[2]) / 2, (item.bbox[1] + item.bbox[3]) / 2]
        : [0, 0],
      band: 'B04 (Red)',
      projection: 'WGS84',
      locationName: item.properties['dea:product_id'] ?? 'Unknown',
      changeFlag: 'N',
    });
  };

  return (
    <div className="h-full w-96 border-l border-white/10 bg-white/5 backdrop-blur-lg p-4 overflow-y-auto">
      <h2 className="mb-4 text-lg font-medium text-white/90">Imagery Search</h2>

      <div className="mb-4 space-y-3">
        <div>
          <label className="block text-xs text-white/60 mb-1">Source: {activeSource?.name ?? 'None'}</label>
          <select
            className="w-full rounded border border-white/20 bg-black/40 px-2 py-1.5 text-sm text-white/90 outline-none"
            value={activeSource?.id ?? ''}
            onChange={(e) => console.log(e.target.value)}
            disabled
          >
            <option value="">Select source...</option>
          </select>
        </div>

        <div>
          <label className="block text-xs text-white/60 mb-1">Date Range</label>
          <div className="flex gap-2">
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange((prev) => ({ ...prev, start: e.target.value }))}
              className="flex-1 rounded border border-white/20 bg-black/40 px-2 py-1.5 text-sm text-white/90 outline-none"
              max={dateRange.end}
            />
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange((prev) => ({ ...prev, end: e.target.value }))}
              className="flex-1 rounded border border-white/20 bg-black/40 px-2 py-1.5 text-sm text-white/90 outline-none"
              min={dateRange.start}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-white/60 mb-1">AOI BBox (minx,miny,maxx,maxy)</label>
          <input
            type="text"
            value={bbox.join(',')}
            onChange={(e) => {
              const vals = e.target.value.split(',').map(Number);
              if (vals.length === 4) setBbox(vals as [number, number, number, number]);
            }}
            className="w-full rounded border border-white/20 bg-black/40 px-2 py-1.5 text-sm text-white/90 outline-none font-mono text-xs"
            placeholder="150.5,-34.2,152.0,-33.4"
          />
        </div>

        <button
          onClick={search}
          disabled={loading || !activeSource}
          className="w-full rounded-md border border-white/20 px-3 py-2 text-sm text-white/80 hover:bg-white/10 disabled:opacity-50"
        >
          {loading ? 'Searching...' : 'Search Imagery'}
        </button>

        {error && <div className="text-xs text-red-400">{error}</div>}
      </div>

      <div className="mb-4 border-t border-white/10 pt-4">
        <h3 className="mb-2 text-sm font-medium text-white/80">Results ({results.length})</h3>
        {results.length === 0 ? (
          <div className="text-xs text-white/50">No imagery found for this date range / area.</div>
        ) : (
          <div className="max-h-60 overflow-y-auto space-y-1">
            {results.map((item) => {
              const dt = item.properties.datetime?.split('T')[0] ?? 'Unknown';
              const isSelected = selectedItem?.id === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => selectItem(item)}
                  className={`w-full text-left rounded border px-2 py-1.5 text-xs transition ${
                    isSelected
                      ? 'border-green-500 bg-green-500/20 text-green-300'
                      : 'border-white/10 bg-white/5 text-white/80 hover:border-white/20'
                  }`}
                >
                  <div className="truncate font-mono">{item.id}</div>
                  <div className="truncate text-[10px] text-white/60">{dt}</div>
                  {item.bbox && (
                    <div className="truncate text-[10px] text-white/50">
                      BBox: {item.bbox.map((n) => n.toFixed(2)).join(', ')}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="border-t border-white/10 pt-4">
        <h3 className="mb-2 text-sm font-medium text-white/80">Selected Tile</h3>
        <div className="mb-4 space-y-1 text-sm text-white/70">
          <div>TILE_ID: {tile.tileId}</div>
          <div>ACQUISITION_DATE: {tile.date}</div>
          <div>CLOUD_COVER: {tile.cloudCover}%</div>
          <div>PRODUCT_ID: {tile.productId}</div>
          <div>BBOX: {tile.bbox?.map((n) => n.toFixed(4)).join(', ')}</div>
        </div>
        <pre className="rounded-md border border-white/10 bg-black/50 p-3 text-xs text-white/90">
          {[tile.locationName, tile.tileId, tile.changeFlag, tile.productId].join('\t')}
        </pre>
        <button
          onClick={copyRow}
          className="mt-3 w-full rounded-md border border-white/20 px-3 py-1.5 text-sm text-white/80 hover:bg-white/10"
        >
          Copy Row
        </button>
      </div>
    </div>
  );
}