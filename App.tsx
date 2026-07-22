import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, PlayerId, Piece, PieceStatus, Player, GameMode, BotDifficulty, BoardTheme } from './types';
import { PLAYER_CONFIG } from './constants';
import { canMovePiece, movePiece, getBotMove, checkWinner } from './utils/gameLogic';
import { Board, THEME_STYLES } from './components/Board';
import { CowrieDice } from './components/CowrieDice';
import { RulesModal } from './components/RulesModal';
import { InstallModal } from './components/InstallModal';
import { soundEngine } from './utils/audio';

// --- INITIAL DATA & TYPES ---

const INITIAL_PIECES: Piece[] = Array.from({ length: 4 }).map((_, i) => ({
  id: i,
  owner: PlayerId.P1, 
  status: PieceStatus.HOME,
  pathIndex: -1
}));

const getNextPlayerId = (currentId: PlayerId, playerCount: 2 | 4): PlayerId => {
  if (playerCount === 2) {
    return currentId === PlayerId.P1 ? PlayerId.P3 : PlayerId.P1;
  }
  return ((currentId + 1) % 4) as PlayerId;
};

const createPlayers = (mode: GameMode, difficulty: BotDifficulty, playerCount: 2 | 4 = 2): Player[] => {
  const basePlayers: Player[] = [
    { id: PlayerId.P1, ...PLAYER_CONFIG[PlayerId.P1], pieces: [], hasKilled: false, isBot: false },
    { id: PlayerId.P2, ...PLAYER_CONFIG[PlayerId.P2], pieces: [], hasKilled: false, isBot: false },
    { id: PlayerId.P3, ...PLAYER_CONFIG[PlayerId.P3], pieces: [], hasKilled: false, isBot: false },
    { id: PlayerId.P4, ...PLAYER_CONFIG[PlayerId.P4], pieces: [], hasKilled: false, isBot: false },
  ];

  // Active player IDs: 2-player uses P1 (Red - Bottom) and P3 (Yellow - Top) for classic opposite balance
  const activeIds = playerCount === 2 ? [PlayerId.P1, PlayerId.P3] : [PlayerId.P1, PlayerId.P2, PlayerId.P3, PlayerId.P4];

  basePlayers.forEach(p => {
    if (activeIds.includes(p.id)) {
      p.pieces = JSON.parse(JSON.stringify(INITIAL_PIECES)).map((piece: Piece) => ({ ...piece, owner: p.id }));
    } else {
      p.pieces = [];
    }
  });

  if (mode === GameMode.VS_COMPUTER) {
    const diffPrefix = difficulty === BotDifficulty.EMPEROR ? "Emperor" : difficulty === BotDifficulty.NOVICE ? "Courtier" : "General";
    if (playerCount === 2) {
      basePlayers[PlayerId.P3].isBot = true; 
      basePlayers[PlayerId.P3].name = `Maharaja (${diffPrefix})`;
    } else {
      basePlayers[PlayerId.P2].isBot = true; basePlayers[PlayerId.P2].name = `Maharaja (${diffPrefix})`;
      basePlayers[PlayerId.P3].isBot = true; basePlayers[PlayerId.P3].name = `Minister (${diffPrefix})`;
      basePlayers[PlayerId.P4].isBot = true; basePlayers[PlayerId.P4].name = `Guard (${diffPrefix})`;
    }
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

const INITIAL_STATE = (
  size: 5 | 7, 
  mode: GameMode, 
  difficulty: BotDifficulty = BotDifficulty.STRATEGIST,
  playerCount: 2 | 4 = 2
): GameState => ({
  boardSize: size,
  playerCount: playerCount,
  players: createPlayers(mode, difficulty, playerCount),
  currentPlayerId: PlayerId.P1,
  diceValues: [],
  selectedDieIndex: null,
  selectedPiece: null,
  isRolling: false,
  winner: null,
  logs: ["Game Started. Red to move."],
  lastDiceFace: null,
  awaitingBonusRoll: false,
  gameMode: mode,
  botDifficulty: difficulty
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
  const [setupStep, setSetupStep] = useState<'MODE' | 'OPPONENTS' | 'DIFFICULTY' | 'SIZE' | 'LOBBY' | 'GAME'>('MODE');
  const [selectedMode, setSelectedMode] = useState<GameMode>(GameMode.PASS_N_PLAY);
  const [selectedPlayerCount, setSelectedPlayerCount] = useState<2 | 4>(2); // Default 1vs1 (2 Players)
  const [selectedDifficulty, setSelectedDifficulty] = useState<BotDifficulty>(BotDifficulty.STRATEGIST);
  const [roomCode, setRoomCode] = useState("");
  const [isMuted, setIsMuted] = useState(soundEngine.getMuted());
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [gameState, setGameState] = useState<GameState>(INITIAL_STATE(7, GameMode.PASS_N_PLAY, BotDifficulty.STRATEGIST, 2));

  // Listen for native PWA install prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted PWA install');
      }
      setDeferredPrompt(null);
    }
    setShowInstallModal(false);
  };

  // Bot Logic Timers
  const botRollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const botMoveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toggleSound = () => {
    const muted = soundEngine.toggleMute();
    setIsMuted(muted);
  };

  const cycleTheme = () => {
    soundEngine.playSelect();
    const themes = [BoardTheme.MAHOGANY, BoardTheme.EMERALD, BoardTheme.MARBLE, BoardTheme.SAPPHIRE];
    const currentIndex = themes.indexOf(gameState.theme || BoardTheme.MAHOGANY);
    const nextTheme = themes[(currentIndex + 1) % themes.length];
    setGameState(prev => ({ ...prev, theme: nextTheme }));
  };

  const startGame = (size: 5 | 7) => {
    setGameState(INITIAL_STATE(size, selectedMode, selectedDifficulty, selectedPlayerCount));
    setSetupStep('GAME');
  };

  // --- GAME LOGIC ---

  const handleRoll = useCallback(() => {
    if (gameState.isRolling || gameState.winner !== null) return;
    if (gameState.diceValues.length > 0 && !gameState.awaitingBonusRoll) return; 

    setGameState(prev => ({ ...prev, isRolling: true, awaitingBonusRoll: false }));

    setTimeout(() => {
      const maxShells = gameState.boardSize === 5 ? 4 : 6;
      
      // Realistic Binomial Cowrie Shell Physics (6.25% chance for 4 or 8)
      let openShells = 0;
      for (let i = 0; i < maxShells; i++) {
        if (Math.random() < 0.5) openShells++;
      }
      
      let value = openShells;
      
      if (maxShells === 4) {
          if (value === 0) value = 8;
      } else {
          if (value === 0) value = 12;
      }
      
      const isExtraTurn = (maxShells === 4 && (value === 4 || value === 8)) ||
                          (maxShells === 6 && (value === 6 || value === 12));

      const playerName = gameState.players[gameState.currentPlayerId].name;

      if (isExtraTurn) {
        soundEngine.playBonus();
      }

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

    let validDieIndex = -1;

    if (gameState.selectedDieIndex !== null && gameState.diceValues[gameState.selectedDieIndex] !== undefined) {
      const selectedVal = gameState.diceValues[gameState.selectedDieIndex];
      if (canMovePiece(gameState, gameState.players[ownerId].pieces[pieceIdx], selectedVal)) {
        validDieIndex = gameState.selectedDieIndex;
      }
    }

    if (validDieIndex === -1) {
      validDieIndex = gameState.diceValues.findIndex(val => 
        canMovePiece(gameState, gameState.players[ownerId].pieces[pieceIdx], val)
      );
    }

    if (validDieIndex === -1) {
      soundEngine.playError();
      return;
    }

    const steps = gameState.diceValues[validDieIndex];
    
    setGameState(prev => {
      const prevLogCount = prev.logs.length;
      const nextState = movePiece(prev, pieceIdx, steps);
      nextState.selectedDieIndex = null;

      const hasCapture = nextState.logs.length > prevLogCount && nextState.logs[nextState.logs.length - 1].includes('captured');

      if (nextState.winner !== null) {
        soundEngine.playVictory();
      } else if (hasCapture) {
        soundEngine.playCapture();
      } else if (nextState.awaitingBonusRoll) {
        soundEngine.playBonus();
      } else {
        soundEngine.playMove();
      }

      return nextState;
    });
  };

  const handleDiePillClick = (index: number) => {
    soundEngine.playSelect();
    setGameState(prev => ({
      ...prev,
      selectedDieIndex: prev.selectedDieIndex === index ? null : index
    }));
  };

  // Continuous Victory & Lockout Check
  useEffect(() => {
    if (setupStep !== 'GAME' || gameState.winner !== null) return;

    const winResult = checkWinner(gameState);
    if (winResult.winnerId !== null) {
      soundEngine.playVictory();
      setGameState(prev => {
        if (prev.winner !== null) return prev;
        const winnerName = prev.players[winResult.winnerId!].name;
        const logMsg = winResult.isLockout 
          ? `👑 ${winnerName} achieved Lockout Victory! Opponent has no pass to enter inner circle.`
          : `🏆 ${winnerName} HAS WON THE GAME!`;
        return {
          ...prev,
          winner: winResult.winnerId,
          logs: [...prev.logs, logMsg]
        };
      });
    }
  }, [gameState, setupStep]);

  // Bot Loop
  useEffect(() => {
    if (setupStep !== 'GAME' || gameState.winner) return;

    const currentPlayer = gameState.players[gameState.currentPlayerId];
    
    if (currentPlayer && currentPlayer.isBot) {
        if (gameState.diceValues.length === 0 || gameState.awaitingBonusRoll) {
            if (!gameState.isRolling) {
                botRollTimer.current = setTimeout(handleRoll, 1200);
            }
        } else if (gameState.diceValues.length > 0 && !gameState.isRolling) {
            botMoveTimer.current = setTimeout(() => {
                const bestMove = getBotMove(gameState);
                if (bestMove) {
                   setGameState(prev => {
                     const nextState = movePiece(prev, bestMove.pieceIndex, bestMove.diceValue);
                     if (nextState.winner !== null) {
                       soundEngine.playVictory();
                     } else if (nextState.awaitingBonusRoll) {
                       soundEngine.playBonus();
                     } else {
                       soundEngine.playMove();
                     }
                     return nextState;
                   });
                }
            }, 1200);
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
       const lastVal = gameState.lastDiceFace;
       const isSize5 = gameState.boardSize === 5;
       const isBonus = isSize5 ? (lastVal === 4 || lastVal === 8) : (lastVal === 6 || lastVal === 12);
       
       if (!isBonus && lastVal !== null) {
         const timer = setTimeout(() => {
            setGameState(prev => {
                const nextId = getNextPlayerId(prev.currentPlayerId, prev.playerCount);
                return {
                    ...prev,
                    currentPlayerId: nextId,
                    lastDiceFace: null, 
                    selectedDieIndex: null,
                    logs: [...prev.logs, `Turn: ${prev.players[nextId].name}`]
                };
            });
         }, 800);
         return () => clearTimeout(timer);
       }
    }

    // Stuck Check
    if (gameState.diceValues.length > 0 && !gameState.awaitingBonusRoll && !gameState.isRolling) {
      const currentPlayer = gameState.players[gameState.currentPlayerId];
      if (currentPlayer && currentPlayer.pieces.length > 0) {
        const hasValidMove = currentPlayer.pieces.some(p => 
          gameState.diceValues.some(val => canMovePiece(gameState, p, val))
        );

        if (!hasValidMove) {
           const timer = setTimeout(() => {
            setGameState(prev => {
               const nextId = getNextPlayerId(prev.currentPlayerId, prev.playerCount);
               return {
                ...prev,
                diceValues: [],
                lastDiceFace: null, 
                selectedDieIndex: null,
                currentPlayerId: nextId,
                logs: [...prev.logs, `No moves possible for ${currentPlayer.name}. Skipping turn.`, `Turn: ${prev.players[nextId].name}`]
               };
            });
           }, 1800);
           return () => clearTimeout(timer);
        }
      }
    }
  }, [gameState.diceValues, gameState.isRolling, gameState.winner, gameState.currentPlayerId, gameState.lastDiceFace, gameState.awaitingBonusRoll, setupStep, gameState.boardSize]);

  // --- VIEW STATES ---

  if (setupStep === 'MODE') {
    return (
        <MenuCard title="Baara Katta">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ModeButton 
                    onClick={() => { setSelectedMode(GameMode.VS_COMPUTER); setSetupStep('OPPONENTS'); }}
                    icon="🤖" title="Vs Computer" desc="Sharpen your skills against royal AI opponents."
                />
                <ModeButton 
                    onClick={() => { setSelectedMode(GameMode.PASS_N_PLAY); setSelectedPlayerCount(2); setSetupStep('SIZE'); }}
                    icon="👥" title="Pass & Play" desc="Classic fun on a single device with friends."
                />
                <ModeButton 
                    onClick={() => { setSelectedMode(GameMode.ONLINE_FRIENDS); setSelectedPlayerCount(4); setSetupStep('LOBBY'); }}
                    icon="⚔️" title="Play Online" desc="Challenge friends or meet new rivals."
                />
                <ModeButton 
                    onClick={() => { setSelectedMode(GameMode.ONLINE_RANDOM); setSelectedPlayerCount(4); setSetupStep('SIZE'); }}
                    icon="🌍" title="Global Match" desc="Ranked matches against the world."
                />
            </div>
            
            <div className="mt-8 flex justify-center gap-4 text-xs font-bold text-amber-500/80">
              <button onClick={() => setShowRulesModal(true)} className="hover:text-amber-300 flex items-center gap-1 uppercase tracking-wider">
                📜 How to Play & Rules
              </button>
            </div>

            <RulesModal isOpen={showRulesModal} onClose={() => setShowRulesModal(false)} />
        </MenuCard>
    );
  }

  if (setupStep === 'OPPONENTS') {
    return (
      <MenuCard title="Select Opponent Mode" onBack={() => setSetupStep('MODE')}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          <button 
            onClick={() => { setSelectedPlayerCount(2); setSetupStep('DIFFICULTY'); }}
            className="group relative p-8 rounded-3xl bg-gradient-to-br from-[#2a1b15] to-[#1a0f0d] border-2 border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:border-amber-400 text-left transition-all hover:-translate-y-1"
          >
            <div className="absolute top-4 right-4 bg-amber-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              Default
            </div>
            <div className="text-4xl mb-3">⚔️</div>
            <div className="text-2xl font-bold text-amber-200 font-display mb-1">1 vs 1 Duel</div>
            <div className="text-amber-400 font-bold text-xs uppercase tracking-wider mb-2">2 Players</div>
            <div className="text-xs text-gray-400 leading-relaxed">Fast-paced 1-on-1 match against 1 Maharaja AI opponent.</div>
          </button>

          <button 
            onClick={() => { setSelectedPlayerCount(4); setSetupStep('DIFFICULTY'); }}
            className="group relative p-8 rounded-3xl bg-gradient-to-br from-[#2a1b15] to-[#1a0f0d] border-2 border-[#5d4037] hover:border-amber-500 text-left transition-all hover:-translate-y-1"
          >
            <div className="text-4xl mb-3">👑</div>
            <div className="text-2xl font-bold text-amber-200 font-display mb-1">1 vs 3 Royal Melee</div>
            <div className="text-amber-400 font-bold text-xs uppercase tracking-wider mb-2">4 Players</div>
            <div className="text-xs text-gray-400 leading-relaxed">Full court battle royale against 3 AI opponents.</div>
          </button>
        </div>
      </MenuCard>
    );
  }

  if (setupStep === 'DIFFICULTY') {
    return (
      <MenuCard title="Select AI Difficulty" onBack={() => setSetupStep('OPPONENTS')}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
          <button 
            onClick={() => { setSelectedDifficulty(BotDifficulty.NOVICE); setSetupStep('SIZE'); }}
            className="p-6 rounded-2xl bg-[#2a1b15] border-2 border-[#5d4037] hover:border-amber-500 text-left transition-all hover:-translate-y-1"
          >
            <div className="text-3xl mb-2">🌱</div>
            <div className="text-xl font-bold text-amber-200 font-display">Novice Courtier</div>
            <div className="text-xs text-gray-400 mt-2">Casual, relaxed play for beginners.</div>
          </button>

          <button 
            onClick={() => { setSelectedDifficulty(BotDifficulty.STRATEGIST); setSetupStep('SIZE'); }}
            className="p-6 rounded-2xl bg-[#2a1b15] border-2 border-amber-500/60 hover:border-amber-400 text-left transition-all hover:-translate-y-1 shadow-lg"
          >
            <div className="text-3xl mb-2">⚔️</div>
            <div className="text-xl font-bold text-amber-300 font-display">Royal General</div>
            <div className="text-xs text-gray-400 mt-2">Tactical balance of capture and defense.</div>
          </button>

          <button 
            onClick={() => { setSelectedDifficulty(BotDifficulty.EMPEROR); setSetupStep('SIZE'); }}
            className="p-6 rounded-2xl bg-[#2a1b15] border-2 border-rose-500/60 hover:border-rose-400 text-left transition-all hover:-translate-y-1"
          >
            <div className="text-3xl mb-2">👑</div>
            <div className="text-xl font-bold text-rose-300 font-display">Grand Emperor</div>
            <div className="text-xs text-gray-400 mt-2">Relentless, highly aggressive AI master.</div>
          </button>
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
      <MenuCard title="Select Battlefield" onBack={() => setSetupStep(selectedMode === GameMode.VS_COMPUTER ? 'DIFFICULTY' : 'MODE')}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
            <button 
              onClick={() => startGame(5)}
              className="group relative h-64 rounded-3xl overflow-hidden border-2 border-[#5d4037] hover:border-amber-500 transition-all"
            >
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/90 z-10"></div>
                <div className="absolute bottom-0 left-0 right-0 p-6 z-20 text-left">
                    <div className="text-5xl font-display font-bold text-white mb-2">5x5</div>
                    <div className="text-amber-400 font-bold uppercase tracking-wider">Ashta Chamma</div>
                    <div className="text-gray-400 text-sm mt-2">Fast paced • High conflict • 4 Shells</div>
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
                    <div className="text-gray-400 text-sm mt-2">Strategic • Long format • 6 Shells</div>
                </div>
            </button>
          </div>
      </MenuCard>
    );
  }

  const currentPlayer = gameState.players[gameState.currentPlayerId];
  const currentTheme = gameState.theme || BoardTheme.MAHOGANY;
  const currentThemeStyle = THEME_STYLES[currentTheme] || THEME_STYLES[BoardTheme.MAHOGANY];

  // Main Game View Render
  return (
    <div className={`h-[100dvh] w-full ${currentThemeStyle.appBg} text-amber-50 font-sans flex flex-col justify-between overflow-hidden select-none transition-colors duration-500`}>
      
      {/* TOP ROYAL COURT HEADER BAR */}
      <div className="w-full bg-[#1a0f0d]/95 backdrop-blur-xl border-b border-[#5d4037] px-4 py-2.5 flex items-center justify-between z-40 shrink-0 h-14 shadow-lg">
         <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-display font-bold text-amber-100 tracking-wider">
               {gameState.boardSize === 5 ? 'Ashta Chamma' : 'Baara Katta'}
            </h1>
            <span className="hidden sm:inline-block text-[10px] font-bold px-2.5 py-0.5 bg-amber-950/80 border border-amber-500/40 text-amber-300 rounded-full uppercase tracking-widest">
               {gameState.playerCount === 2 ? '1v1 Duel' : '4-Player'}
            </span>
         </div>

         <div className="flex items-center gap-1.5 sm:gap-2">
            <button 
              onClick={() => setShowInstallModal(true)} 
              className="text-xs px-2.5 py-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold rounded-full border border-amber-300 transition-all uppercase tracking-wider flex items-center gap-1 shadow animate-pulse"
              title="Install Web App"
            >
              <span>📲</span>
              <span className="hidden xs:inline">App</span>
            </button>
            <button 
              onClick={cycleTheme} 
              className="text-xs px-2.5 py-1 bg-amber-950/80 rounded-full border border-amber-500/40 text-amber-300 hover:bg-amber-500 hover:text-black transition-colors font-bold uppercase tracking-wider flex items-center gap-1 shadow"
              title="Change Board Theme"
            >
              <span>🎨</span>
              <span className="hidden xs:inline">{currentThemeStyle.name}</span>
            </button>
            <button onClick={toggleSound} className="text-xs px-2.5 py-1 bg-black/50 rounded-full border border-amber-500/30 text-amber-300 hover:bg-amber-500 hover:text-black transition-colors font-bold">
              {isMuted ? '🔇' : '🔊'}
            </button>
            <button onClick={() => setShowRulesModal(true)} className="text-xs px-2.5 py-1 bg-black/50 rounded-full border border-amber-500/30 text-amber-300 hover:bg-amber-500 hover:text-black transition-colors font-bold">
              📜 Rules
            </button>
            <button onClick={() => setSetupStep('MODE')} className="text-xs font-bold px-3 py-1 bg-rose-950/80 border border-rose-600/40 text-rose-300 hover:bg-rose-600 hover:text-white rounded-full uppercase tracking-widest transition-colors">
              Exit
            </button>
         </div>
      </div>

      {/* CENTER BATTLEFIELD AREA (AUTO SCALES TO FIT AVAILABLE HEIGHT) */}
      <div className="flex-1 min-h-0 w-full flex items-center justify-center relative p-2 overflow-hidden">
          {gameState.winner !== null && <ConfettiRain />}
          
          <div className="w-full h-full flex items-center justify-center">
             <Board gameState={gameState} onPieceClick={handlePieceClick} />
          </div>

          {/* Victory Modal */}
          {gameState.winner !== null && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-6">
              <div className="bg-[#1a0f0d] p-8 rounded-[2rem] text-center shadow-[0_0_50px_rgba(245,158,11,0.6)] border-3 border-amber-500 max-w-sm w-full animate-[bounce_1s_ease-out]">
                  <div className="text-5xl mb-3">👑</div>
                  <h2 className="text-3xl font-display font-bold text-amber-400 mb-2">Victory!</h2>
                  <p className="text-lg text-gray-300 mb-6">
                    <span className={`font-bold ${PLAYER_CONFIG[gameState.winner].text}`}>
                      {gameState.players[gameState.winner].name}
                    </span> claims the throne.
                  </p>
                  <button 
                    onClick={() => setSetupStep('MODE')}
                    className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold rounded-xl text-base hover:scale-105 transition-transform shadow-lg"
                  >
                    Play Again
                  </button>
              </div>
            </div>
          )}
      </div>

      {/* BOTTOM UNIFIED GAME CONTROL DOCK (ELEVATED SAFE AREA FOR EASY MOBILE THUMB REACH) */}
      <div className="w-full bg-[#1a0f0d] border-t-2 border-[#5d4037] px-4 pt-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] z-40 shrink-0 h-28 sm:h-32 shadow-[0_-10px_30px_rgba(0,0,0,0.9)] flex items-center">
         <div className="max-w-4xl mx-auto w-full flex items-center justify-between gap-3 h-full">
             
             {/* Left: Active Player Pill */}
             <div className="flex items-center gap-2 shrink-0 min-w-[90px] sm:min-w-[140px]">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br ${currentPlayer.gradient} border-2 border-amber-400 shadow-md flex items-center justify-center text-xl shrink-0`}>
                   {currentPlayer.isBot ? '🤖' : '👤'}
                </div>
                <div className="hidden sm:block">
                   <div className="text-[9px] text-amber-500/80 font-bold uppercase tracking-wider">Active Player</div>
                   <div className="text-xs sm:text-sm font-bold text-white flex items-center gap-1">
                      <span>{currentPlayer.name}</span>
                      {!currentPlayer.isBot && <span className="text-[8px] bg-amber-400 text-black px-1.5 py-0.2 rounded font-extrabold">YOUR TURN</span>}
                   </div>
                </div>
             </div>

             {/* Middle: Cowrie Shells Dice Cup */}
             <div className="flex-1 flex items-center justify-center h-full px-1">
                <CowrieDice 
                  value={gameState.lastDiceFace || 0} 
                  rolling={gameState.isRolling} 
                  onRoll={handleRoll}
                  disabled={(gameState.diceValues.length > 0 && !gameState.awaitingBonusRoll) || currentPlayer.isBot} 
                  canRoll={!gameState.winner && (gameState.diceValues.length === 0 || gameState.awaitingBonusRoll) && !currentPlayer.isBot}
                  layout="horizontal"
                  maxShells={gameState.boardSize === 5 ? 4 : 6}
                  hideButton={true}
                />
             </div>

             {/* Right: In-Place Action Slot (Move Choice Pills OR Tap Shells Prompt) */}
             <div className="shrink-0 flex items-center justify-end w-[120px] sm:w-[160px] h-full">
                {gameState.diceValues.length > 0 ? (
                  /* Move Selection Pills */
                  <div className="flex flex-col sm:flex-row gap-1.5 w-full">
                     {gameState.diceValues.map((v, i) => {
                       const isSelected = gameState.selectedDieIndex === i;
                       return (
                         <button 
                           key={i} 
                           onClick={() => handleDiePillClick(i)}
                           className={`w-full py-3 sm:py-3.5 rounded-xl font-bold text-xs sm:text-sm uppercase tracking-wider shadow-lg border-2 transition-all text-center ${isSelected ? 'bg-amber-300 text-black border-amber-600 ring-2 ring-white scale-105' : 'bg-gradient-to-r from-amber-500 to-amber-600 text-white border-amber-400 hover:from-amber-400 hover:to-amber-500 animate-pulse-gold'}`}
                         >
                           Move {v}
                         </button>
                       );
                     })}
                  </div>
                ) : (
                  /* Tap Shells Prompt Badge */
                  <div className="w-full py-2.5 sm:py-3 rounded-xl font-bold text-[10px] sm:text-xs text-amber-300/90 border border-amber-500/30 bg-amber-950/30 text-center flex items-center justify-center gap-1.5 shadow">
                     <span>👈</span>
                     <span>TAP SHELLS</span>
                  </div>
                )}
             </div>

         </div>
      </div>

      <RulesModal isOpen={showRulesModal} onClose={() => setShowRulesModal(false)} />
      <InstallModal 
         isOpen={showInstallModal} 
         onClose={() => setShowInstallModal(false)} 
         deferredPrompt={deferredPrompt} 
         onInstallClick={handleInstallClick} 
      />

    </div>
  );
}