import React from 'react';
import { soundEngine } from '../utils/audio';

interface CowrieDiceProps {
  value: number; 
  rolling: boolean;
  onRoll: () => void;
  disabled: boolean;
  canRoll: boolean;
  layout?: 'vertical' | 'horizontal'; 
  maxShells?: number;
  hideButton?: boolean;
}

// Photorealistic 3D Cowrie Shell (Ivory White Open Face vs Warm Amber Shell Back)
const CowrieShell: React.FC<{ isOpen: boolean; index: number; compact?: boolean }> = ({ isOpen, index, compact }) => {
  const rotation = React.useMemo(() => (index * 45 + 15) % 360, [index]);
  const width = compact ? 34 : 64;
  const height = compact ? 48 : 88;

  return (
    <div className="flex flex-col items-center gap-1.5 shrink-0 transition-transform duration-300 hover:scale-110">
      <div 
        className={`relative flex items-center justify-center rounded-full p-1 transition-all duration-500
          ${isOpen 
            ? 'ring-3 ring-amber-300 shadow-[0_0_20px_rgba(255,255,255,0.9)] bg-white/20' 
            : 'ring-2 ring-amber-900/80 shadow-[0_6px_12px_rgba(0,0,0,0.9)] bg-black/50'}
        `}
        style={{ 
          width: `${width}px`, 
          height: `${height}px`,
          transform: `rotate(${rotation}deg)`
        }}
      >
        <svg 
          viewBox="0 0 100 135" 
          style={{ width: '100%', height: '100%', display: 'block', filter: 'drop-shadow(0px 8px 12px rgba(0,0,0,0.85))' }}
        >
          <defs>
            {/* OPEN FACE: Polished Ivory White & Cream */}
            <linearGradient id={`open-ivory-grad-v5-${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
               <stop offset="0%" stopColor="#ffffff" />
               <stop offset="45%" stopColor="#fffbeb" />
               <stop offset="85%" stopColor="#f1f5f9" />
               <stop offset="100%" stopColor="#cbd5e1" />
            </linearGradient>

            {/* CLOSED BACK: Glossy Golden Mahogany Amber */}
            <radialGradient id={`closed-amber-grad-v5-${index}`} cx="40%" cy="30%" r="80%">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="25%" stopColor="#f59e0b" />
                <stop offset="65%" stopColor="#b45309" />
                <stop offset="90%" stopColor="#78350f" />
                <stop offset="100%" stopColor="#451a03" />
            </radialGradient>
          </defs>

          {isOpen ? (
            /* FACE UP / OPEN SHELL (IVORY SLIT & TEETH) */
            <g>
              <ellipse cx="50" cy="67.5" rx="45" ry="60" fill={`url(#open-ivory-grad-v5-${index})`} stroke="#94a3b8" strokeWidth="2.5" />
              <ellipse cx="50" cy="67.5" rx="36" ry="50" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
              <path d="M50 14 Q 58 67.5 50 121" stroke="#0f172a" strokeWidth="5" fill="none" strokeLinecap="round" />
              {[26, 36, 46, 56, 66, 76, 86, 96, 106].map(y => (
                 <path key={y} d={`M35 ${y} L 65 ${y}`} stroke="#334155" strokeWidth="3" strokeLinecap="round" />
              ))}
              <path d="M50 20 Q 53 67.5 50 115" stroke="#020617" strokeWidth="2" fill="none" />
              <ellipse cx="32" cy="35" rx="8" ry="18" fill="#ffffff" fillOpacity="0.7" transform="rotate(-15 32 35)" />
            </g>
          ) : (
            /* FACE DOWN / CLOSED SHELL (GLOSSY AMBER DOME) */
            <g>
               <ellipse cx="50" cy="67.5" rx="45" ry="60" fill={`url(#closed-amber-grad-v5-${index})`} stroke="#fbbf24" strokeWidth="2.5" />
               <path d="M50 10 Q 88 67.5 50 125" stroke="rgba(255,255,255,0.7)" strokeWidth="3.5" fill="none" />
               <path d="M50 10 Q 12 67.5 50 125" stroke="rgba(0,0,0,0.5)" strokeWidth="3" fill="none" />
               <ellipse cx="32" cy="35" rx="14" ry="24" fill="#ffffff" fillOpacity="0.65" transform="rotate(-25 32 35)" />
            </g>
          )}
        </svg>
      </div>

      {!compact && (
        <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-md ${isOpen ? 'bg-white text-slate-900 border border-amber-400' : 'bg-[#451a03] text-amber-200 border border-amber-600'}`}>
          {isOpen ? '⚪ Open' : '🟤 Back'}
        </span>
      )}
    </div>
  );
};

export const CowrieDice: React.FC<CowrieDiceProps> = ({ 
  value, 
  rolling, 
  onRoll, 
  disabled, 
  canRoll, 
  layout = 'vertical', 
  maxShells = 4
}) => {
  const openCount = React.useMemo(() => {
     if (maxShells === 4) {
         if (value === 8) return 0; // Ashta (8) -> 0 open (all 4 closed back)
         return value;
     } else {
         if (value === 12) return 0; // Baara (12) -> 0 open (all 6 closed back)
         return value;
     }
  }, [value, maxShells]);

  const shells = React.useMemo(() => {
    const arr = Array(maxShells).fill(false);
    for (let i = 0; i < openCount; i++) arr[i] = true;
    return arr;
  }, [openCount, maxShells]);

  const getLabel = () => {
    if (rolling) return 'Fates Turning...';
    if (value === 0) return 'Tap / Swipe Shells';

    if (maxShells === 4) {
        if (value === 4) return '✨ CHOWKA (4) + BONUS ROLL!';
        if (value === 8) return '🌟 ASHTA (8) + BONUS ROLL!';
    } else {
        if (value === 6) return '✨ KATTA (6) + BONUS ROLL!';
        if (value === 12) return '🌟 BAARA (12) + BONUS ROLL!';
    }
    return `Score: ${value}`;
  };

  const touchStartRef = React.useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled || !canRoll) return;
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (disabled || !canRoll || !touchStartRef.current) return;
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    if (distance >= 5 || distance >= 0) {
      soundEngine.playShellRoll();
      onRoll();
    }
    touchStartRef.current = null;
  };

  const handleTrayClick = () => {
    if (disabled || !canRoll) return;
    soundEngine.playShellRoll();
    onRoll();
  };

  if (layout === 'horizontal') {
    return (
      <div className="flex items-center justify-center gap-3 w-full h-full">
         {/* Velvet Cowrie Shells Tray (Primary Interactive Roll Mechanism) */}
         <div 
           onTouchStart={handleTouchStart}
           onTouchEnd={handleTouchEnd}
           onClick={handleTrayClick}
           className={`relative flex-shrink-0 p-2 sm:p-2.5 rounded-2xl bg-[#2a1b15] border-2 shadow-[inset_0_2px_12px_rgba(0,0,0,0.9)] h-16 sm:h-20 w-auto min-w-[160px] sm:min-w-[200px] flex items-center justify-center overflow-hidden transition-all duration-300
             ${!disabled && canRoll 
               ? 'cursor-pointer border-amber-400 ring-2 ring-amber-400/80 shadow-[0_0_20px_rgba(245,158,11,0.6)] animate-pulse scale-105 active:scale-95' 
               : 'border-[#5d4037] opacity-80 cursor-not-allowed'}
           `}
           title="Tap or Swipe Shells to Roll"
         >
            <div className="absolute inset-1 bg-gradient-to-br from-[#064e3b] via-[#043e2f] to-[#022c22] opacity-90 rounded-xl shadow-inner border border-emerald-400/40 pointer-events-none"></div>
            
            <div className={`relative z-10 flex items-center justify-center gap-2 pointer-events-none ${rolling ? 'animate-bounce blur-[0.5px]' : ''}`}>
                {shells.map((isOpen, idx) => (
                  <CowrieShell key={idx} index={idx} isOpen={isOpen} compact={true} />
                ))}
            </div>

            {!disabled && canRoll && (
              <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 text-[9px] font-extrabold text-amber-300 uppercase tracking-wider pointer-events-none whitespace-nowrap bg-black/80 px-2 py-0.2 rounded border border-amber-400/60 shadow animate-pulse">
                TAP / SWIPE 🐚
              </div>
            )}
         </div>

         {/* Score / Roll Label */}
         <div className="flex flex-col justify-center gap-0.5">
             <div className="text-[10px] sm:text-xs font-bold text-amber-300 uppercase tracking-widest text-center drop-shadow whitespace-nowrap">
               {getLabel()}
             </div>
         </div>
      </div>
    );
  }

  // Vertical Desktop Layout
  return (
    <div className="flex flex-col items-center gap-5 w-full">
      <div 
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={handleTrayClick}
        className={`relative p-6 md:p-8 rounded-[2.5rem] bg-[#2a1b15] border-4 shadow-[0_25px_50px_rgba(0,0,0,0.9)] w-full max-w-[340px] min-h-[230px] flex flex-col items-center justify-center overflow-hidden transition-all duration-300
          ${!disabled && canRoll 
            ? 'cursor-pointer border-amber-400 ring-4 ring-amber-400/80 shadow-[0_0_30px_rgba(245,158,11,0.7)] animate-pulse scale-105 active:scale-95' 
            : 'border-[#5d4037] opacity-80 cursor-not-allowed'}
        `}
      >
         <div className="absolute inset-2 bg-gradient-to-br from-[#064e3b] via-[#043e2f] to-[#022c22] rounded-[2rem] border-2 border-emerald-400/40 shadow-[inset_0_0_35px_rgba(0,0,0,0.95)] pointer-events-none"></div>
         
         <div className={`relative z-10 flex flex-wrap justify-center items-center gap-4 ${rolling ? 'animate-bounce blur-[0.5px]' : ''}`}>
             {shells.map((isOpen, idx) => (
               <CowrieShell key={idx} index={idx} isOpen={isOpen} />
             ))}
         </div>

         {!disabled && canRoll && (
           <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs font-extrabold text-amber-300 uppercase tracking-widest pointer-events-none whitespace-nowrap bg-black/80 px-3 py-1 rounded-full border border-amber-400 shadow animate-pulse">
             TAP OR SWIPE TO ROLL 🐚
           </div>
         )}
      </div>

      <div className="text-center font-display">
        <h3 className="text-lg font-bold text-amber-300 uppercase tracking-widest drop-shadow">
          {getLabel()}
        </h3>
      </div>
    </div>
  );
};