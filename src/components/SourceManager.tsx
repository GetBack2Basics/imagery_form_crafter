import { useState } from 'react';
import { useSourceStore } from '../store/useSourceStore';
import type { DataSource } from '../store/types';

export default function SourceManager() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [type, setType] = useState<'STAC' | 'WMTS'>('STAC');
  const [status, setStatus] = useState<'idle' | 'connected' | 'unreachable' | 'testing'>('idle');
  const [pendingId, setPendingId] = useState<string | null>(null);

  const sources = useSourceStore((s) => s.sources);
  const activeSource = useSourceStore((s) => s.activeSource);
  const addSource = useSourceStore((s) => s.addSource);
  const removeSource = useSourceStore((s) => s.removeSource);
  const setActiveSource = useSourceStore((s) => s.setActiveSource);

  const test = async (target: DataSource) => {
    setPendingId(target.id);
    setStatus('testing');
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      await fetch(target.url, { method: 'GET', mode: 'cors', signal: controller.signal });
      clearTimeout(timeout);
      setStatus('connected');
    } catch {
      setStatus('unreachable');
    } finally {
      setPendingId(null);
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !url.trim()) return;
    const next = { name: name.trim(), url: url.trim(), type, isActive: !activeSource } as Omit<DataSource, 'id'>;
    addSource(next);
    setName('');
    setUrl('');
    setType('STAC');
    setStatus('idle');
  };

  const display =
    status === 'connected'
      ? 'Connected'
      : status === 'unreachable'
        ? 'Unreachable'
        : status === 'testing'
          ? 'Testing connection…'
          : null;
  const displayClass =
    status === 'connected'
      ? 'text-green-300'
      : status === 'unreachable'
        ? 'text-red-300'
        : 'text-white/70';

  return (
    <div className="fixed left-4 top-16 z-50">
      <button
        onClick={() => setOpen((v) => !v)}
        className="rounded-md border border-white/20 bg-white/10 px-3 py-1.5 text-sm text-white/80 backdrop-blur-md hover:bg-white/20"
      >
        Layers
      </button>
      {open && (
        <div className="mt-2 w-96 rounded-md border border-white/10 bg-black/60 p-4 text-white/90 backdrop-blur-md">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-medium">Source Manager</h2>
            <button onClick={() => setOpen(false)} className="text-xs text-white/60 hover:text-white/90">
              Close
            </button>
          </div>

          <form onSubmit={submit} className="mb-4 space-y-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Friendly Name"
              className="w-full rounded border border-white/20 bg-black/40 px-2 py-1.5 text-sm text-white/90 outline-none"
            />
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Endpoint URL"
              className="w-full rounded border border-white/20 bg-black/40 px-2 py-1.5 text-sm text-white/90 outline-none"
            />
            <select
              value={type}
              onChange={(e) => setType(e.target.value as 'STAC' | 'WMTS')}
              className="w-full rounded border border-white/20 bg-black/40 px-2 py-1.5 text-sm text-white/90 outline-none"
            >
              <option value="STAC">STAC</option>
              <option value="WMTS">WMTS</option>
            </select>
            <button
              type="submit"
              className="w-full rounded-md border border-white/20 px-3 py-1.5 text-sm text-white/80 hover:bg-white/10"
            >
              Add Source
            </button>
            <p className="text-xs text-white/60">Ensure internal endpoints are reachable via the Nginx proxy.</p>
          </form>

          <div className="space-y-2">
            {sources.length === 0 && <div className="text-xs text-white/60">No sources configured. Add an imagery endpoint to begin.</div>}
            {sources.map((s) => {
              const isActive = activeSource?.id === s.id;
              return (
                <div key={s.id} className={`flex items-center justify-between rounded border border-white/10 px-2 py-1.5 ${isActive ? 'bg-green-500/20 border-green-500/30' : 'bg-white/5'}`}>
                  <div className="mr-2 min-w-0 flex-1">
                    <div className="truncate text-xs text-white/90 flex items-center gap-1">
                      {s.name}
                      {isActive && <span className="text-[10px] text-green-400">● Active</span>}
                    </div>
                    <div className="truncate text-[10px] text-white/60">{s.url}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => test(s)} className="text-[10px] text-white/70 hover:text-white/90">
                      Validate Connection
                    </button>
                    {isActive ? (
                      <span className="text-[10px] text-green-400">Active</span>
                    ) : (
                      <button onClick={() => setActiveSource(s.id)} className="text-[10px] text-white/70 hover:text-white/90">
                        Use
                      </button>
                    )}
                    <button onClick={() => removeSource(s.id)} className="text-[10px] text-red-300 hover:text-red-200">
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
            {pendingId && status === 'testing' && <div className="text-[10px] text-white/70">Testing connection…</div>}
            {display && <div className={`text-[10px] ${displayClass}`}>{display}</div>}
          </div>
        </div>
      )}
    </div>
  );
}
