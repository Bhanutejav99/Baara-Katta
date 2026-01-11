import React from 'react';
import { GameState, PieceStatus, PlayerId } from '../types';
import { getPaths, PLAYER_CONFIG } from '../constants';
import { isSafeSquare, canMovePiece } from '../utils/gameLogic';

interface BoardProps {
  gameState: GameState;
  onPieceClick: (playerIndex: number, pieceIndex: number) => void;
}

// --- HIGH FIDELITY ASSETS ---

// Modern 3D Pawn Icon
const PawnIcon = ({ playerIdx }: { playerIdx: number }) => {
  const colors = [
    { main: '#dc2626', light: '#fca5a5', dark: '#7f1d1d' }, // Red
    { main: '#059669', light: '#6ee7b7', dark: '#064e3b' }, // Green
    { main: '#d97706', light: '#fcd34d', dark: '#78350f' }, // Yellow
    { main: '#2563eb', light: '#93c5fd', dark: '#1e3a8a' }, // Blue
  ];
  
  const c = colors[playerIdx];

  return (
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg" style={{ filter: 'drop-shadow(1px 3px 3px rgba(0,0,0,0.5))' }}>
       <defs>
         <radialGradient id={`grad-pawn-${playerIdx}`} cx="35%" cy="30%" r="80%">
           <stop offset="0%" stopColor={c.light} />
           <stop offset="50%" stopColor={c.main} />
           <stop offset="100%" stopColor={c.dark} />
         </radialGradient>
         <linearGradient id={`gold-band-${playerIdx}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#b45309" />
            <stop offset="50%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#b45309" />
         </linearGradient>
       </defs>
       
       {/* Pawn Body */}
       <path d="M50 10 C 30 10, 25 35, 40 45 C 25 80, 15 85, 15 92 L 85 92 C 85 85, 75 80, 60 45 C 75 35, 70 10, 50 10 Z" 
             fill={`url(#grad-pawn-${playerIdx})`} 
             stroke={c.dark} 
             strokeWidth="0.5"
        />
       
       {/* Gold Band Neck */}
       <path d="M38 43 Q 50 48 62 43" stroke={`url(#gold-band-${playerIdx})`} strokeWidth="3" fill="none" />

       {/* Specular Highlight */}
       <ellipse cx="35" cy="25" rx="5" ry="8" fill="white" fillOpacity="0.4" transform="rotate(-15 35 25)" />
    </svg>
  );
};

// Ornate Safe Zone Pattern
const SafeIcon = () => (
    <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none">
        <svg viewBox="0 0 100 100" className="w-[80%] h-[80%]">
             <path d="M50 5 L65 35 L95 35 L70 55 L80 85 L50 65 L20 85 L30 55 L5 35 L35 35 Z" 
                   fill="none" stroke="#5d4037" strokeWidth="2" />
             <circle cx="50" cy="50" r="15" fill="#5d4037" fillOpacity="0.2" />
        </svg>
    </div>
);

// Glorious Center Goal
const CenterIcon = () => (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-full h-full bg-gradient-to-br from-amber-400/20 to-transparent animate-pulse"></div>
        <svg viewBox="0 0 100 100" className="w-[80%] h-[80%] drop-shadow-md">
            <defs>
                <radialGradient id="centerGrad" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#fff" />
                    <stop offset="30%" stopColor="#fbbf24" />
                    <stop offset="100%" stopColor="#b45309" />
                </radialGradient>
            </defs>
            {/* Lotus Petals */}
            {[0, 45, 90, 135, 180, 225, 270, 315].map(deg => (
                <path key={deg} d="M50 50 Q 60 20 50 5 Q 40 20 50 50" fill="#f59e0b" stroke="#78350f" strokeWidth="1" transform={`rotate(${deg} 50 50)`} />
            ))}
            <circle cx="50" cy="50" r="12" fill="url(#centerGrad)" stroke="#78350f" strokeWidth="1" />
        </svg>
    </div>
);

// --- TRAY COMPONENT ---

const HomeTray = ({ 
  playerIdx, 
  gameState, 
  onPieceClick, 
  orientation,
  styleClass 
}: { 
  playerIdx: PlayerId, 
  gameState: GameState, 
  onPieceClick: any, 
  orientation: 'vertical' | 'horizontal',
  styleClass: string
}) => {
  const player = gameState.players[playerIdx];
  const homePieces = player.pieces.filter(p => p.status === PieceStatus.HOME);
  const isCurrentPlayerTurn = gameState.currentPlayerId === playerIdx;
  
  // Tray Materials
  const trayColors = [
    'bg-[#450a0a] border-[#991b1b]', // Red
    'bg-[#064e3b] border-[#065f46]', // Green
    'bg-[#451a03] border-[#92400e]', // Yellow (Brownish Gold base)
    'bg-[#172554] border-[#1e40af]'  // Blue
  ];

  // Adjust container dimensions to allow more space for pawns
  const containerClass = orientation === 'vertical' 
    ? 'flex flex-col-reverse items-center justify-center py-2 w-14 md:w-20 min-h-[150px] md:min-h-[180px]' 
    : 'flex flex-row items-center justify-center px-2 h-14 md:h-20 min-w-[150px] md:min-w-[180px]';

  // Significantly reduced negative spacing to show pawn heads clearly
  const spacingClass = orientation === 'vertical' ? '-space-y-2' : '-space-x-2';
  
  return (
    <div className={`
        absolute ${styleClass} 
        ${trayColors[playerIdx]}
        border-[3px] rounded-xl shadow-[0_10px_20px_rgba(0,0,0,0.6)] 
        transition-all duration-500
        ${isCurrentPlayerTurn ? 'scale-105 ring-2 ring-amber-400 z-30 brightness-110' : 'opacity-90 scale-100 grayscale-[0.2]'}
    `}>
       {/* Inset Tray Depth */}
       <div className="absolute inset-2 bg-black/30 rounded-lg shadow-inner pointer-events-none"></div>

       {/* Player Label */}
       <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[9px] md:text-[10px] px-2 py-0.5 rounded-full border border-white/20 uppercase tracking-widest whitespace-nowrap z-40">
           {player.name}
       </div>

       <div className={`relative z-10 ${containerClass} ${spacingClass}`}>
          {homePieces.map((p, i) => {
             const isCurrentPlayer = gameState.currentPlayerId === p.owner;
             const isMovable = isCurrentPlayer && gameState.diceValues.some(val => canMovePiece(gameState, p, val));

             // Correct Z-Index logic:
             // For vertical (col-reverse), the first item (0) is visually at the bottom.
             // We want the bottom item to be in FRONT of the item above it, so its head covers the feet of the one above?
             // No, we want to see heads. The head is at the top of the icon.
             // If Item 1 is above Item 0. Item 1's feet overlap Item 0's head.
             // To see Item 0's head, Item 0 must be in FRONT of Item 1.
             // So lower index (visually lower on screen) should have HIGHER z-index.
             const zStyle = orientation === 'vertical' ? { zIndex: 20 - i } : { zIndex: i };

             return (
               <button
                  key={i}
                  onClick={(e) => {
                     e.stopPropagation();
                     onPieceClick(p.owner, p.id);
                  }}
                  style={zStyle}
                  className={`relative w-9 h-9 md:w-14 md:h-14 transition-all duration-300
                     ${isMovable ? 'animate-bounce cursor-pointer brightness-125 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]' : ''}
                     hover:scale-110
                  `}
               >
                  <PawnIcon playerIdx={playerIdx} />
               </button>
             )
          })}
          
          {homePieces.length === 0 && (
             <div className="text-white/20 text-xl">✓</div>
          )}
       </div>
    </div>
  )
}

// --- MAIN BOARD ---

export const Board: React.FC<BoardProps> = ({ gameState, onPieceClick }) => {
  const { boardSize } = gameState;
  const paths = getPaths(boardSize);
  const centerIndex = Math.floor(boardSize / 2);

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
    <div className="relative p-8 md:p-20">
      {/* 
        Board Structure:
        1. Outer Shadow (Lift)
        2. Main Wood Body
        3. Gold Inlay Border
        4. Inner Grid Area
      */}
      <div className="absolute inset-0 bg-[#3e2723] rounded-[2.5rem] shadow-[0_30px_60px_rgba(0,0,0,0.8),0_0_0_2px_#5d4037] overflow-hidden">
          {/* Rich Wood Grain Texture */}
          <div className="absolute inset-0 opacity-60" 
             style={{ 
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h20v20H0V0zm10 10h10v10H10V10zM0 10h10v10H0V10zM10 0h10v10H10V0z' fill='%23281510' fill-opacity='0.2'/%3E%3C/svg%3E"), linear-gradient(45deg, #3e2723, #5d4037)` 
             }}></div>
          {/* Gold Inlay Border */}
          <div className="absolute inset-2 border-[4px] border-[#b45309] rounded-[2rem] opacity-70"></div>
          <div className="absolute inset-4 border border-[#fcd34d] rounded-[1.8rem] opacity-40"></div>
      </div>

      {/* Grid Container */}
      <div 
        className={`relative z-10 grid gap-[2px] bg-[#2a1b15] border-[6px] border-[#4e342e] shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] rounded-xl overflow-hidden`}
        style={{ 
          width: 'min(60vw, 600px)', 
          height: 'min(60vw, 600px)',
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

          // Tile Styling
          let bgClass = "bg-[#eaddcf]"; // Ivory
          
          if (isCenterSpot) {
             bgClass = "bg-[#2a1b15]"; // Dark hole for center
          } else if (isSafeSpot) {
             bgClass = "bg-[#d7ccc8]"; // Darker Ivory
          } else if ((r + c) % 2 !== 0) {
             bgClass = "bg-[#f5ebe0]"; // Checker variance
          }

          // Smart Grid Layout for multiple pieces
          const pieceCount = pieces.length;
          let gridClass = 'grid-cols-1 grid-rows-1';
          if (pieceCount > 4) gridClass = 'grid-cols-3 grid-rows-3';
          else if (pieceCount > 1) gridClass = 'grid-cols-2 grid-rows-2';

          return (
            <div key={idx} className={`relative flex items-center justify-center ${bgClass} shadow-inner`}>
              {/* Tile Bevel */}
              <div className="absolute inset-0 border-[1px] border-white/40 border-b-black/10 border-r-black/10 pointer-events-none"></div>
              
              {isSafeSpot && !isCenterSpot && <SafeIcon />}
              {isCenterSpot && <CenterIcon />}

              {/* Pieces */}
              <div className={`grid ${gridClass} w-full h-full p-1 items-center justify-items-center z-10 gap-0.5`}>
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
                        relative transition-all duration-300 transform
                        ${isMovable ? 'animate-bounce z-50 cursor-pointer scale-110 drop-shadow-xl' : 'z-10 scale-95'}
                        flex items-center justify-center
                      `}
                      style={{ width: '100%', height: '100%' }}
                    >
                      <PawnIcon playerIdx={p.owner} />
                      {/* Selection Glow */}
                      {isMovable && (
                        <div className="absolute inset-0 bg-yellow-400/30 rounded-full blur-md animate-pulse"></div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Home Trays Positioned around Board */}
      <HomeTray 
        playerIdx={PlayerId.P1} 
        gameState={gameState} 
        onPieceClick={onPieceClick} 
        orientation="horizontal"
        styleClass="bottom-[-2.5rem] md:bottom-[-2rem] left-1/2 -translate-x-1/2" 
      />
      
      <HomeTray 
        playerIdx={PlayerId.P2} 
        gameState={gameState} 
        onPieceClick={onPieceClick} 
        orientation="vertical"
        styleClass="right-[-1.5rem] md:right-[-2rem] top-1/2 -translate-y-1/2" 
      />
      
      <HomeTray 
        playerIdx={PlayerId.P3} 
        gameState={gameState} 
        onPieceClick={onPieceClick} 
        orientation="horizontal"
        styleClass="top-[-2.5rem] md:top-[-2rem] left-1/2 -translate-x-1/2" 
      />
      
      <HomeTray 
        playerIdx={PlayerId.P4} 
        gameState={gameState} 
        onPieceClick={onPieceClick} 
        orientation="vertical"
        styleClass="left-[-1.5rem] md:left-[-2rem] top-1/2 -translate-y-1/2" 
      />

    </div>
  );
};