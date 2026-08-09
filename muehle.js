/**
 * Nine Men's Morris (Mühle) Game Logic
 * Pure JavaScript - No Dependencies
 */

const MUEHLE_PLAYER_WHITE = 'white';
const MUEHLE_PLAYER_BLACK = 'black';
const MUEHLE_PHASE_PLACING = 'placing';
const MUEHLE_PHASE_MOVING = 'moving';
const MUEHLE_PHASE_GAMEOVER = 'gameover';

/**
 * The Mühle board has 24 points arranged in 3 concentric squares
 * Indices 0-23 represent the points:
 * 
 *      0--------1--------2
 *      |        |        |
      3--------4--------5
      |        |        |
      6--------7--------8
 *      |   9---10---11   |
 *      |   |         |   |
 *      12-13        14-15
 *      |   |         |   |
 *      |  16---17---18   |
 *      |        |        |
 *      19-------20-------21
 *      |        |        |
 *      22-------23-------24
 * 
 * Actually correct layout:
 * Outer square: 0-1-2, 3-4-5, 6-7-8 (but that's 9 points)
 * 
 * Correct standard Mühle board:
 *      0--------1--------2
 *      |        |        |
 *      3--------4--------5
 *      |        |        |
 *      6--------7--------8
 *      |  9----10----11  |
 *      |  |         |  |
 *      12-13       14-15
 *      |  |         |  |
 *      | 16----17----18 |
 *      |        |        |
 *      19-------20-------21
 *      |        |        |
 *      22-------23-------24
 * 
 * Actually the standard is 24 points (0-23):
 * Outer: 0-1-2 (top), 3-4-5 (right), 6-7-8 (bottom), 9-10-11 (left) - wait no
 * 
 * Standard Mühle board layout (24 points):
 *      0 -------- 1 -------- 2
 *      |          |          |
 *      |    3 ---- 4 ---- 5    |
 *      |    |      |      |    |
 *      |    |   6--7--8   |    |
 *      |    |   |     |   |    |
 *      9 -- 10--11    12--13--14
 *      |    |   |     |   |    |
 *      |    |  15-16-17   |    |
 *      |    |      |      |    |
 *      |   18 ----19---- 20   |
 *      |          |          |
 *      21--------22---------23
 */

// Adjacency list - which points are connected
const MUEHLE_ADJACENCY = {
  0: [1, 9],
  1: [0, 2, 4],
  2: [1, 14],
  3: [4, 10],
  4: [1, 3, 5, 7],
  5: [4, 13],
  6: [7, 11],
  7: [4, 6, 8],
  8: [7, 12],
  9: [0, 10, 21],
  10: [3, 9, 11, 18],
  11: [6, 10, 15],
  12: [8, 13, 17],
  13: [5, 12, 14, 20],
  14: [2, 13, 23],
  15: [11, 16],
  16: [15, 17, 19],
  17: [12, 16],
  18: [10, 19],
  19: [16, 18, 20, 22],
  20: [13, 19],
  21: [9, 22],
  22: [19, 21, 23],
  23: [14, 22]
};

// All possible mills (3 points in a row)
const MUEHLE_MILLS = [
  // Outer square horizontal
  [0, 1, 2],
  [21, 22, 23],
  // Outer square vertical
  [0, 9, 21],
  [2, 14, 23],
  // Middle square horizontal
  [3, 4, 5],
  [18, 19, 20],
  // Middle square vertical
  [3, 10, 18],
  [5, 13, 20],
  // Inner square horizontal
  [6, 7, 8],
  [15, 16, 17],
  // Inner square vertical
  [6, 11, 15],
  [8, 12, 17],
  // Lines connecting the three squares
  [1, 4, 7],
  [12, 13, 14],
  [16, 19, 22],
  [9, 10, 11]
];

class MuehleGame {
  constructor() {
    this.board = Array(24).fill(null); // 24 points, null = empty, 'white'/'black' = occupied
    this.currentPlayer = MUEHLE_PLAYER_WHITE;
    this.phase = MUEHLE_PHASE_PLACING; // 'placing', 'moving', 'gameover'
    this.whiteStonesToPlace = 9;
    this.blackStonesToPlace = 9;
    this.whiteStonesOnBoard = 0;
    this.blackStonesOnBoard = 0;
    this.selectedPoint = null;
    this.removingStone = false; // true when a mill was formed and player must remove opponent stone
    this.winner = null;
    this.gameOver = false;
    this.moveHistory = [];
    this.positionCounts = {};
    this.movesWithoutCapture = 0;
  }

  // Get piece at a point
  getPiece(point) {
    if (point < 0 || point > 23) return null;
    return this.board[point];
  }

  // Check if point is empty
  isEmpty(point) {
    return this.board[point] === null;
  }

  // Get all empty points
  getEmptyPoints() {
    const empty = [];
    for (let i = 0; i < 24; i++) {
      if (this.board[i] === null) {
        empty.push(i);
      }
    }
    return empty;
  }

  // Get all points occupied by a player
  getPlayerPoints(player) {
    const points = [];
    for (let i = 0; i < 24; i++) {
      if (this.board[i] === player) {
        points.push(i);
      }
    }
    return points;
  }

  // Get adjacent points
  getAdjacent(point) {
    return MUEHLE_ADJACENCY[point] || [];
  }

  // Check if three points form a mill
  isMill(p1, p2, p3) {
    return MUEHLE_MILLS.some(mill => 
      mill.includes(p1) && mill.includes(p2) && mill.includes(p3)
    );
  }

  // Check if a specific point is part of a mill
  isPartOfMill(point) {
    const player = this.board[point];
    if (!player) return false;

    // Find all mills that include this point
    for (const mill of MUEHLE_MILLS) {
      if (mill.includes(point)) {
        // Check if all three points in this mill belong to the same player
        const [a, b, c] = mill;
        if (this.board[a] === player && this.board[b] === player && this.board[c] === player) {
          return true;
        }
      }
    }
    return false;
  }

  // Count mills for a player
  countMills(player) {
    let count = 0;
    for (const mill of MUEHLE_MILLS) {
      const [a, b, c] = mill;
      if (this.board[a] === player && this.board[b] === player && this.board[c] === player) {
        count++;
      }
    }
    return count;
  }

  // Get valid moves for placing phase
  getValidPlacingMoves() {
    if (this.phase !== MUEHLE_PHASE_PLACING || this.removingStone) {
      return [];
    }

    const stonesToPlace = this.currentPlayer === MUEHLE_PLAYER_WHITE 
      ? this.whiteStonesToPlace 
      : this.blackStonesToPlace;

    if (stonesToPlace <= 0) {
      return [];
    }

    return this.getEmptyPoints();
  }

  // Get valid moves for moving phase (from a specific point)
  getValidMovingMoves(fromPoint) {
    if (this.phase !== MUEHLE_PHASE_MOVING || this.removingStone) {
      return [];
    }

    if (this.board[fromPoint] !== this.currentPlayer) {
      return [];
    }

    const playerStones = this.currentPlayer === MUEHLE_PLAYER_WHITE 
      ? this.whiteStonesOnBoard 
      : this.blackStonesOnBoard;

    const validMoves = [];

    // If player has only 3 stones, they can "fly" to any empty point
    if (playerStones === 3) {
      return this.getEmptyPoints();
    }

    // Otherwise, can only move to adjacent empty points
    const adjacent = this.getAdjacent(fromPoint);
    for (const point of adjacent) {
      if (this.isEmpty(point)) {
        validMoves.push(point);
      }
    }

    return validMoves;
  }

  // Get all valid moves for current player
  getAllValidMoves() {
    if (this.phase === MUEHLE_PHASE_PLACING) {
      return this.getValidPlacingMoves().map(p => ({ type: 'place', to: p }));
    }

    if (this.phase === MUEHLE_PHASE_MOVING) {
      const moves = [];
      const playerPoints = this.getPlayerPoints(this.currentPlayer);
      
      for (const from of playerPoints) {
        const destinations = this.getValidMovingMoves(from);
        for (const to of destinations) {
          moves.push({ type: 'move', from, to });
        }
      }
      return moves;
    }

    return [];
  }

  // Get removable opponent stones (prefer non-mill stones)
  getRemovableStones() {
    const opponent = this.currentPlayer === MUEHLE_PLAYER_WHITE 
      ? MUEHLE_PLAYER_BLACK 
      : MUEHLE_PLAYER_WHITE;

    const opponentPoints = this.getPlayerPoints(opponent);
    const removable = [];
    const inMill = [];

    for (const point of opponentPoints) {
      if (this.isPartOfMill(point)) {
        inMill.push(point);
      } else {
        removable.push(point);
      }
    }

    // If all opponent stones are in mills, allow removing any
    if (removable.length === 0 && inMill.length > 0) {
      return inMill;
    }

    return removable;
  }

  // Place a stone during placing phase
  placeStone(point) {
    if (this.gameOver) {
      return { success: false, error: 'Game is over' };
    }
    if (this.phase !== MUEHLE_PHASE_PLACING) {
      return { success: false, error: 'Not in placing phase' };
    }

    if (this.removingStone) {
      return { success: false, error: 'Must remove opponent stone first' };
    }

    if (!this.isEmpty(point)) {
      return { success: false, error: 'Point is not empty' };
    }

    const stonesToPlace = this.currentPlayer === MUEHLE_PLAYER_WHITE 
      ? this.whiteStonesToPlace 
      : this.blackStonesToPlace;

    if (stonesToPlace <= 0) {
      return { success: false, error: 'No stones left to place' };
    }

    // Place the stone
    this.board[point] = this.currentPlayer;

    // Update counts
    if (this.currentPlayer === MUEHLE_PLAYER_WHITE) {
      this.whiteStonesToPlace--;
      this.whiteStonesOnBoard++;
    } else {
      this.blackStonesToPlace--;
      this.blackStonesOnBoard++;
    }

    // Record move
    this.moveHistory.push({
      player: this.currentPlayer,
      type: 'place',
      point: point
    });

    // Check for mill
    if (this.isPartOfMill(point)) {
      const opponent = this.currentPlayer === MUEHLE_PLAYER_WHITE 
        ? MUEHLE_PLAYER_BLACK 
        : MUEHLE_PLAYER_WHITE;
      const opponentStones = this.getPlayerPoints(opponent);
      
      if (opponentStones.length > 0) {
        this.removingStone = true;
        return { success: true, millFormed: true };
      }
    }

    // Check if placing phase is over
    if (this.whiteStonesToPlace === 0 && this.blackStonesToPlace === 0) {
      this.phase = MUEHLE_PHASE_MOVING;
    }

    // Switch player
    this.switchPlayer();

    // Check for game end
    this.checkGameEnd();
    this.recordPosition();

    return { success: true, millFormed: false };
  }

  // Move a stone during moving phase
  moveStone(from, to) {
    if (this.gameOver) {
      return { success: false, error: 'Game is over' };
    }
    if (this.phase !== MUEHLE_PHASE_MOVING) {
      return { success: false, error: 'Not in moving phase' };
    }

    if (this.removingStone) {
      return { success: false, error: 'Must remove opponent stone first' };
    }

    if (this.board[from] !== this.currentPlayer) {
      return { success: false, error: 'No own stone at source point' };
    }

    if (!this.isEmpty(to)) {
      return { success: false, error: 'Destination is not empty' };
    }

    const playerStones = this.currentPlayer === MUEHLE_PLAYER_WHITE 
      ? this.whiteStonesOnBoard 
      : this.blackStonesOnBoard;

    // Check if move is valid (adjacent or flying with 3 stones)
    const isFlying = playerStones === 3;
    const adjacent = this.getAdjacent(from);

    if (!isFlying && !adjacent.includes(to)) {
      return { success: false, error: 'Can only move to adjacent points' };
    }

    // Execute move
    this.board[to] = this.currentPlayer;
    this.board[from] = null;

    // Record move
    this.moveHistory.push({
      player: this.currentPlayer,
      type: 'move',
      from: from,
      to: to
    });

    // Check for mill
    if (this.isPartOfMill(to)) {
      const opponent = this.currentPlayer === MUEHLE_PLAYER_WHITE 
        ? MUEHLE_PLAYER_BLACK 
        : MUEHLE_PLAYER_WHITE;
      const opponentStones = this.getPlayerPoints(opponent);
      
      if (opponentStones.length > 0) {
        this.removingStone = true;
        return { success: true, millFormed: true };
      }
    }

    // Switch player
    this.switchPlayer();

    this.movesWithoutCapture++;

    // Check for game end
    this.checkGameEnd();
    this.recordPosition();

    return { success: true, millFormed: false };
  }

  // Remove an opponent stone
  removeStone(point) {
    if (this.gameOver) {
      return { success: false, error: 'Game is over' };
    }
    if (!this.removingStone) {
      return { success: false, error: 'Not in removal phase' };
    }

    const opponent = this.currentPlayer === MUEHLE_PLAYER_WHITE 
      ? MUEHLE_PLAYER_BLACK 
      : MUEHLE_PLAYER_WHITE;

    if (this.board[point] !== opponent) {
      return { success: false, error: 'No opponent stone at point' };
    }

    // Check if stone is removable (not in mill, or all in mill)
    const removable = this.getRemovableStones();
    if (!removable.includes(point)) {
      return { success: false, error: 'Cannot remove stone from mill when other stones available' };
    }

    // Remove the stone
    this.board[point] = null;

    if (opponent === MUEHLE_PLAYER_WHITE) {
      this.whiteStonesOnBoard--;
    } else {
      this.blackStonesOnBoard--;
    }

    // Record removal
    this.moveHistory.push({
      player: this.currentPlayer,
      type: 'remove',
      point: point
    });

    // End removal phase
    this.removingStone = false;

    // Check if placing phase should transition to moving
    if (this.phase === MUEHLE_PHASE_PLACING && 
        this.whiteStonesToPlace === 0 && 
        this.blackStonesToPlace === 0) {
      this.phase = MUEHLE_PHASE_MOVING;
    }

    // Switch player
    this.switchPlayer();

    this.movesWithoutCapture = 0;

    // Check for game end
    this.checkGameEnd();
    this.recordPosition();

    return { success: true };
  }

  // Switch current player
  switchPlayer() {
    this.currentPlayer = this.currentPlayer === MUEHLE_PLAYER_WHITE 
      ? MUEHLE_PLAYER_BLACK 
      : MUEHLE_PLAYER_WHITE;
  }

  // Check if game has ended
  checkGameEnd() {
    // Win condition 1: Player has fewer than 3 stones
    if (this.phase === MUEHLE_PHASE_MOVING) {
      if (this.whiteStonesOnBoard < 3 && this.whiteStonesToPlace === 0) {
        this.gameOver = true;
        this.winner = MUEHLE_PLAYER_BLACK;
        this.phase = MUEHLE_PHASE_GAMEOVER;
        return;
      }
      if (this.blackStonesOnBoard < 3 && this.blackStonesToPlace === 0) {
        this.gameOver = true;
        this.winner = MUEHLE_PLAYER_WHITE;
        this.phase = MUEHLE_PHASE_GAMEOVER;
        return;
      }
    }

    // Win condition 2: Player has no legal moves
    if (this.phase === MUEHLE_PHASE_MOVING) {
      const currentMoves = this.getAllValidMoves();
      if (currentMoves.length === 0) {
        this.gameOver = true;
        this.winner = this.currentPlayer === MUEHLE_PLAYER_WHITE 
          ? MUEHLE_PLAYER_BLACK 
          : MUEHLE_PLAYER_WHITE;
        this.phase = MUEHLE_PHASE_GAMEOVER;
        return;
      }
    }
  }

  positionKey() {
    return `${this.board.map(stone => stone || '-').join(',')}|${this.currentPlayer}|${this.phase}`;
  }

  // House rule: a position occurring three times, or 50 moves without a
  // capture, ends the game in a draw. This prevents endless back-and-forth.
  recordPosition() {
    if (this.gameOver || this.removingStone || this.phase !== MUEHLE_PHASE_MOVING) return;

    const key = this.positionKey();
    this.positionCounts[key] = (this.positionCounts[key] || 0) + 1;
    if (this.positionCounts[key] >= 3 || this.movesWithoutCapture >= 50) {
      this.gameOver = true;
      this.winner = null;
      this.phase = MUEHLE_PHASE_GAMEOVER;
    }
  }

  // Restart the game
  restart() {
    this.board = Array(24).fill(null);
    this.currentPlayer = MUEHLE_PLAYER_WHITE;
    this.phase = MUEHLE_PHASE_PLACING;
    this.whiteStonesToPlace = 9;
    this.blackStonesToPlace = 9;
    this.whiteStonesOnBoard = 0;
    this.blackStonesOnBoard = 0;
    this.selectedPoint = null;
    this.removingStone = false;
    this.winner = null;
    this.gameOver = false;
    this.moveHistory = [];
    this.positionCounts = {};
    this.movesWithoutCapture = 0;
  }

  // Serialize game state
  serialize() {
    return JSON.stringify({
      board: this.board,
      currentPlayer: this.currentPlayer,
      phase: this.phase,
      whiteStonesToPlace: this.whiteStonesToPlace,
      blackStonesToPlace: this.blackStonesToPlace,
      whiteStonesOnBoard: this.whiteStonesOnBoard,
      blackStonesOnBoard: this.blackStonesOnBoard,
      removingStone: this.removingStone,
      winner: this.winner,
      gameOver: this.gameOver,
      moveHistory: this.moveHistory,
      positionCounts: this.positionCounts,
      movesWithoutCapture: this.movesWithoutCapture
    });
  }

  // Deserialize game state
  deserialize(data) {
    try {
      const state = JSON.parse(data);
      const validPlayers = [MUEHLE_PLAYER_WHITE, MUEHLE_PLAYER_BLACK];
      const validBoard = Array.isArray(state.board) && state.board.length === 24 &&
        state.board.every(stone => stone === null || validPlayers.includes(stone));
      const validPhase = [MUEHLE_PHASE_PLACING, MUEHLE_PHASE_MOVING, MUEHLE_PHASE_GAMEOVER].includes(state.phase);
      if (!validBoard || !validPlayers.includes(state.currentPlayer) || !validPhase) return false;

      this.board = state.board;
      this.currentPlayer = state.currentPlayer;
      this.phase = state.phase;
      this.whiteStonesToPlace = state.whiteStonesToPlace;
      this.blackStonesToPlace = state.blackStonesToPlace;
      this.whiteStonesOnBoard = state.whiteStonesOnBoard;
      this.blackStonesOnBoard = state.blackStonesOnBoard;
      if (![this.whiteStonesToPlace, this.blackStonesToPlace, this.whiteStonesOnBoard, this.blackStonesOnBoard]
        .every(Number.isInteger)) return false;
      this.removingStone = Boolean(state.removingStone);
      this.winner = state.winner === null || validPlayers.includes(state.winner) ? state.winner : null;
      this.gameOver = Boolean(state.gameOver);
      this.moveHistory = state.moveHistory || [];
      this.positionCounts = state.positionCounts && typeof state.positionCounts === 'object' ? state.positionCounts : {};
      this.movesWithoutCapture = Number.isInteger(state.movesWithoutCapture) ? state.movesWithoutCapture : 0;
      this.selectedPoint = null;
      this.restoreMissedRemoval();
      return true;
    } catch (e) {
      console.error('Failed to deserialize:', e);
      return false;
    }
  }

  // Versions before the connecting mills were added could switch the turn
  // instead of asking to remove a stone. Repair that saved game on load.
  restoreMissedRemoval() {
    if (this.gameOver || this.removingStone) return false;

    const lastMove = this.moveHistory.at(-1);
    if (!lastMove || !['place', 'move'].includes(lastMove.type)) return false;

    const completedPoint = lastMove.type === 'place' ? lastMove.point : lastMove.to;
    if (this.board[completedPoint] !== lastMove.player || !this.isPartOfMill(completedPoint)) {
      return false;
    }

    const opponent = lastMove.player === MUEHLE_PLAYER_WHITE
      ? MUEHLE_PLAYER_BLACK
      : MUEHLE_PLAYER_WHITE;
    if (this.getPlayerPoints(opponent).length === 0) return false;

    this.currentPlayer = lastMove.player;
    this.removingStone = true;
    return true;
  }

  // Get game status for display
  getStatus() {
    if (this.gameOver) {
      return {
        phase: 'gameover',
        message: this.winner ? (this.winner === MUEHLE_PLAYER_WHITE ? 'Weiß gewinnt!' : 'Schwarz gewinnt!') : 'Unentschieden!',
        winner: this.winner
      };
    }

    if (this.removingStone) {
      return {
        phase: 'removing',
        message: this.currentPlayer === MUEHLE_PLAYER_WHITE 
          ? 'Weiß: Entferne einen schwarzen Stein!' 
          : 'Schwarz: Entferne einen weißen Stein!',
        player: this.currentPlayer
      };
    }

    if (this.phase === MUEHLE_PHASE_PLACING) {
      const stonesToPlace = this.currentPlayer === MUEHLE_PLAYER_WHITE 
        ? this.whiteStonesToPlace 
        : this.blackStonesToPlace;
      return {
        phase: 'placing',
        message: `${this.currentPlayer === MUEHLE_PLAYER_WHITE ? 'Weiß' : 'Schwarz'}: Setze einen Stein (${stonesToPlace} übrig)`,
        player: this.currentPlayer,
        stonesRemaining: stonesToPlace
      };
    }

    if (this.phase === MUEHLE_PHASE_MOVING) {
      const playerStones = this.currentPlayer === MUEHLE_PLAYER_WHITE 
        ? this.whiteStonesOnBoard 
        : this.blackStonesOnBoard;
      const canFly = playerStones === 3;
      return {
        phase: 'moving',
        message: `${this.currentPlayer === MUEHLE_PLAYER_WHITE ? 'Weiß' : 'Schwarz'}: ${canFly ? 'Fliege' : 'Bewege'} einen Stein`,
        player: this.currentPlayer,
        canFly: canFly
      };
    }

    return { phase: 'unknown', message: 'Unbekannt', player: this.currentPlayer };
  }
}

// Export for Node.js testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    MuehleGame,
    MUEHLE_PLAYER_WHITE,
    MUEHLE_PLAYER_BLACK,
    MUEHLE_PHASE_PLACING,
    MUEHLE_PHASE_MOVING,
    MUEHLE_PHASE_GAMEOVER,
    MUEHLE_ADJACENCY,
    MUEHLE_MILLS
  };
}
