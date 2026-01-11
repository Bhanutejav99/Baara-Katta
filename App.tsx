import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, PlayerId, Piece, PieceStatus, Player, GameMode } from './types';
import { PLAYER_CONFIG } from './constants';
import { canMovePiece, movePiece, getBotMove } from './utils/gameLogic';
import { Board } from './components/Board';
import { CowrieDice } from './components/CowrieDice';

// --- INITIAL DATA & TYPES ---

const INITIAL_PIECES: Piece[] = Array.from({ length: 4 }).map((_, i) => ({
  id: i,
  owner: PlayerId.P1, 
  status: PieceStatus.HOME,
  pathIndex: -1
}));

const createPlayers = (mode: GameMode): Player[] => {
  const basePlayers: Player[] = [
    { id: PlayerId.P1, ...PLAYER_CONFIG[PlayerId.P1], pieces: [], hasKilled: false, isBot: false },
    { id: PlayerId.P2, ...PLAYER_CONFIG[PlayerId.P2], pieces: [], hasKilled: false, isBot: false },
    { id: PlayerId.P3, ...PLAYER_CONFIG[PlayerId.P3], pieces: [], hasKilled: false, isBot: false },
    { id: PlayerId.P4, ...PLAYER_CONFIG[PlayerId.P4], pieces: [], hasKilled: false, isBot: false },
  ];

  basePlayers.forEach(p => {
    p.pieces = JSON.parse(JSON.stringify(INITIAL_PIECES)).map((piece: Piece) => ({ ...piece, owner: p.id }));
  });

  if (mode === GameMode.VS_COMPUTER) {
    basePlayers[1].isBot = true; basePlayers[1].name = "Maharaja Bot";
    basePlayers[2].isBot = true; basePlayers[2].name = "Minister Bot";
    basePlayers[3].isBot = true; basePlayers[3].name = "Guard Bot";
  } else if (mode === GameMode.ONLINE_RANDOM) {
    basePlayers[1].isBot = true; basePlayers[1].name = "Player 2";
    basePlayers[2].isBot = true; basePlayers[2].name = "Player 3";
    basePlayers[3].isBot = true; basePlayers[3].name = "Player 4";
  } else if (mode === GameMode.ONLINE_FRIENDS) {
     basePlayers[1].isBot = true; basePlayers[1].name = "Friend 1";
     basePlayers[2].isBot = true; basePlayers[2].name = "Friend 2";
     basePlayers[3].isBot = true; basePlayers[3].name = "Friend 3";
  }

  return basePlayers;
};

const INITIAL_STATE = (size: 5 | 7, mode: GameMode): GameState => ({
  boardSize: size,
  players: createPlayers(mode),
  currentPlayerId: PlayerId.P1,
  diceValues: [],
  isRolling: false,
  winner: null,
  logs: ["Game Started. Red to move."],
  lastDiceFace: null,
  awaitingBonusRoll: false,
  gameMode: mode
});

// --- HELPER COMPONENT: CONFETTI ---
const ConfettiRain = () => (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        {Array.from({length: 50}).map((_, i) => (
            <div key={i} className="confetti" style={{
                left: `${Math.random() * 100}vw`,
                animationDuration: `${Math.random() * 3 + 2}s`,
                backgroundColor: ['#f00', '#0f0', '#00f', '#ff0', '#f0f'][Math.floor(Math.random() * 5)]
            }}></div>
        ))}
    </div>
);

// --- HELPER COMPONENTS ---

interface MenuCardProps {
    children: React.ReactNode;
    title: string;
    onBack?: () => void;
}

const MenuCard: React.FC<MenuCardProps> = ({ children, title, onBack }) => (
    <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
        <div className="max-w-4xl w-full bg-[#1a0f0d]/90 backdrop-blur-xl p-8 md:p-12 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.8)] border border-[#5d4037] relative overflow-hidden">
             {/* Decorative Corner Ornaments */}
             <div className="absolute top-0 left-0 w-20 h-20 border-t-4 border-l-4 border-amber-500 rounded-tl-[2rem] opacity-50"></div>
             <div className="absolute bottom-0 right-0 w-20 h-20 border-b-4 border-r-4 border-amber-500 rounded-br-[2rem] opacity-50"></div>
             
             {onBack && (
                 <button onClick={onBack} className="absolute top-8 left-8 text-amber-500/80 hover:text-amber-400 font-bold uppercase tracking-widest text-sm transition-colors">
                     ← Back
                 </button>
             )}

             <div className="text-center relative z-10">
                <h1 className="text-4xl md:text-5xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600 mb-2 drop-shadow-sm">
                    {title}
                </h1>
                <div className="w-24 h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent mx-auto mb-10 opacity-50"></div>
                {children}
             </div>
        </div>
    </div>
);

interface ModeButtonProps {
    icon: string;
    title: string;
    desc: string;
    onClick: () => void;
}

const ModeButton: React.FC<ModeButtonProps> = ({ icon, title, desc, onClick }) => (
      <button onClick={onClick} className="group relative p-6 rounded-2xl bg-gradient-to-br from-[#2a1b15] to-[#1a0f0d] border border-[#5d4037] hover:border-amber-500 transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(245,158,11,0.2)] text-left flex items-start gap-4">
          <div className="text-4xl p-3 bg-black/30 rounded-full group-hover:scale-110 transition-transform">{icon}</div>
          <div>
              <div className="text-xl font-bold text-amber-100 group-hover:text-amber-400 font-display">{title}</div>
              <div className="text-sm text-gray-400 mt-1 leading-relaxed">{desc}</div>
          </div>
      </button>
);

// --- MAIN APP COMPONENT ---

export default function App() {
  const [setupStep, setSetupStep] = useState<'MODE' | 'SIZE' | 'LOBBY' | 'GAME'>('MODE');
  const [selectedMode, setSelectedMode] = useState<GameMode>(GameMode.PASS_N_PLAY);
  const [roomCode, setRoomCode] = useState("");
  const [gameState, setGameState] = useState<GameState>(INITIAL_STATE(7, GameMode.PASS_N_PLAY));

  // Bot Logic Timers
  const botRollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const botMoveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startGame = (size: 5 | 7) => {
    setGameState(INITIAL_STATE(size, selectedMode));
    setSetupStep('GAME');
  };

  // --- GAME LOGIC ---

  const handleRoll = useCallback(() => {
    if (gameState.isRolling || gameState.winner !== null) return;
    if (gameState.diceValues.length > 0 && !gameState.awaitingBonusRoll) return; 

    setGameState(prev => ({ ...prev, isRolling: true, awaitingBonusRoll: false }));

    // Sound effect trigger would go here
    setTimeout(() => {
      const maxShells = gameState.boardSize === 5 ? 4 : 6;
      // Randomly decide how many shells fall open (face up)
      const openShells = Math.floor(Math.random() * (maxShells + 1)); 
      
      let value = openShells;
      
      if (maxShells === 4) {
          // Ashta Chamma Logic
          if (value === 0) value = 8;
      } else {
          // Baara Katta Logic (6 shells)
          if (value === 0) value = 12; // Baara (12)
          // Note: if value is 6, it stays 6 (Katta)
      }
      
      // Determine Bonus Turn
      // 5x5: 4 or 8
      // 7x7: 6 or 12
      const isExtraTurn = (maxShells === 4 && (value === 4 || value === 8)) ||
                          (maxShells === 6 && (value === 6 || value === 12));

      const playerName = gameState.players[gameState.currentPlayerId].name;

      setGameState(prev => {
        const newDiceValues = [...prev.diceValues, value];
        const logMsg = isExtraTurn 
            ? `${playerName} got ${value} (Bonus Turn!)` 
            : `${playerName} rolled ${value}`;

        return {
          ...prev,
          isRolling: false,
          diceValues: newDiceValues,
          logs: [...prev.logs, logMsg],
          lastDiceFace: value
        };
      });
    }, 800);
  }, [gameState.isRolling, gameState.winner, gameState.diceValues, gameState.awaitingBonusRoll, gameState.players, gameState.currentPlayerId, gameState.boardSize]);

  const handlePieceClick = (ownerId: number, pieceIdx: number) => {
    if (gameState.winner || gameState.currentPlayerId !== ownerId) return;
    if (gameState.players[gameState.currentPlayerId].isBot) return;

    const validDieIndex = gameState.diceValues.findIndex(val => 
      canMovePiece(gameState, gameState.players[ownerId].pieces[pieceIdx], val)
    );

    if (validDieIndex === -1) return; // Add shake animation logic here later

    const steps = gameState.diceValues[validDieIndex];
    setGameState(prev => movePiece(prev, pieceIdx, steps));
  };

  // Bot Loop
  useEffect(() => {
    if (setupStep !== 'GAME' || gameState.winner) return;

    const currentPlayer = gameState.players[gameState.currentPlayerId];
    
    if (currentPlayer.isBot) {
        if (gameState.diceValues.length === 0 || gameState.awaitingBonusRoll) {
            if (!gameState.isRolling) {
                botRollTimer.current = setTimeout(handleRoll, 1500);
            }
        } else if (gameState.diceValues.length > 0 && !gameState.isRolling) {
            botMoveTimer.current = setTimeout(() => {
                const bestMove = getBotMove(gameState);
                if (bestMove) {
                   setGameState(prev => movePiece(prev, bestMove.pieceIndex, bestMove.diceValue));
                }
            }, 1500);
        }
    }
    return () => {
        if (botRollTimer.current) clearTimeout(botRollTimer.current);
        if (botMoveTimer.current) clearTimeout(botMoveTimer.current);
    };
  }, [gameState, setupStep, handleRoll]);

  // Turn Switching & Stuck Logic
  useEffect(() => {
    if (setupStep !== 'GAME' || gameState.winner) return;

    if (gameState.diceValues.length === 0 && !gameState.isRolling && !gameState.awaitingBonusRoll) {
       // Check if last roll was a bonus roll
       const lastVal = gameState.lastDiceFace;
       const isSize5 = gameState.boardSize === 5;
       const isBonus = isSize5 ? (lastVal === 4 || lastVal === 8) : (lastVal === 6 || lastVal === 12);
       
       if (!isBonus && lastVal !== null) {
         const timer = setTimeout(() => {
            setGameState(prev => {
                const nextId = (prev.currentPlayerId + 1) % 4;
                return {
                    ...prev,
                    currentPlayerId: nextId,
                    lastDiceFace: null, 
                    logs: [...prev.logs, `Turn: ${prev.players[nextId].name}`]
                };
            });
         }, 1000);
         return () => clearTimeout(timer);
       }
    }

    // Stuck Check
    if (gameState.diceValues.length > 0 && !gameState.awaitingBonusRoll && !gameState.isRolling) {
      const currentPlayer = gameState.players[gameState.currentPlayerId];
      const hasValidMove = currentPlayer.pieces.some(p => 
        gameState.diceValues.some(val => canMovePiece(gameState, p, val))
      );

      if (!hasValidMove) {
         const timer = setTimeout(() => {
          setGameState(prev => {
             const nextId = (prev.currentPlayerId + 1) % 4;
             return {
              ...prev,
              diceValues: [],
              lastDiceFace: null, 
              currentPlayerId: nextId,
              logs: [...prev.logs, `No moves possible. Skipping turn.`, `Turn: ${prev.players[nextId].name}`]
             };
          });
         }, 2000);
         return () => clearTimeout(timer);
      }
    }
  }, [gameState.diceValues, gameState.isRolling, gameState.winner, gameState.currentPlayerId, gameState.lastDiceFace, gameState.awaitingBonusRoll, setupStep, gameState.boardSize]);


  // --- VIEW STATES ---

  if (setupStep === 'MODE') {
    return (
        <MenuCard title="Baara Katta">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ModeButton 
                    onClick={() => { setSelectedMode(GameMode.VS_COMPUTER); setSetupStep('SIZE'); }}
                    icon="🤖" title="Vs Computer" desc="Sharpen your skills against royal AI opponents."
                />
                <ModeButton 
                    onClick={() => { setSelectedMode(GameMode.PASS_N_PLAY); setSetupStep('SIZE'); }}
                    icon="👥" title="Pass & Play" desc="Classic fun on a single device with friends."
                />
                <ModeButton 
                    onClick={() => { setSelectedMode(GameMode.ONLINE_FRIENDS); setSetupStep('LOBBY'); }}
                    icon="⚔️" title="Play Online" desc="Challenge friends or meet new rivals."
                />
                <ModeButton 
                    onClick={() => { setSelectedMode(GameMode.ONLINE_RANDOM); setSetupStep('SIZE'); }}
                    icon="🌍" title="Global Match" desc="Ranked matches against the world."
                />
            </div>
        </MenuCard>
    );
  }

  if (setupStep === 'LOBBY') {
      return (
        <MenuCard title="Join Chamber" onBack={() => setSetupStep('MODE')}>
             <div className="max-w-md mx-auto space-y-6">
                <input 
                    type="text" 
                    placeholder="Enter Secret Code" 
                    className="w-full bg-black/40 border-2 border-[#5d4037] rounded-xl p-4 text-amber-100 text-center text-xl focus:border-amber-500 outline-none placeholder-gray-600 transition-colors"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value)}
                />
                <button 
                    onClick={() => setSetupStep('SIZE')}
                    className="w-full py-4 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold rounded-xl shadow-lg transform active:scale-95 transition-all"
                >
                    ENTER GAME
                </button>
             </div>
        </MenuCard>
      )
  }

  if (setupStep === 'SIZE') {
    return (
      <MenuCard title="Select Battlefield" onBack={() => setSetupStep('MODE')}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
            <button 
              onClick={() => startGame(5)}
              className="group relative h-64 rounded-3xl overflow-hidden border-2 border-[#5d4037] hover:border-amber-500 transition-all"
            >
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/90 z-10"></div>
                <div className="absolute bottom-0 left-0 right-0 p-6 z-20 text-left">
                    <div className="text-5xl font-display font-bold text-white mb-2">5x5</div>
                    <div className="text-amber-400 font-bold uppercase tracking-wider">Ashta Chamma</div>
                    <div className="text-gray-400 text-sm mt-2">Fast paced • High conflict</div>
                </div>
            </button>

            <button 
              onClick={() => startGame(7)}
              className="group relative h-64 rounded-3xl overflow-hidden border-2 border-[#5d4037] hover:border-amber-500 transition-all"
            >
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/90 z-10"></div>
                <div className="absolute bottom-0 left-0 right-0 p-6 z-20 text-left">
                    <div className="text-5xl font-display font-bold text-white mb-2">7x7</div>
                    <div className="text-amber-400 font-bold uppercase tracking-wider">Baara Katta</div>
                    <div className="text-gray-400 text-sm mt-2">Strategic • Long format</div>
                </div>
            </button>
          </div>
      </MenuCard>
    );
  }

  const currentPlayer = gameState.players[gameState.currentPlayerId];

  return (
    <div className="h-[100dvh] w-full flex flex-col xl:flex-row xl:items-center xl:justify-center overflow-hidden bg-black/20">
      
      {/* MOBILE HEADER */}
      <div className="xl:hidden flex justify-between items-center p-4 bg-[#2a1b15]/90 backdrop-blur-md border-b border-[#5d4037] z-30 shrink-0 shadow-lg">
         <button onClick={() => setSetupStep('MODE')} className="text-[10px] font-bold text-amber-500/80 border border-amber-500/30 px-3 py-1 rounded-full uppercase tracking-wider">
            Surrender
         </button>
         <div className="flex gap-2">
             {gameState.players.map(p => {
               const isActive = p.id === gameState.currentPlayerId;
               return (
                 <div key={p.id} className={`w-6 h-6 rounded-full border-2 transition-all ${p.color} ${isActive ? 'scale-125 border-white shadow-[0_0_10px_white]' : 'border-transparent opacity-50'}`}></div>
               )
             })}
         </div>
      </div>

      {/* GAME AREA */}
      <div className="flex-1 flex items-center justify-center relative p-2 overflow-hidden perspective-board">
          {gameState.winner !== null && <ConfettiRain />}
          
          <div className="scale-[0.85] md:scale-100 xl:scale-100 transition-transform duration-500">
            <Board gameState={gameState} onPieceClick={handlePieceClick} />
          </div>
          
          {/* Victory Modal */}
          {gameState.winner !== null && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-6">
              <div className="bg-[#1a0f0d] p-10 rounded-[2rem] text-center shadow-[0_0_50px_rgba(245,158,11,0.5)] border-2 border-amber-500 max-w-md w-full animate-[bounce_1s_ease-out]">
                  <div className="text-6xl mb-4">👑</div>
                  <h2 className="text-4xl font-display font-bold text-amber-400 mb-2">Victory!</h2>
                  <p className="text-xl text-gray-300 mb-8">
                    <span className={`font-bold ${PLAYER_CONFIG[gameState.winner].text}`}>
                      {gameState.players[gameState.winner].name}
                    </span> claims the throne.
                  </p>
                  <button 
                    onClick={() => setSetupStep('MODE')}
                    className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold rounded-xl text-lg hover:scale-105 transition-transform shadow-lg"
                  >
                    Play Again
                  </button>
              </div>
            </div>
          )}
      </div>

      {/* MOBILE BOTTOM CONTROLS */}
      <div className="xl:hidden w-full bg-[#1a0f0d] pb-6 pt-2 px-4 rounded-t-[2rem] shadow-[0_-10px_40px_rgba(0,0,0,0.9)] z-40 border-t-2 border-[#5d4037] shrink-0">
          <div className="flex items-center gap-4 h-24">
               {/* Player Avatar */}
               <div className={`
                  w-16 h-16 rounded-2xl bg-gradient-to-br ${currentPlayer.gradient} 
                  border-2 border-amber-500/50 shadow-lg flex flex-col items-center justify-center shrink-0 relative overflow-hidden
               `}>
                   <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
                   <div className="text-2xl relative z-10">{currentPlayer.isBot ? '🤖' : '👤'}</div>
                   <div className="text-[9px] font-bold text-white uppercase mt-1 relative z-10">{currentPlayer.name}</div>
               </div>

               {/* Dice Module */}
               <div className="flex-1 h-full">
                  <CowrieDice 
                    value={gameState.lastDiceFace || 0} 
                    rolling={gameState.isRolling} 
                    onRoll={handleRoll}
                    disabled={(gameState.diceValues.length > 0 && !gameState.awaitingBonusRoll) || currentPlayer.isBot} 
                    canRoll={!gameState.winner && (gameState.diceValues.length === 0 || gameState.awaitingBonusRoll) && !currentPlayer.isBot}
                    layout="horizontal"
                    maxShells={gameState.boardSize === 5 ? 4 : 6}
                  />
               </div>
          </div>
          
          {/* Moves Strip */}
          <div className="h-8 mt-2 flex justify-center items-center">
             {gameState.diceValues.length > 0 ? (
                <div className="flex gap-2 animate-pulse">
                   {gameState.diceValues.map((v, i) => (
                      <span key={i} className="bg-amber-500 text-black font-bold px-3 py-0.5 rounded shadow-lg text-sm">Move {v}</span>
                   ))}
                </div>
             ) : (
                <span className="text-xs text-gray-600 uppercase tracking-widest">{gameState.isRolling ? 'Fates are turning...' : 'Waiting for roll...'}</span>
             )}
          </div>
      </div>


      {/* DESKTOP SIDEBAR LEFT */}
      <div className="hidden xl:flex w-96 flex-col gap-6 z-20 h-[80vh] justify-center">
        {/* Header */}
        <div className="bg-[#2a1b15]/80 backdrop-blur-md p-8 rounded-[2rem] border border-[#5d4037] shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 text-8xl transition-transform group-hover:rotate-12">🎲</div>
          <button onClick={() => setSetupStep('MODE')} className="absolute top-6 right-6 text-xs font-bold text-amber-500/60 hover:text-amber-400 uppercase tracking-widest transition-colors">
            Exit
          </button>
          <h1 className="text-4xl font-display font-bold text-amber-100">
            {gameState.boardSize === 5 ? 'Ashta Chamma' : 'Baara Katta'}
          </h1>
          <div className="text-sm text-amber-600 mt-2 uppercase tracking-widest font-bold">
            Royal Court • {selectedMode.replace(/_/g, " ")}
          </div>
        </div>

        {/* Player Control Card */}
        <div className={`
           p-8 rounded-[2rem] border-[3px] shadow-2xl transition-all duration-500 relative overflow-hidden
           bg-[#1a0f0d]
           ${currentPlayer.border}
           ${currentPlayer.id === gameState.currentPlayerId ? 'shadow-[0_0_30px_rgba(0,0,0,0.5)] scale-105' : 'opacity-90'}
        `}>
          {/* Background Gradient */}
          <div className={`absolute inset-0 bg-gradient-to-br ${currentPlayer.gradient} opacity-10`}></div>

          <div className="flex items-center gap-5 mb-8 relative z-10">
             <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${currentPlayer.gradient} border-4 border-[#1a0f0d] shadow-lg flex items-center justify-center text-3xl`}>
                {currentPlayer.isBot ? '🤖' : '👤'}
             </div>
             <div>
               <div className="text-amber-500/80 text-xs uppercase tracking-[0.2em] font-bold mb-1">Active Player</div>
               <div className={`font-display text-4xl font-bold text-white`}>{currentPlayer.name}</div>
             </div>
          </div>

          <CowrieDice 
            value={gameState.lastDiceFace || 0} 
            rolling={gameState.isRolling} 
            onRoll={handleRoll}
            disabled={(gameState.diceValues.length > 0 && !gameState.awaitingBonusRoll) || currentPlayer.isBot} 
            canRoll={!gameState.winner && (gameState.diceValues.length === 0 || gameState.awaitingBonusRoll) && !currentPlayer.isBot}
            maxShells={gameState.boardSize === 5 ? 4 : 6}
          />

          {gameState.diceValues.length > 0 && (
             <div className="mt-6 flex justify-center gap-3">
               {gameState.diceValues.map((v, i) => (
                 <div key={i} className="animate-bounce w-12 h-12 rounded-xl bg-amber-500 text-[#2a1b15] font-bold text-2xl flex items-center justify-center shadow-lg border-b-4 border-amber-800">
                   {v}
                 </div>
               ))}
             </div>
          )}
        </div>
      </div>

      {/* DESKTOP SIDEBAR RIGHT (LOGS) */}
      <div className="hidden xl:flex w-80 flex-col gap-4 h-[600px] z-20">
         <div className="flex-1 bg-[#1a0f0d]/80 backdrop-blur-md p-6 rounded-[2rem] border border-[#5d4037] shadow-inner flex flex-col">
            <h3 className="text-xs font-bold text-[#8d6e63] uppercase tracking-[0.2em] mb-4 border-b border-[#5d4037] pb-2">Chronicles</h3>
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
                {gameState.logs.slice().reverse().map((log, i) => (
                    <div key={i} className="text-sm text-gray-400 border-l-2 border-[#5d4037] pl-3 py-1 animate-fadeIn">
                        {log}
                    </div>
                ))}
            </div>
         </div>
         
         {/* Simple Scoreboard */}
         <div className="bg-[#2a1b15] p-5 rounded-[2rem] border border-[#5d4037]">
            {gameState.players.map(p => {
                 const finished = p.pieces.filter(pc => pc.status === PieceStatus.FINISHED).length;
                 return (
                     <div key={p.id} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                         <div className={`text-sm font-bold ${p.text}`}>{p.name}</div>
                         <div className="flex gap-1">
                            {Array.from({length: 4}).map((_, i) => (
                                <div key={i} className={`w-2 h-2 rounded-full ${i < finished ? 'bg-amber-400' : 'bg-gray-800'}`}></div>
                            ))}
                         </div>
                     </div>
                 )
            })}
         </div>
      </div>

    </div>
  );
}