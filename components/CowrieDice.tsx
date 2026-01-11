import React from 'react';

interface CowrieDiceProps {
  value: number; 
  rolling: boolean;
  onRoll: () => void;
  disabled: boolean;
  canRoll: boolean;
  layout?: 'vertical' | 'horizontal'; 
  maxShells?: number; // Added to support 4 or 6 shells
}

// Realistic Shell SVG
const CowrieShell: React.FC<{ isOpen: boolean; index: number; compact?: boolean }> = ({ isOpen, index, compact }) => {
  const rotation = React.useMemo(() => Math.random() * 360, []); 
  
  return (
    <div 
      className={`relative transition-all duration-500 transform drop-shadow-lg
        ${compact ? 'w-5 h-7' : 'w-10 h-14'}
      `}
      style={{ transform: `rotate(${rotation}deg)` }}
    >
        <svg viewBox="0 0 100 130" className="w-full h-full">
            <defs>
              <filter id="shadow">
                <feDropShadow dx="2" dy="4" stdDeviation="3" floodOpacity="0.5"/>
              </filter>
              <linearGradient id="shellBody" x1="0%" y1="0%" x2="100%" y2="100%">
                 <stop offset="0%" stopColor="#fef3c7" />
                 <stop offset="100%" stopColor="#d4d4d4" />
              </linearGradient>
              <radialGradient id="shellBack" cx="40%" cy="40%" r="80%">
                  <stop offset="0%" stopColor="#d97706" />
                  <stop offset="100%" stopColor="#451a03" />
              </radialGradient>
            </defs>
            {isOpen ? (
                <g filter="url(#shadow)">
                    {/* Open Face */}
                    <ellipse cx="50" cy="65" rx="45" ry="60" fill="url(#shellBody)" stroke="#a3a3a3" strokeWidth="1" />
                    {/* The Slit */}
                    <path d="M50 15 Q 55 65 50 115" stroke="#a3a3a3" strokeWidth="2" fill="none" />
                    {/* Teeth detail */}
                    {[25,35,45,55,65,75,85,95].map(y => (
                       <path key={y} d={`M42 ${y} L 58 ${y}`} stroke="#737373" strokeWidth="2" strokeLinecap="round" />
                    ))}
                </g>
            ) : (
                <g filter="url(#shadow)">
                   {/* Closed Back */}
                   <ellipse cx="50" cy="65" rx="45" ry="60" fill="url(#shellBack)" />
                   <path d="M50 10 Q 90 65 50 120" stroke="rgba(255,255,255,0.1)" strokeWidth="2" fill="none" />
                   {/* Specular Highlight */}
                   <ellipse cx="35" cy="40" rx="10" ry="18" fill="white" fillOpacity="0.15" transform="rotate(-20 35 40)" />
                </g>
            )}
        </svg>
    </div>
  );
};

export const CowrieDice: React.FC<CowrieDiceProps> = ({ value, rolling, onRoll, disabled, canRoll, layout = 'vertical', maxShells = 4 }) => {
  // Determine how many shells are "open" based on the roll value
  const openCount = React.useMemo(() => {
     if (maxShells === 4) {
         if (value === 8) return 0; // Ashta (8) -> 0 open
         return value;
     } else {
         if (value === 12) return 0; // Baara (12) -> 0 open
         return value; // For 6, 6 are open.
     }
  }, [value, maxShells]);

  const shells = React.useMemo(() => {
    const arr = Array(maxShells).fill(false);
    for(let i=0; i<openCount; i++) arr[i] = true;
    return arr;
  }, [openCount, maxShells]);

  // Button Styles
  const buttonBaseClass = `
    relative overflow-hidden font-display font-bold tracking-widest text-white shadow-lg transition-all duration-200
    border-2 border-[#b45309] rounded-xl
  `;
  const buttonStateClass = disabled || !canRoll
    ? 'bg-gray-800 text-gray-500 cursor-not-allowed grayscale'
    : 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 active:scale-95 animate-pulse-gold';

  const getLabel = () => {
    if (rolling) return 'Flipping...';
    if (value === 0) return 'Your Turn';

    if (maxShells === 4) {
        if (value === 4) return '✨ Chowka (4)';
        if (value === 8) return '🌟 Ashta (8)';
    } else {
        if (value === 6) return '✨ Katta (6)';
        if (value === 12) return '🌟 Baara (12)';
    }
    return `Score: ${value}`;
  };

  if (layout === 'horizontal') {
    return (
      <div className="flex items-center gap-2 w-full h-full">
         {/* Wooden Box */}
         <div className="relative flex-shrink-0 p-1.5 rounded-xl bg-[#2a1b15] border-2 border-[#5d4037] shadow-[inset_0_2px_10px_rgba(0,0,0,0.8)] h-16 w-auto min-w-[120px] flex items-center justify-center overflow-hidden">
            {/* Velvet Lining */}
            <div className="absolute inset-0 bg-[#450a0a] opacity-40"></div>
            <div className={`relative z-10 flex flex-wrap justify-center gap-1 ${rolling ? 'animate-bounce blur-[1px]' : ''}`} style={{ maxWidth: '140px'}}>
                {shells.map((isOpen, idx) => (
                  <CowrieShell key={idx} index={idx} isOpen={isOpen} compact={true} />
                ))}
            </div>
         </div>

         {/* Controls */}
         <div className="flex-1 flex flex-col justify-center h-full gap-1">
             <div className="text-[10px] font-bold text-amber-200 uppercase tracking-widest text-center drop-shadow-md whitespace-nowrap">
               {getLabel()}
             </div>
             <button
              onClick={onRoll}
              disabled={disabled || !canRoll}
              className={`${buttonBaseClass} ${buttonStateClass} w-full py-2 text-xs`}
            >
              ROLL
              {/* Shine effect */}
              {!disabled && canRoll && <div className="absolute top-0 -left-[100%] w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_2s_infinite]"></div>}
            </button>
         </div>
      </div>
    )
  }

  // Desktop Vertical Layout
  return (
    <div className="flex flex-col items-center gap-6 w-full">
      {/* Premium Wooden Tray */}
      <div className="relative p-6 rounded-[2rem] bg-[#2a1b15] border-4 border-[#5d4037] shadow-2xl w-full max-w-[280px] min-h-[200px] flex items-center justify-center overflow-hidden">
         {/* Inner Shadow & Velvet */}
         <div className="absolute inset-0 bg-[#3f0e0e] opacity-30 shadow-[inset_0_0_40px_rgba(0,0,0,0.9)]"></div>
         
         <div className={`relative z-10 grid grid-cols-2 gap-4 ${rolling ? 'animate-bounce blur-[1px]' : ''} transition-all`}>
            {shells.map((isOpen, idx) => (
               <CowrieShell key={idx} index={idx} isOpen={isOpen} />
            ))}
        </div>
      </div>
      
      <div className="text-center w-full space-y-4">
        <div className="text-xl font-display font-bold text-amber-100 uppercase tracking-[0.2em] drop-shadow-md">
           {getLabel()}
        </div>
        
        <button
          onClick={onRoll}
          disabled={disabled || !canRoll}
          className={`${buttonBaseClass} ${buttonStateClass} w-full py-5 text-xl`}
        >
          ROLL DICE
        </button>
      </div>
    </div>
  );
};