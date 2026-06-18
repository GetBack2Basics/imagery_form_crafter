import { useCallback, useEffect, useRef, useState } from 'react';

interface SwipeSliderProps {
  position: number; // 0-100
  onPositionChange: (position: number) => void;
  enabled: boolean;
}

export default function SwipeSlider({ position, onPositionChange, enabled }: SwipeSliderProps) {
  const sliderRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const updatePosition = useCallback(
    (clientX: number) => {
      if (!sliderRef.current) return;
      const rect = sliderRef.current.getBoundingClientRect();
      const newPosition = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
      onPositionChange(newPosition);
    },
    [onPositionChange],
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!enabled) return;
      e.preventDefault();
      setIsDragging(true);
      updatePosition(e.clientX);
    },
    [enabled, updatePosition],
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!enabled) return;
      e.preventDefault();
      setIsDragging(true);
      updatePosition(e.touches[0].clientX);
    },
    [enabled, updatePosition],
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) updatePosition(e.clientX);
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (isDragging) updatePosition(e.touches[0].clientX);
    };
    const handleMouseUp = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchend', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, updatePosition]);

  if (!enabled) return null;

  return (
    <div
      ref={sliderRef}
      className="absolute inset-0 pointer-events-none z-20"
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      style={{ touchAction: 'none' }}
    >
      {/* Left side indicator */}
      <div
        className="absolute left-0 top-0 h-full w-1/2 flex items-center justify-center pointer-events-none"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
      >
        <div className="ml-2 text-xs font-medium text-white/90 bg-black/60 px-2 py-1 rounded backdrop-blur">
          Base (Left)
        </div>
      </div>

      {/* Right side indicator */}
      <div
        className="absolute right-0 top-0 h-full w-1/2 flex items-center justify-center pointer-events-none"
        style={{ clipPath: `inset(0 0 0 ${position}%)` }}
      >
        <div className="mr-2 text-xs font-medium text-white/90 bg-black/60 px-2 py-1 rounded backdrop-blur">
          Overlay (Right)
        </div>
      </div>

      {/* Vertical divider line */}
      <div
        ref={handleRef}
        className="absolute top-0 bottom-0 w-px pointer-events-auto"
        style={{
          left: `${position}%`,
          transform: 'translateX(-50%)',
          background:
            'linear-gradient(180deg, transparent 20%, rgba(255,255,255,0.9) 20%, rgba(255,255,255,0.9) 80%, transparent 80%)',
          boxShadow: '0 0 8px rgba(255,255,255,0.6), 0 0 16px rgba(255,255,255,0.3)',
          cursor: 'ew-resize',
        }}
      >
        {/* Drag handle */}
        <div
          className="absolute left-1/2 top-4 -translate-x-1/2 w-2 h-2 pointer-events-auto"
          style={{
            background: 'rgba(255,255,255,0.95)',
            borderRadius: '50%',
            boxShadow: '0 0 6px rgba(255,255,255,0.8), 0 2px 8px rgba(0,0,0,0.3)',
            border: '2px solid rgba(0,0,0,0.2)',
          }}
        />
        <div
          className="absolute left-1/2 bottom-4 -translate-x-1/2 w-2 h-2 pointer-events-auto"
          style={{
            background: 'rgba(255,255,255,0.95)',
            borderRadius: '50%',
            boxShadow: '0 0 6px rgba(255,255,255,0.8), 0 2px 8px rgba(0,0,0,0.3)',
            border: '2px solid rgba(0,0,0,0.2)',
          }}
        />
      </div>
    </div>
  );
}