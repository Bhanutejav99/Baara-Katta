import { GameState, Piece, PieceStatus, PlayerId } from '../types';
import { getPaths, getSafeZones, getInnerCircleStartIndex } from '../constants';

export const isSafeSquare = (r: number, c: number, boardSize: number): boolean => {
  return getSafeZones(boardSize).some(z => z.r === r && z.c === c);
};

// Helper to check if a specific cell contains a barrier (2+ pieces of same opponent)
const isGattiBlocked = (gameState: GameState, r: number, c: number): boolean => {
  if (gameState.boardSize !== 5) return false;

  // Safe squares should NEVER block movement, regardless of occupancy
  if (isSafeSquare(r, c, gameState.boardSize)) return false;

  const currentPlayerId = gameState.currentPlayerId;
  const players = gameState.players;

  for (const player of players) {
    if (player.id === currentPlayerId) continue;
    
    const piecesAtLoc = player.pieces.filter(p => {
      if (p.status !== PieceStatus.ACTIVE) return false;
      const paths = getPaths(gameState.boardSize);
      const pos = paths[player.id][p.pathIndex];
      return pos.r === r && pos.c === c;
    });

    if (piecesAtLoc.length >= 2) return true; 
  }
  return false;
};

export const canMovePiece = (
  gameState: GameState, 
  piece: Piece, 
  steps: number
): boolean => {
  const player = gameState.players[piece.owner];

  // 1. Check Entry Condition
  if (piece.status === PieceStatus.HOME) {
    if (gameState.boardSize === 5) {
      // Classic Ashta Chamma (4 shells): 4 and 8 enter
      return steps === 4 || steps === 8;
    } else {
      // Baara Katta (6 shells): 6 and 12 enter
      return steps === 6 || steps === 12;
    }
  }

  if (piece.status === PieceStatus.FINISHED) return false;

  const currentPathIndex = piece.pathIndex;
  const targetPathIndex = currentPathIndex + steps;
  const paths = getPaths(gameState.boardSize);
  const path = paths[piece.owner];

  // 2. Check Finish Condition
  if (targetPathIndex >= path.length) {
    if (targetPathIndex === path.length - 1) return true;
    return false; // Overshot
  }

  // 3. Check Inner Circle Gating
  const innerStartIndex = getInnerCircleStartIndex(gameState.boardSize);
  if (targetPathIndex >= innerStartIndex && currentPathIndex < innerStartIndex) {
    if (!player.hasKilled) return false; // Must kill to enter
  }

  // 4. Check Blockade (Gatti) for 5x5
  if (gameState.boardSize === 5) {
    for (let i = currentPathIndex + 1; i <= targetPathIndex; i++) {
      const pos = path[i];
      if (isGattiBlocked(gameState, pos.r, pos.c)) {
        return false;
      }
    }
  }

  return true;
};

export const movePiece = (
  gameState: GameState,
  pieceIndex: number,
  steps: number
): GameState => {
  const newState = JSON.parse(JSON.stringify(gameState)) as GameState;
  const currentPlayer = newState.players[newState.currentPlayerId];
  const piece = currentPlayer.pieces[pieceIndex];
  const paths = getPaths(newState.boardSize);
  const path = paths[currentPlayer.id];

  // Execute Move
  if (piece.status === PieceStatus.HOME) {
    piece.status = PieceStatus.ACTIVE;
    piece.pathIndex = 0;
  } else {
    piece.pathIndex += steps;
  }

  // Check Finish
  if (piece.pathIndex === path.length - 1) {
    piece.status = PieceStatus.FINISHED;
    if (currentPlayer.pieces.every(p => p.status === PieceStatus.FINISHED)) {
      newState.winner = currentPlayer.id;
    }
    const diceIdx = newState.diceValues.indexOf(steps);
    if (diceIdx > -1) newState.diceValues.splice(diceIdx, 1);
    
    newState.logs.push(`${currentPlayer.name} moved to Center!`);
    return newState;
  }

  const targetCoord = path[piece.pathIndex];

  // Check Capture
  let killHappened = false;
  const isSafe = isSafeSquare(targetCoord.r, targetCoord.c, newState.boardSize);

  if (!isSafe) {
    newState.players.forEach(p => {
      if (p.id !== currentPlayer.id) {
        p.pieces.forEach(oppPiece => {
          if (oppPiece.status === PieceStatus.ACTIVE) {
            const oppPos = paths[p.id][oppPiece.pathIndex];
            if (oppPos.r === targetCoord.r && oppPos.c === targetCoord.c) {
              oppPiece.status = PieceStatus.HOME;
              oppPiece.pathIndex = -1;
              killHappened = true;
              newState.logs.push(`${currentPlayer.name} captured ${p.name}!`);
            }
          }
        });
      }
    });
  }

  if (killHappened) {
    currentPlayer.hasKilled = true;
    newState.awaitingBonusRoll = true;
    newState.logs.push(`Bonus Roll for capture!`);
  }

  const diceIdx = newState.diceValues.indexOf(steps);
  if (diceIdx > -1) newState.diceValues.splice(diceIdx, 1);

  return newState;
};

export const getMovementPreview = (
  gameState: GameState,
  piece: Piece,
  steps: number
): { targetCoords: { r: number; c: number } | null; isSafe: boolean; isCapture: boolean; isFinish: boolean; isInnerEntry: boolean } | null => {
  if (!canMovePiece(gameState, piece, steps)) return null;

  const paths = getPaths(gameState.boardSize);
  const path = paths[piece.owner];

  let targetIndex = -1;
  if (piece.status === PieceStatus.HOME) {
    targetIndex = 0;
  } else {
    targetIndex = piece.pathIndex + steps;
  }

  if (targetIndex >= path.length - 1) {
    return {
      targetCoords: path[path.length - 1],
      isSafe: true,
      isCapture: false,
      isFinish: true,
      isInnerEntry: false
    };
  }

  const targetCoords = path[targetIndex];
  const safe = isSafeSquare(targetCoords.r, targetCoords.c, gameState.boardSize);
  let capture = false;

  if (!safe) {
    gameState.players.forEach(p => {
      if (p.id !== piece.owner) {
        p.pieces.forEach(opp => {
          if (opp.status === PieceStatus.ACTIVE) {
            const oppPos = paths[p.id][opp.pathIndex];
            if (oppPos.r === targetCoords.r && oppPos.c === targetCoords.c) {
              capture = true;
            }
          }
        });
      }
    });
  }

  const innerStart = getInnerCircleStartIndex(gameState.boardSize);
  const isInnerEntry = (piece.pathIndex < innerStart) && (targetIndex >= innerStart);

  return {
    targetCoords,
    isSafe: safe,
    isCapture: capture,
    isFinish: false,
    isInnerEntry
  };
};

// BOT LOGIC (Enhanced with BotDifficulty support)

export const getBotMove = (gameState: GameState): { pieceIndex: number; diceValue: number } | null => {
  const player = gameState.players[gameState.currentPlayerId];
  const paths = getPaths(gameState.boardSize);
  const possibleMoves: { pieceIndex: number; diceValue: number; score: number }[] = [];

  const difficulty = gameState.botDifficulty || 'STRATEGIST';
  const uniqueDice = Array.from(new Set(gameState.diceValues));

  for (const die of uniqueDice) {
    player.pieces.forEach((piece, idx) => {
      if (canMovePiece(gameState, piece, die)) {
        let score = 0;

        const path = paths[player.id];
        let targetIndex = -1;

        if (piece.status === PieceStatus.HOME) {
          score += (difficulty === 'EMPEROR' ? 35 : 20);
          targetIndex = 0;
        } else {
          targetIndex = piece.pathIndex + die;
          score += targetIndex; // Progress towards center
        }

        if (targetIndex >= path.length - 1) {
          score += (difficulty === 'EMPEROR' ? 300 : 200); // Winning/Finishing
        } else {
          const targetPos = path[targetIndex];
          const isSafe = isSafeSquare(targetPos.r, targetPos.c, gameState.boardSize);

          if (isSafe) {
            score += (difficulty === 'EMPEROR' ? 45 : 30);
          } else {
            let wouldKill = false;
            gameState.players.forEach(p => {
              if (p.id !== player.id) {
                p.pieces.forEach(opp => {
                  if (opp.status === PieceStatus.ACTIVE) {
                    const oppPos = paths[p.id][opp.pathIndex];
                    if (oppPos.r === targetPos.r && oppPos.c === targetPos.c) {
                      wouldKill = true;
                    }
                  }
                });
              }
            });
            if (wouldKill) {
              score += (difficulty === 'EMPEROR' ? 180 : 100);
            }
          }

          // Inner Circle Entry Bonus
          const innerStart = getInnerCircleStartIndex(gameState.boardSize);
          if (piece.pathIndex < innerStart && targetIndex >= innerStart) {
            score += (difficulty === 'EMPEROR' ? 70 : 50);
          }

          // Escape Unsafe Square Bonus (Emperor mode)
          if (difficulty === 'EMPEROR' && piece.status === PieceStatus.ACTIVE) {
            const currentPos = path[piece.pathIndex];
            if (!isSafeSquare(currentPos.r, currentPos.c, gameState.boardSize)) {
              score += 25; // Reward escaping vulnerability
            }
          }
        }

        possibleMoves.push({ pieceIndex: idx, diceValue: die, score });
      }
    });
  }

  if (possibleMoves.length === 0) return null;

  if (difficulty === 'NOVICE') {
    // 40% chance to make a purely random move instead of optimal
    if (Math.random() < 0.4) {
      const randomIndex = Math.floor(Math.random() * possibleMoves.length);
      return possibleMoves[randomIndex];
    }
  }

  possibleMoves.sort((a, b) => b.score - a.score || Math.random() - 0.5);
  return possibleMoves[0];
};