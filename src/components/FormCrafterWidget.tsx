import { useAppStore } from '../store';
import { useSourceStore } from '../store/useSourceStore';

export default function FormCrafterWidget() {
  const { comparisonStack } = useSourceStore();
  const { tile } = useAppStore();

  const { left, right } = comparisonStack;

  if (!left || !right) return null;

  const leftDate = left.properties.datetime
    ? new Date(left.properties.datetime).toISOString().split('T')[0]
    : '';
  const rightDate = right.properties.datetime
    ? new Date(right.properties.datetime).toISOString().split('T')[0]
    : '';

  const leftTileId = left.properties['dea:region_code'] ?? left.id ?? '';
  const rightTileId = right.properties['dea:region_code'] ?? right.id ?? '';

  const leftProductId = left.properties['sentinel:product_id'] ?? left.id ?? '';
  const rightProductId = right.properties['sentinel:product_id'] ?? right.id ?? '';

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:bottom-4 md:right-4 md:w-96 z-30 pointer-events-none">
      <div className="pointer-events-auto rounded-xl bg-black/80 border border-teal-500/50 shadow-2xl shadow-teal-500/10 backdrop-blur-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-teal-400 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Form Crafter
          </h3>
          <button
            onClick={() => {}}
            className="text-white/50 hover:text-white/80 transition p-1 rounded"
            aria-label="Close"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2 text-white/60">
            <span className="w-16 font-medium text-white/40">Base:</span>
            <span className="font-mono text-teal-300 truncate">{leftDate}</span>
            <span className="text-white/40">|</span>
            <span className="font-mono text-white/70 truncate">{left.id?.slice(0, 20)}...</span>
          </div>
          <div className="flex items-center gap-2 text-white/60">
            <span className="w-16 font-medium text-white/40">Overlay:</span>
            <span className="font-mono text-sky-300 truncate">{rightDate}</span>
            <span className="text-white/40">|</span>
            <span className="font-mono text-white/70 truncate">{right.id?.slice(0, 20)}...</span>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-white/10">
          <pre className="bg-black/50 rounded p-2 text-[10px] text-white/90 font-mono overflow-x-auto max-h-32">
            {[
              [tile.locationName, tile.tileId, tile.changeFlag, tile.productId].join('\t'),
              [leftDate, leftTileId, 'N', leftProductId].join('\t'),
              [rightDate, rightTileId, 'N', rightProductId].join('\t'),
            ].join('\n')}
          </pre>
        </div>

        <button
          onClick={() => {
            const row = [
              [tile.locationName, tile.tileId, tile.changeFlag, tile.productId].join('\t'),
              [leftDate, leftTileId, 'N', leftProductId].join('\t'),
              [rightDate, rightTileId, 'N', rightProductId].join('\t'),
            ].join('\n');
            navigator.clipboard?.writeText(row).catch(() => {});
          }}
          className="mt-3 w-full py-2 rounded-lg bg-gradient-to-r from-teal-500 to-sky-500 text-white font-medium text-sm hover:from-teal-600 hover:to-sky-600 transition-all shadow-lg shadow-teal-500/25 flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v10a2 2 0 01-2 2h-2a2 2 0 01-2-2" />
          </svg>
          Copy Form Rows
        </button>
      </div>
    </div>
  );
}