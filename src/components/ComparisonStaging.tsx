import { useSourceStore } from '../store/useSourceStore';
import type { StacItem } from '../services/stacService';

interface StagingSlotProps {
  label: string;
  side: 'left' | 'right';
  item: StacItem | null;
  onClear: () => void;
}

function StagingSlot({ label, side, item, onClear }: StagingSlotProps) {
  const isOccupied = Boolean(item);

  return (
    <div
      className={`
        relative flex flex-col items-center justify-center gap-1.5
        rounded-lg border-2 p-3 min-h-[120px] w-full
        bg-white/5 backdrop-blur-lg transition-all duration-200
        ${isOccupied
          ? 'border-teal-500/60 bg-teal-500/10 shadow-[0_0_20px_rgba(20,184,166,0.3)]'
          : 'border-white/10 bg-white/5 hover:border-white/20'
        }
        ${side === 'left' ? 'rounded-r-full' : 'rounded-l-full'}
      `}
      onClick={() => (item ? onClear() : null)}
    >
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur text-[10px] uppercase tracking-wider text-white/70">
        {label}
      </div>

      {item ? (
        <div className="w-full flex flex-col items-center gap-1">
          <div className="flex items-center gap-1.5 text-teal-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-xs font-medium truncate max-w-[140px]">{item?.id ?? 'Scene'}</span>
          </div>
          <div className="text-[10px] text-white/50 truncate max-w-[160px]">
            {item?.properties?.datetime ? new Date(item.properties.datetime).toLocaleDateString() : 'No date'}
          </div>
          <div className="text-[10px] text-white/40 truncate max-w-[160px]">
            Cloud: {item?.properties && 'eo:cloud_cover' in item.properties ? Math.round(Number(item.properties['eo:cloud_cover'])) + '%' : 'N/A'}
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onClear(); }}
            className="mt-1 text-[10px] text-red-400 hover:text-red-300 px-2 py-0.5 rounded border border-red-400/30 transition"
          >
            Clear Slot
          </button>
        </div>
      ) : (
        <div className="text-center text-white/40">
          <svg className="w-8 h-8 mx-auto mb-1 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p className="text-xs">Drop scene here</p>
        </div>
      )}
    </div>
  );
}

export default function ComparisonStaging() {
  const { stagingSlots, setStagingLeft, setStagingRight, clearStaging, swapStagingToComparison } = useSourceStore();

  const slotLeft = () => setStagingLeft(null);
  const slotRight = () => setStagingRight(null);
  const doClear = () => clearStaging();
  const doSwap = () => swapStagingToComparison();

  return (
    <div className="mb-4 p-3 rounded-xl bg-gradient-to-r from-teal-500/10 to-sky-500/10 border border-teal-500/20">
      <p className="mb-3 text-xs text-white/60 text-center">
        Drop scenes here to compare. Base on left, Overlay on right.
      </p>

      <div className="flex gap-2">
        <StagingSlot
          label="Base (Left)"
          side="left"
          item={stagingSlots.left}
          onClear={slotLeft}
        />
        <StagingSlot
          label="Overlay (Right)"
          side="right"
          item={stagingSlots.right}
          onClear={slotRight}
        />
      </div>

      {stagingSlots.left || stagingSlots.right ? (
        <div className="mt-3 space-y-2">
          {stagingSlots.left && stagingSlots.right && (
            <button
              onClick={doSwap}
              className="w-full py-2.5 rounded-lg bg-gradient-to-r from-teal-500 to-sky-500 text-white font-medium text-sm hover:from-teal-600 hover:to-sky-600 transition-all shadow-lg shadow-teal-500/25"
            >
              Launch Analysis
            </button>
          )}
          {(!stagingSlots.left || !stagingSlots.right) && (
            <button
              disabled
              className="w-full py-2.5 rounded-lg bg-white/5 border border-white/10 text-white/40 text-sm cursor-not-allowed"
            >
              Select both scenes to launch
            </button>
          )}
          {(stagingSlots.left || stagingSlots.right) && (
            <button
              onClick={doClear}
              className="w-full py-1.5 rounded-lg border border-white/10 bg-white/5 text-white/60 text-xs hover:border-white/20 hover:bg-white/10 transition"
            >
              Clear All Slots
            </button>
          )}
        </div>
      ) : (
        <div className="mt-3 text-center text-white/40 text-xs">
          Search for scenes below, then click to slot them
        </div>
      )}
    </div>
  );
}