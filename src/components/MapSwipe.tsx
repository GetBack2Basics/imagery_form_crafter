import { useEffect, useRef } from 'react';

export default function MapSwipe() {
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!wrapperRef.current) return;
    // Future: instantiate map + Compare layout here
    return () => {
      // cleanup
    };
  }, []);

  return (
    <div ref={wrapperRef} className="h-full w-full">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="rounded border border-white/20 bg-black/30 px-3 py-1 text-xs text-white/80">
          Swipe container — next step
        </div>
      </div>
    </div>
  );
}
