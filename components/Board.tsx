import React from 'react';
import { GameState, PieceStatus, PlayerId, BoardTheme } from '../types';
import { getPaths } from '../constants';
import { getMovementPreview, isSafeSquare, canMovePiece } from '../utils/gameLogic';

interface BoardProps {
  gameState: GameState;
  onPieceClick: (playerIndex: number, pieceIndex: number) => void;
}

export const THEME_STYLES = {
  [BoardTheme.MAHOGANY]: {
    name: 'Mahogany Wood',
    appBg: 'bg-[#120a08]',
    frameBg: 'bg-[#3e2723]',
    frameBorder: 'border-[#b45309]',
    gridBg: 'bg-[#2a1b15]',
    cellIvory: 'bg-[#eaddcf]',
    cellCheck: 'bg-[#f5ebe0]',
    safeCell: 'bg-[#d7ccc8]',
    trimBorder: 'border-[#b45309]',
    badgeBg: 'bg-[#451a03] text-amber-200'
  },
  [BoardTheme.EMERALD]: {
    name: 'Emerald Palace',
    appBg: 'bg-[#021f17]',
    frameBg: 'bg-[#064e3b]',
    frameBorder: 'border-[#10b981]',
    gridBg: 'bg-[#022c22]',
    cellIvory: 'bg-[#d1fae5]',
    cellCheck: 'bg-[#ecfdf5]',
    safeCell: 'bg-[#a7f3d0]',
    trimBorder: 'border-[#34d399]',
    badgeBg: 'bg-[#064e3b] text-emerald-200'
  },
  [BoardTheme.MARBLE]: {
    name: 'Imperial Marble',
    appBg: 'bg-[#0f172a]',
    frameBg: 'bg-[#334155]',
    frameBorder: 'border-[#94a3b8]',
    gridBg: 'bg-[#0f172a]',
    cellIvory: 'bg-[#ffffff]',
    cellCheck: 'bg-[#f1f5f9]',
    safeCell: 'bg-[#cbd5e1]',
    trimBorder: 'border-[#cbd5e1]',
    badgeBg: 'bg-[#334155] text-slate-100'
  },
  [BoardTheme.SAPPHIRE]: {
    name: 'Sapphire Court',
    appBg: 'bg-[#0b132b]',
    frameBg: 'bg-[#1e3a8a]',
    frameBorder: 'border-[#3b82f6]',
    gridBg: 'bg-[#172554]',
    cellIvory: 'bg-[#dbeafe]',
    cellCheck: 'bg-[#eff6ff]',
    safeCell: 'bg-[#bfdbfe]',
    trimBorder: 'border-[#60a5fa]',
    badgeBg: 'bg-[#1e3a8a] text-blue-200'
  }
};

// --- ELEGANT 3D LUDO PAWN TOKEN ---
const PawnIcon = ({ playerIdx }: { playerIdx: number }) => {
  const colors = [
    { main: '#ef4444', light: '#fee2e2', dark: '#991b1b', gold: '#fbbf24' }, // Red (P1)
    { main: '#10b981', light: '#d1fae5', dark: '#047857', gold: '#fbbf24' }, // Green (P2)
    { main: '#f59e0b', light: '#fef3c7', dark: '#b45309', gold: '#fef08a' }, // Yellow (P3)
    { main: '#3b82f6', light: '#dbeafe', dark: '#1d4ed8', gold: '#fbbf24' }, // Blue (P4)
  ];
  
  const c = colors[playerIdx];

  return (
    <svg viewBox="0 0 100 110" className="w-full h-full drop-shadow-[0_3px_5px_rgba(0,0,0,0.7)]">
       <defs>
         <radialGradient id={`grad-pawn-clean-${playerIdx}`} cx="35%" cy="30%" r="80%">
           <stop offset="0%" stopColor={c.light} />
           <stop offset="50%" stopColor={c.main} />
           <stop offset="100%" stopColor={c.dark} />
         </radialGradient>
         <linearGradient id={`gold-band-clean-${playerIdx}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#b45309" />
            <stop offset="50%" stopColor={c.gold} />
            <stop offset="100%" stopColor="#b45309" />
         </linearGradient>
       </defs>
       
       <ellipse cx="50" cy="98" rx="34" ry="9" fill="black" fillOpacity="0.4" />
       
       <path d="M50 8 C 32 8, 26 32, 40 44 C 22 75, 14 82, 14 94 L 86 94 C 86 82, 78 75, 60 44 C 74 32, 68 8, 50 8 Z" 
             fill={`url(#grad-pawn-clean-${playerIdx})`} 
             stroke={c.dark} 
             strokeWidth="1.5"
        />
       
       <path d="M36 42 Q 50 48 64 42" stroke={`url(#gold-band-clean-${playerIdx})`} strokeWidth="4" fill="none" strokeLinecap="round" />
       <path d="M18 92 Q 50 100 82 92" stroke={`url(#gold-band-clean-${playerIdx})`} strokeWidth="3" fill="none" strokeLinecap="round" />
       <ellipse cx="36" cy="22" rx="6" ry="10" fill="white" fillOpacity="0.6" transform="rotate(-20 36 22)" />
    </svg>
  );
};

// MINIMAL YET CLEAR SAFE TILE STAR (Clean Bronze & Amber Outline)
const SafeIcon = () => (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-85 z-0">
        <svg viewBox="0 0 100 100" className="w-[78%] h-[78%]">
             {/* Subtle 5-Point Star */}
             <path 
               d="M50 5 L64 34 L96 37 L72 58 L79 90 L50 73 L21 90 L28 58 L4 37 L36 34 Z" 
               fill="#b45309"
               fillOpacity="0.18"
               stroke="#78350f" 
               strokeWidth="3.5"
               strokeLinejoin="round"
             />
             <circle cx="50" cy="50" r="10" fill="#78350f" fillOpacity="0.3" />
        </svg>
    </div>
);

// ELEGANT MINIMAL LOTUS GOAL (Clean Geometry, No Flashy Over-exposure)
const CenterIcon = () => (
    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-0">
        <svg viewBox="0 0 100 100" className="w-[82%] h-[82%] drop-shadow-sm">
            <defs>
                <radialGradient id="minimalCenterGrad" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#fef08a" />
                    <stop offset="60%" stopColor="#d97706" />
                    <stop offset="100%" stopColor="#78350f" />
                </radialGradient>
            </defs>

            {/* Subtle Mandala Ring */}
            <circle cx="50" cy="50" r="44" fill="none" stroke="#b45309" strokeWidth="2" strokeDasharray="3 2" opacity="0.6" />

            {/* 8 Geometric Lotus Petals */}
            {[0, 45, 90, 135, 180, 225, 270, 315].map(deg => (
                <path 
                  key={deg} 
                  d="M50 50 Q 60 20 50 8 Q 40 20 50 50" 
                  fill="#f59e0b"
                  fillOpacity="0.4"
                  stroke="#78350f" 
                  strokeWidth="1.5" 
                  transform={`rotate(${deg} 50 50)`} 
                />
            ))}

            {/* Center Core */}
            <circle cx="50" cy="50" r="14" fill="url(#minimalCenterGrad)" stroke="#451a03" strokeWidth="2" />
        </svg>
    </div>
);

const getStartPlayerForTile = (r: number, c: number, boardSize: number): PlayerId | null => {
  if (boardSize === 5) {
    if (r === 4 && c === 2) return PlayerId.P1;
    if (r === 2 && c === 4) return PlayerId.P2;
    if (r === 0 && c === 2) return PlayerId.P3;
    if (r === 2 && c === 0) return PlayerId.P4;
  } else {
    if (r === 6 && c === 3) return PlayerId.P1;
    if (r === 3 && c === 6) return PlayerId.P2;
    if (r === 0 && c === 3) return PlayerId.P3;
    if (r === 3 && c === 0) return PlayerId.P4;
  }
  return null;
};

// --- DEDICATED FRAME HOME WELL ---
const FrameHomeWell = ({ 
  playerIdx, 
  gameState, 
  onPieceClick 
}: { 
  playerIdx: PlayerId;
  gameState: GameState;
  onPieceClick: any;
}) => {
  const player = gameState.players[playerIdx];
  if (!player || !player.pieces || player.pieces.length === 0) return null;

  const homePieces = player.pieces.filter(p => p.status === PieceStatus.HOME);
  const isCurrentPlayerTurn = gameState.currentPlayerId === playerIdx;
  
  const themes = [
    { bg: 'bg-[#450a0a]', border: 'border-red-500', ring: 'ring-red-400', badge: 'bg-red-950 text-red-200' },
    { bg: 'bg-[#064e3b]', border: 'border-emerald-500', ring: 'ring-emerald-400', badge: 'bg-emerald-950 text-emerald-200' },
    { bg: 'bg-[#451a03]', border: 'border-amber-500', ring: 'ring-amber-400', badge: 'bg-amber-950 text-amber-200' },
    { bg: 'bg-[#172554]', border: 'border-blue-500', ring: 'ring-blue-400', badge: 'bg-blue-950 text-blue-200' }
  ];

  const theme = themes[playerIdx];

  return (
    <div className={`
        ${theme.bg} ${theme.border}
        border-2 rounded-xl px-2 py-1 shadow-xl flex items-center gap-2
        transition-all duration-300 relative z-30 shrink-0
        ${isCurrentPlayerTurn ? `scale-105 ring-2 ${theme.ring} brightness-110 shadow-[0_0_15px_rgba(245,158,11,0.6)]` : 'opacity-85'}
    `}>
       {/* Player Badge */}
       <div className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${theme.badge} border border-white/20 uppercase tracking-wider whitespace-nowrap shadow flex items-center gap-1`}>
           <span>{player.name} HOME</span>
           {isCurrentPlayerTurn && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>}
       </div>

       {/* 4 Sockets */}
       <div className="flex items-center gap-2">
          {Array.from({ length: 4 }).map((_, slotIdx) => {
             const piece = homePieces[slotIdx];
             const isMovable = piece && isCurrentPlayerTurn && gameState.diceValues.some(val => canMovePiece(gameState, piece, val));

             return (
               <div 
                 key={slotIdx} 
                 className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/70 border-2 border-white/20 flex items-center justify-center relative shadow-inner shrink-0"
               >
                 {piece ? (
                   <button
                     onClick={(e) => {
                       e.stopPropagation();
                       onPieceClick(piece.owner, piece.id);
                     }}
                     className={`w-full h-full transition-all duration-300 flex items-center justify-center p-0.5 z-40
                       ${isMovable ? 'animate-bounce cursor-pointer scale-125 brightness-125 drop-shadow-[0_0_12px_rgba(255,215,0,1)] z-50' : 'hover:scale-110'}
                     `}
                   >
                     <PawnIcon playerIdx={playerIdx} />
                   </button>
                 ) : (
                   <div className="w-2.5 h-2.5 rounded-full bg-white/10"></div>
                 )}
               </div>
             );
          })}
       </div>
    </div>
  );
};

// --- FLAWLESS MASTER BOARD WITH MINIMAL ELEGANT ICONS ---

export const Board: React.FC<BoardProps> = ({ gameState, onPieceClick }) => {
  const { boardSize, theme = BoardTheme.MAHOGANY } = gameState;
  const paths = getPaths(boardSize);
  const centerIndex = Math.floor(boardSize / 2);
  const themeStyle = THEME_STYLES[theme] || THEME_STYLES[BoardTheme.MAHOGANY];

  const currentPlayer = gameState.players[gameState.currentPlayerId];
  const activePreviews: { r: number; c: number; isSafe: boolean; isCapture: boolean; isFinish: boolean }[] = [];

  if (currentPlayer && !currentPlayer.isBot && gameState.diceValues.length > 0) {
    const diceToUse = (gameState.selectedDieIndex !== null && gameState.selectedDieIndex !== undefined && gameState.diceValues[gameState.selectedDieIndex] !== undefined)
      ? [gameState.diceValues[gameState.selectedDieIndex]]
      : gameState.diceValues;

    currentPlayer.pieces.forEach(p => {
      diceToUse.forEach(die => {
        const prev = getMovementPreview(gameState, p, die);
        if (prev && prev.targetCoords) {
          activePreviews.push({
            r: prev.targetCoords.r,
            c: prev.targetCoords.c,
            isSafe: prev.isSafe,
            isCapture: prev.isCapture,
            isFinish: prev.isFinish
          });
        }
      });
    });
  }

  const getCellContent = (r: number, c: number) => {
    return gameState.players.flatMap(player => 
      player.pieces
        .map((piece, idx) => ({ ...piece, pieceIndex: idx }))
        .filter(piece => {
          const path = paths[piece.owner];
          if (piece.status === PieceStatus.ACTIVE) {
            const pos = path[piece.pathIndex];
            return pos.r === r && pos.c === c;
          }
          return false;
        })
    );
  };

  const isCenter = (r: number, c: number) => r === centerIndex && c === centerIndex;
  const isSafe = (r: number, c: number) => isSafeSquare(r, c, boardSize);

  return (
    <div className="relative p-2 sm:p-4 w-full h-full flex flex-col items-center justify-center">
      
      {/* Outer Board Frame with Dynamic Theme */}
      <div className={`relative p-3 sm:p-5 ${themeStyle.frameBg} rounded-[2.2rem] shadow-[0_20px_50px_rgba(0,0,0,0.95)] border-4 ${themeStyle.frameBorder} flex flex-col items-center justify-between overflow-visible gap-2 transition-colors duration-500`}>
          
          {/* Subtle Grain Overlay */}
          <div className="absolute inset-0 opacity-30 pointer-events-none rounded-[2rem] overflow-hidden bg-gradient-to-br from-white/20 to-transparent"></div>
          
          {/* Filigree Trim */}
          <div className={`absolute inset-2 border-[2px] ${themeStyle.trimBorder} rounded-[1.8rem] opacity-70 pointer-events-none`}></div>

          {/* Top Home Well (P3 Yellow) */}
          <div className="relative z-30 w-full flex items-center justify-center pt-1">
             <FrameHomeWell playerIdx={PlayerId.P3} gameState={gameState} onPieceClick={onPieceClick} />
          </div>

          {/* Inner Grid Container */}
          <div 
            className={`relative z-20 grid gap-[1.5px] sm:gap-[2px] ${themeStyle.gridBg} border-[4px] border-[#4e342e] shadow-[inset_0_0_20px_rgba(0,0,0,0.95)] rounded-2xl overflow-visible transition-colors duration-500`}
            style={{ 
              width: 'min(86vw, 56vh)', 
              height: 'min(86vw, 56vh)',
              gridTemplateColumns: `repeat(${boardSize}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${boardSize}, minmax(0, 1fr))`
            }}
          >
            {Array.from({ length: boardSize * boardSize }).map((_, idx) => {
              const r = Math.floor(idx / boardSize);
              const c = idx % boardSize;
              
              const pieces = getCellContent(r, c);
              const isSafeSpot = isSafe(r, c);
              const isCenterSpot = isCenter(r, c);
              const startPlayer = getStartPlayerForTile(r, c, boardSize);
              
              const previewMatch = activePreviews.find(p => p.r === r && p.c === c);

              let bgClass = themeStyle.cellIvory;
              
              if (isCenterSpot) {
                 bgClass = themeStyle.gridBg;
              } else if (startPlayer === PlayerId.P1) {
                 bgClass = "bg-rose-900/30";
              } else if (startPlayer === PlayerId.P2) {
                 bgClass = "bg-emerald-900/30";
              } else if (startPlayer === PlayerId.P3) {
                 bgClass = "bg-amber-900/30";
              } else if (startPlayer === PlayerId.P4) {
                 bgClass = "bg-blue-900/30";
              } else if (isSafeSpot) {
                 bgClass = themeStyle.safeCell;
              } else if ((r + c) % 2 !== 0) {
                 bgClass = themeStyle.cellCheck;
              }

              const pieceCount = pieces.length;
              let gridClass = 'grid-cols-1 grid-rows-1 p-0.5';
              if (pieceCount > 1) gridClass = 'grid-cols-2 grid-rows-2 p-0.5 gap-0.5';

              return (
                <div key={idx} className={`relative flex items-center justify-center ${bgClass} shadow-inner overflow-visible z-10 transition-colors duration-500`}>
                  <div className="absolute inset-0 border-[1px] border-white/40 border-b-black/10 border-r-black/10 pointer-events-none"></div>
                  
                  {/* Subtle Corner Start Indicator */}
                  {startPlayer !== null && (
                    <div className="absolute top-0.5 left-0.5 text-[9px] font-bold opacity-75 z-20 pointer-events-none">
                      {startPlayer === PlayerId.P1 ? '🔴' : startPlayer === PlayerId.P2 ? '🟢' : startPlayer === PlayerId.P3 ? '🟡' : '🔵'}
                    </div>
                  )}

                  {/* Minimal & Elegant Icons */}
                  {isSafeSpot && !isCenterSpot && <SafeIcon />}
                  {isCenterSpot && <CenterIcon />}

                  {/* Movement Highlight */}
                  {previewMatch && (
                    <div className={`absolute inset-0 border-2 ${previewMatch.isCapture ? 'border-red-500 bg-red-500/25' : previewMatch.isFinish ? 'border-amber-400 bg-amber-400/35' : 'border-emerald-400 bg-emerald-400/25'} animate-pulse rounded z-0 flex items-center justify-center pointer-events-none`}>
                      <div className="text-[8px] font-bold px-1 rounded bg-black/80 text-amber-300 absolute top-0.5 right-0.5 z-20 pointer-events-none">
                        {previewMatch.isCapture ? '⚔️' : previewMatch.isFinish ? '👑' : '🎯'}
                      </div>
                    </div>
                  )}

                  {/* Active Pawns Container */}
                  <div className={`grid ${gridClass} w-full h-full items-center justify-items-center relative z-50 overflow-visible`}>
                    {pieces.map((p) => {
                      const isCurrentPlayer = gameState.currentPlayerId === p.owner;
                      const isMovable = isCurrentPlayer && gameState.diceValues.some(val => canMovePiece(gameState, p, val));
                      
                      return (
                        <button
                          key={`${p.owner}-${p.pieceIndex}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onPieceClick(p.owner, p.pieceIndex);
                          }}
                          className={`
                            relative transition-all duration-300 transform w-[140%] h-[140%] max-h-[70px] flex items-center justify-center p-0.5
                            ${isMovable ? 'animate-bounce z-50 cursor-pointer scale-125 brightness-125 drop-shadow-[0_0_18px_rgba(255,215,0,1)] -translate-y-2' : 'z-40 scale-110'}
                          `}
                        >
                          <PawnIcon playerIdx={p.owner} />
                          {isMovable && (
                            <div className="absolute inset-0 bg-amber-400/50 rounded-full blur-md animate-pulse pointer-events-none"></div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Home Well (P1 Red) */}
          <div className="relative z-30 w-full flex items-center justify-center pb-1">
             <FrameHomeWell playerIdx={PlayerId.P1} gameState={gameState} onPieceClick={onPieceClick} />
          </div>

      </div>

    </div>
  );
};