export enum PlayerId {
  P1 = 0, // Red (Bottom)
  P2 = 1, // Green (Right)
  P3 = 2, // Yellow (Top)
  P4 = 3, // Blue (Left)
}

export enum PieceStatus {
  HOME = 'HOME',     // Not on board yet
  ACTIVE = 'ACTIVE', // On the board
  FINISHED = 'FINISHED' // Reached center
}

export enum GameMode {
  PASS_N_PLAY = 'PASS_N_PLAY',
  VS_COMPUTER = 'VS_COMPUTER',
  ONLINE_FRIENDS = 'ONLINE_FRIENDS',
  ONLINE_RANDOM = 'ONLINE_RANDOM'
}

export interface Coords {
  r: number;
  c: number;
}

export interface Piece {
  id: number; // 0-3
  owner: PlayerId;
  status: PieceStatus;
  pathIndex: number; // -1 if HOME, 0-N if ACTIVE
}

export interface Player {
  id: PlayerId;
  name: string;
  color: string;
  pieces: Piece[];
  hasKilled: boolean; // Required to enter inner circle
  isBot: boolean;
}

export interface GameState {
  boardSize: 5 | 7;
  players: Player[];
  currentPlayerId: PlayerId;
  diceValues: number[]; // Array of rolled values available to use (e.g. [4, 1])
  isRolling: boolean;
  winner: PlayerId | null;
  logs: string[];
  lastDiceFace: number | null; // For visual representation
  awaitingBonusRoll: boolean; // True if player gets an extra roll (e.g. after killing)
  gameMode: GameMode;
}
