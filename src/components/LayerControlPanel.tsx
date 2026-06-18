type BasemapStyle = 'dark-matter' | 'satellite' | 'light';

type LayerControlPanelProps = {
  overlayOpacity: number;
  onOpacityChange: (opacity: number) => void;
  basemap: BasemapStyle;
  onBasemapChange: (basemap: BasemapStyle) => void;
  zoom: number;
  onSwap: () => void;
  comparisonLeft: { properties: { datetime?: string } } | null;
  comparisonRight: { properties: { datetime?: string } } | null;
};

export default function LayerControlPanel({
  overlayOpacity,
  onOpacityChange,
  basemap,
  onBasemapChange,
  zoom,
  onSwap,
  comparisonLeft,
  comparisonRight,
}: LayerControlPanelProps) {
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
      <div className="pointer-events-auto flex items-center gap-3 bg-black/50 backdrop-blur-xl border border-white/10 rounded-full px-4 py-2 shadow-2xl shadow-black/50">
        {/* Swap Button */}
        <button
          onClick={onSwap}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white/90 hover:text-white text-teal-400 border border-white/10"
          aria-label="Swap Base and Overlay"
          title="Swap Base / Overlay"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4M2 13l4 4m0 0l-4 4m4-4H4a2 2 0 01-2-2V7a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2h-2" />
          </svg>
        </button>

        {/* Dates & Swap Label */}
        <div className="flex items-center gap-2 px-1">
          <span className="text-xs font-medium text-lime-400 whitespace-nowrap">
            Base: {comparisonLeft?.properties?.datetime ? new Date(comparisonLeft.properties.datetime).toLocaleDateString() : 'Unknown'}
          </span>
          <span className="text-white/30">|</span>
          <span className="text-xs font-medium text-sky-400 whitespace-nowrap">
            Overlay: {comparisonRight?.properties?.datetime ? new Date(comparisonRight.properties.datetime).toLocaleDateString() : 'Unknown'}
          </span>
        </div>

        {/* Opacity Slider */}
        <div className="flex items-center gap-2 px-2">
          <span className="text-xs text-white/60 w-10 text-right">Opacity</span>
          <input
            type="range"
            min="0"
            max="100"
            value={overlayOpacity}
            onChange={(e) => onOpacityChange(parseInt(e.target.value, 10))}
            className="w-32 h-1.5 appearance-none bg-white/20 rounded-full slider-thumb-teal cursor-pointer"
            aria-label="Overlay opacity"
          />
          <span className="text-xs font-mono text-white/80 w-8" style={{ width: '2.5rem' }}>
            {overlayOpacity}%
          </span>
        </div>

        {/* Basemap Dropdown */}
        <div className="relative">
          <select
            value={basemap}
            onChange={(e) => onBasemapChange(e.target.value as 'dark-matter' | 'satellite' | 'light')}
            className="appearance-none bg-black/60 border border-white/10 rounded-full px-3 py-1.5 pr-8 text-xs text-white/90 cursor-pointer focus:outline-none focus:border-teal-400/50"
          >
            <option value="dark-matter">Dark Matter</option>
            <option value="satellite">Satellite</option>
            <option value="light">Light (Voyager)</option>
          </select>
          <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-white/40">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Zoom Indicator */}
        <div className="flex items-center gap-1.5 px-2 bg-white/5 rounded-full border border-white/10">
          <span className="text-xs text-white/60">Z</span>
          <span className="font-mono text-xs text-white/90 tabular-nums" style={{ minWidth: '3.5ch' }}>
            {zoom.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}