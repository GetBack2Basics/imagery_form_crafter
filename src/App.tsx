import { useState, useEffect, useCallback, useMemo } from 'react';
import MapCanvas from './components/MapCanvas';
import FormPanel from './components/FormPanel';
import SourceManager from './components/SourceManager';
import AnalysisModal from './components/AnalysisModal';
import { useSourceStore } from './store/useSourceStore';

export default function App() {
  const activeSource = useSourceStore((s) => s.activeSource);
  const { comparisonStack } = useSourceStore();
  const [status, setStatus] = useState('Initializing imagery service...');
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);

  const verify = useCallback(() => {
    setTimeout(() => setStatus('Imagery source unreachable. Verify network path or credentials.'), 2000);
  }, []);

  useEffect(() => {
    verify();
    const t = setTimeout(() => setStatus('Demo mode — public STAC offline in this environment.'), 1500);
    return () => clearTimeout(t);
  }, [verify]);

  // Listen for comparison stack changes to open modal
  useEffect(() => {
    if (comparisonStack.left && comparisonStack.right) {
      setIsAnalysisOpen(true);
    }
  }, [comparisonStack]);

  const buildDate = useMemo(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${yyyy}${mm}${dd}-${hh}${min}-ver0`;
  }, []);

  return (
    <div className="flex h-screen w-screen flex-col">
      <header className="flex items-center justify-between border-b border-white/10 bg-black/40 px-4 py-2">
        <div className="text-white/90">imagery_form_crafter</div>
        <div className="text-sm text-white/70">{activeSource ? activeSource.name : status}</div>
        <SourceManager />
      </header>

      <div className="flex flex-1">
        <div className="flex flex-1">
          <main className="flex-1">
            <MapCanvas />
          </main>
          <aside>
            <FormPanel />
          </aside>
        </div>
      </div>

      <footer className="flex items-center justify-between border-t border-white/10 bg-black/40 px-4 py-2 text-xs text-white/60">
        <div className="text-sm text-white/70">Timeline Scrubber — <span className="text-white/40">Select imagery date</span></div>
        <div>{buildDate}</div>
      </footer>

      {/* Analysis Modal Portal */}
      <AnalysisModal isOpen={isAnalysisOpen} onClose={() => setIsAnalysisOpen(false)} />
    </div>
  );
}