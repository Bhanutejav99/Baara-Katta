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

  // 3. Check Inner Circle Gating (Must have killed to enter inner circle)
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

// CHECK WINNER INCLUDING SUDDEN LOCKOUT VICTORY RULE
export const checkWinner = (gameState: GameState): { winnerId: PlayerId | null; isLockout: boolean } => {
  if (gameState.winner !== null) return { winnerId: gameState.winner, isLockout: false };

  const innerStartIndex = getInnerCircleStartIndex(gameState.boardSize);

  // 1. Standard Victory Check: All pieces reached center goal
  for (const p of gameState.players) {
    if (p.pieces && p.pieces.length > 0 && p.pieces.every(piece => piece.status === PieceStatus.FINISHED)) {
      return { winnerId: p.id, isLockout: false };
    }
  }

  // 2. Traditional Lockout Victory Check:
  // If player P has ALL pawns inside the inner circle (pathIndex >= innerStartIndex) or finished,
  // AND opponent OPP has hasKilled === false with NO target pawns outside the inner circle to capture,
  // OPP is permanently locked out from ever entering -> Player P wins immediately!
  for (const p of gameState.players) {
    if (!p.pieces || p.pieces.length === 0) continue;

    const allInInnerOrFinished = p.pieces.every(piece => 
      piece.status === PieceStatus.FINISHED || (piece.status === PieceStatus.ACTIVE && piece.pathIndex >= innerStartIndex)
    );

    if (allInInnerOrFinished) {
      const unpassOpponents = gameState.players.filter(opp => opp.id !== p.id && !opp.hasKilled);
      
      if (unpassOpponents.length > 0) {
        // Are there any opponent targets outside the inner circle for unpassOpponents to capture?
        const existsCapturableOuterTarget = gameState.players.some(targetPlayer => {
          if (targetPlayer.id === p.id) return false; // p's pieces are all inside inner circle
          return targetPlayer.pieces.some(piece => 
            piece.status === PieceStatus.ACTIVE && piece.pathIndex < innerStartIndex
          );
        });

        if (!existsCapturableOuterTarget) {
          return { winnerId: p.id, isLockout: true };
        }
      }
    }
  }

  return { winnerId: null, isLockout: false };
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
    newState.logs.push(`${currentPlayer.name} moved to Center!`);
  } else {
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
  }

  const diceIdx = newState.diceValues.indexOf(steps);
  if (diceIdx > -1) newState.diceValues.splice(diceIdx, 1);

  // Evaluate Victory (Standard or Lockout Victory)
  const winCheck = checkWinner(newState);
  if (winCheck.winnerId !== null) {
    newState.winner = winCheck.winnerId;
    const winnerPlayer = newState.players[winCheck.winnerId];
    if (winCheck.isLockout) {
      newState.logs.push(`👑 ${winnerPlayer.name} achieved Lockout Victory! Opponent has no pass to enter inner circle.`);
    } else {
      newState.logs.push(`🏆 ${winnerPlayer.name} HAS WON THE GAME!`);
    }
  }

  return newState;
};

export const getMovementPreview = (
  gameState: GameState,
  piece: Piece,
  steps: number
): { targetCoords: { r: number; c: number } | null; isSafe: boolean; isCapture: boolean; isFinish: boolean } | null => {
  if (!canMovePiece(gameState, piece, steps)) return null;

  const paths = getPaths(gameState.boardSize);
  const path = paths[piece.owner];

  let targetIndex = 0;
  if (piece.status === PieceStatus.HOME) {
    targetIndex = 0;
  } else {
    targetIndex = piece.pathIndex + steps;
  }

  if (targetIndex >= path.length) return null;

  const targetCoords = path[targetIndex];
  const isSafe = isSafeSquare(targetCoords.r, targetCoords.c, gameState.boardSize);
  const isFinish = targetIndex === path.length - 1;

  let isCapture = false;
  if (!isSafe && !isFinish) {
    isCapture = gameState.players.some(p => 
      p.id !== piece.owner &&
      p.pieces.some(opp => {
        if (opp.status !== PieceStatus.ACTIVE) return false;
        const oppPos = paths[p.id][opp.pathIndex];
        return oppPos.r === targetCoords.r && oppPos.c === targetCoords.c;
      })
    );
  }

  return { targetCoords, isSafe, isCapture, isFinish };
};

export const getBotMove = (gameState: GameState): { pieceIndex: number; diceValue: number } | null => {
  const currentPlayer = gameState.players[gameState.currentPlayerId];
  if (!currentPlayer || !currentPlayer.isBot || gameState.diceValues.length === 0) return null;

  const validMoves: { pieceIndex: number; diceValue: number; score: number }[] = [];

  currentPlayer.pieces.forEach((piece, pieceIndex) => {
    gameState.diceValues.forEach(diceValue => {
      if (canMovePiece(gameState, piece, diceValue)) {
        const preview = getMovementPreview(gameState, piece, diceValue);
        let score = 10; // Base score

        if (preview) {
          if (preview.isCapture) score += 100; // Prioritize captures
          if (preview.isFinish) score += 80;  // Prioritize reaching center
          if (preview.isSafe) score += 30;    // Prefer safe squares
        }

        validMoves.push({ pieceIndex, diceValue, score });
      }
    });
  });

  if (validMoves.length === 0) return null;

  // Sort by score descending
  validMoves.sort((a, b) => b.score - a.score);

  if (gameState.botDifficulty === 'NOVICE') {
    const randomIdx = Math.floor(Math.random() * validMoves.length);
    return validMoves[randomIdx];
  }

  return validMoves[0];
};