/**
 * German Draughts (Dame) Game Logic
 * Pure JavaScript - No Dependencies
 */

const PLAYER_WHITE = 'white';
const PLAYER_BLACK = 'black';
const PIECE_MAN = 'man';
const PIECE_KING = 'king';

class DraughtsGame {
  constructor() {
    this.board = [];
    this.currentPlayer = PLAYER_WHITE;
    this.selectedPiece = null;
    this.validMoves = [];
    this.capturesInProgress = [];
    this.gameOver = false;
    this.winner = null;
    this.moveHistory = [];
    this.undoStack = [];
    this.initializeBoard();
  }

  initializeBoard() {
    this.board = Array(8).fill(null).map(() => Array(8).fill(null));
    
    // Place black pieces (rows 0-2)
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 8; col++) {
        if ((row + col) % 2 === 1) {
          this.board[row][col] = { player: PLAYER_BLACK, type: PIECE_MAN };
        }
      }
    }
    
    // Place white pieces (rows 5-7)
    for (let row = 5; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if ((row + col) % 2 === 1) {
          this.board[row][col] = { player: PLAYER_WHITE, type: PIECE_MAN };
        }
      }
    }
  }

  getPiece(row, col) {
    if (row < 0 || row > 7 || col < 0 || col > 7) return null;
    return this.board[row][col];
  }

  isValidPosition(row, col) {
    return row >= 0 && row < 8 && col >= 0 && col < 8;
  }

  isDarkSquare(row, col) {
    return (row + col) % 2 === 1;
  }

  getAllPieces(player) {
    const pieces = [];
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = this.board[row][col];
        if (piece && piece.player === player) {
          pieces.push({ row, col, ...piece });
        }
      }
    }
    return pieces;
  }

  getValidMoves(row, col) {
    const piece = this.getPiece(row, col);
    if (!piece || piece.player !== this.currentPlayer) return [];

    // A multiple capture is one turn. The player must continue with exactly
    // the stone that made the preceding capture.
    if (this.capturesInProgress.length > 0) {
      if (!this.selectedPiece || this.selectedPiece.row !== row || this.selectedPiece.col !== col) {
        return [];
      }
      return this.capturesInProgress;
    }

    const moves = [];
    const captures = this.getAllCaptures();

    // If there are mandatory captures, only return capturing moves
    if (captures.length > 0) {
      const pieceCaptures = captures.filter(c => c.fromRow === row && c.fromCol === col);
      return pieceCaptures;
    }

    // Regular moves
    if (piece.type === PIECE_MAN) {
      const direction = piece.player === PLAYER_WHITE ? -1 : 1;
      // Forward moves
      for (const dcol of [-1, 1]) {
        const newRow = row + direction;
        const newCol = col + dcol;
        if (this.isValidPosition(newRow, newCol) && !this.getPiece(newRow, newCol)) {
          moves.push({ fromRow: row, fromCol: col, toRow: newRow, toCol: newCol, captures: [] });
        }
      }
    } else {
      // King moves - any diagonal direction
      for (const drow of [-1, 1]) {
        for (const dcol of [-1, 1]) {
          let newRow = row + drow;
          let newCol = col + dcol;
          while (this.isValidPosition(newRow, newCol)) {
            if (!this.getPiece(newRow, newCol)) {
              moves.push({ fromRow: row, fromCol: col, toRow: newRow, toCol: newCol, captures: [] });
            } else {
              break;
            }
            newRow += drow;
            newCol += dcol;
          }
        }
      }
    }

    return moves;
  }

  getPieceCaptures(row, col, board = this.board, mustCapture = false) {
    const piece = board[row][col];
    if (!piece) return [];

    const captures = [];

    if (piece.type === PIECE_MAN) {
      // Men move forwards, but in the German 8×8 variant they capture in
      // both directions.
      const directions = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
      
      for (const [drow, dcol] of directions) {
        const midRow = row + drow;
        const midCol = col + dcol;
        const newRow = row + 2 * drow;
        const newCol = col + 2 * dcol;

        if (this.isValidPosition(newRow, newCol)) {
          const midPiece = board[midRow][midCol];
          if (midPiece && midPiece.player !== piece.player && !board[newRow][newCol]) {
            captures.push({
              fromRow: row,
              fromCol: col,
              toRow: newRow,
              toCol: newCol,
              captures: [{ row: midRow, col: midCol }]
            });
          }
        }
      }
    } else {
      // King captures - can capture from any distance
      for (const drow of [-1, 1]) {
        for (const dcol of [-1, 1]) {
          let midRow = row + drow;
          let midCol = col + dcol;
          
          // Find first enemy piece
          while (this.isValidPosition(midRow, midCol)) {
            const midPiece = board[midRow][midCol];
            if (midPiece) {
              if (midPiece.player !== piece.player) {
                // Look for landing spots after capture
                let landRow = midRow + drow;
                let landCol = midCol + dcol;
                while (this.isValidPosition(landRow, landCol) && !board[landRow][landCol]) {
                  captures.push({
                    fromRow: row,
                    fromCol: col,
                    toRow: landRow,
                    toCol: landCol,
                    captures: [{ row: midRow, col: midCol }]
                  });
                  landRow += drow;
                  landCol += dcol;
                }
              }
              break;
            }
            midRow += drow;
            midCol += dcol;
          }
        }
      }
    }

    return captures;
  }

  getAllCaptures(board = this.board, player = this.currentPlayer) {
    const captures = [];
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece && piece.player === player) {
          const pieceCaptures = this.getPieceCaptures(row, col, board);
          captures.push(...pieceCaptures);
        }
      }
    }
    return captures;
  }

  findChainedCaptures(move) {
    // Simulate the move
    const testBoard = this.copyBoard();
    const piece = testBoard[move.fromRow][move.fromCol];
    testBoard[move.toRow][move.toCol] = { ...piece };
    testBoard[move.fromRow][move.fromCol] = null;
    
    // Remove captured pieces
    for (const cap of move.captures) {
      testBoard[cap.row][cap.col] = null;
    }

    // Check for more captures from new position
    const chained = this.getPieceCaptures(move.toRow, move.toCol, testBoard);
    
    if (chained.length === 0) {
      return [move];
    }

    const allChains = [];
    for (const nextMove of chained) {
      const combinedMove = {
        fromRow: move.fromRow,
        fromCol: move.fromCol,
        toRow: nextMove.toRow,
        toCol: nextMove.toCol,
        captures: [...move.captures, ...nextMove.captures]
      };
      const chains = this.findChainedCaptures(combinedMove);
      allChains.push(...chains);
    }

    return allChains.length > 0 ? allChains : [move];
  }

  copyBoard() {
    return this.board.map(row => row.map(cell => cell ? { ...cell } : null));
  }

  makeMove(move) {
    const piece = this.board[move.fromRow][move.fromCol];
    if (!piece) return false;

    // Check if move is valid
    const validMoves = this.getValidMoves(move.fromRow, move.fromCol);
    const validMove = validMoves.find(m =>
      m.toRow === move.toRow && m.toCol === move.toCol
    );

    if (!validMove) return false;

    this.undoStack.push(this.createSnapshot());

    // Execute the move
    this.board[move.toRow][move.toCol] = piece;
    this.board[move.fromRow][move.fromCol] = null;

    // Remove captured pieces
    for (const cap of validMove.captures) {
      this.board[cap.row][cap.col] = null;
    }

    // Check for promotion
    const promotionRow = piece.player === PLAYER_WHITE ? 0 : 7;
    if (validMove.toRow === promotionRow && piece.type === PIECE_MAN) {
      piece.type = PIECE_KING;
    }

    // Check for chained captures
    const captures = this.getPieceCaptures(move.toRow, move.toCol);
    if (validMove.captures.length > 0 && captures.length > 0) {
      // More captures available - continue with same player
      this.capturesInProgress = captures;
      this.selectedPiece = { row: move.toRow, col: move.toCol };
    } else {
      // Switch player
      this.capturesInProgress = [];
      this.selectedPiece = null;
      this.currentPlayer = this.currentPlayer === PLAYER_WHITE ? PLAYER_BLACK : PLAYER_WHITE;
    }

    // Record move
    this.moveHistory.push({
      player: piece.player,
      from: { row: validMove.fromRow, col: validMove.fromCol },
      to: { row: validMove.toRow, col: validMove.toCol },
      captures: validMove.captures,
      promoted: piece.type === PIECE_KING && validMove.toRow === promotionRow
    });

    // Check game end conditions
    this.checkGameEnd();

    return true;
  }

  checkGameEnd() {
    const whitePieces = this.getAllPieces(PLAYER_WHITE);
    const blackPieces = this.getAllPieces(PLAYER_BLACK);

    // No pieces left
    if (whitePieces.length === 0) {
      this.gameOver = true;
      this.winner = PLAYER_BLACK;
      return;
    }
    if (blackPieces.length === 0) {
      this.gameOver = true;
      this.winner = PLAYER_WHITE;
      return;
    }

    // Check if current player has any valid moves
    const currentPieces = this.getAllPieces(this.currentPlayer);
    let hasValidMoves = false;
    
    for (const piece of currentPieces) {
      const moves = this.getValidMoves(piece.row, piece.col);
      if (moves.length > 0) {
        hasValidMoves = true;
        break;
      }
    }

    if (!hasValidMoves) {
      this.gameOver = true;
      // Current player loses (stalemate)
      this.winner = this.currentPlayer === PLAYER_WHITE ? PLAYER_BLACK : PLAYER_WHITE;
    }
  }

  restart() {
    this.board = [];
    this.currentPlayer = PLAYER_WHITE;
    this.selectedPiece = null;
    this.validMoves = [];
    this.capturesInProgress = [];
    this.gameOver = false;
    this.winner = null;
    this.moveHistory = [];
    this.undoStack = [];
    this.initializeBoard();
  }

  createSnapshot() {
    return {
      board: this.copyBoard(),
      currentPlayer: this.currentPlayer,
      selectedPiece: this.selectedPiece ? { ...this.selectedPiece } : null,
      capturesInProgress: this.capturesInProgress.map(move => ({
        ...move,
        captures: move.captures.map(capture => ({ ...capture }))
      })),
      gameOver: this.gameOver,
      winner: this.winner,
      moveHistory: JSON.parse(JSON.stringify(this.moveHistory))
    };
  }

  undoLastMove() {
    const snapshot = this.undoStack.pop();
    if (!snapshot) return false;

    Object.assign(this, snapshot);
    this.validMoves = [];
    return true;
  }

  serialize() {
    return JSON.stringify({
      board: this.board,
      currentPlayer: this.currentPlayer,
      selectedPiece: this.selectedPiece,
      capturesInProgress: this.capturesInProgress,
      gameOver: this.gameOver,
      winner: this.winner,
      moveHistory: this.moveHistory
    });
  }

  deserialize(data) {
    try {
      const state = JSON.parse(data);
      const validPlayers = [PLAYER_WHITE, PLAYER_BLACK];
      const validBoard = Array.isArray(state.board) && state.board.length === 8 &&
        state.board.every(row => Array.isArray(row) && row.length === 8 && row.every(piece =>
          piece === null || (validPlayers.includes(piece.player) && [PIECE_MAN, PIECE_KING].includes(piece.type))
        ));

      if (!validBoard || !validPlayers.includes(state.currentPlayer)) return false;

      const pendingCaptures = state.capturesInProgress === undefined ? [] : state.capturesInProgress;
      const selectedPiece = state.selectedPiece === undefined ? null : state.selectedPiece;
      const validCoordinate = position => position && Number.isInteger(position.row) && Number.isInteger(position.col) && this.isValidPosition(position.row, position.col);
      if (!Array.isArray(pendingCaptures)) return false;
      if (pendingCaptures.length > 0) {
        if (state.gameOver || !validCoordinate(selectedPiece)) return false;
        const selected = state.board[selectedPiece.row][selectedPiece.col];
        if (!selected || selected.player !== state.currentPlayer) return false;
        const expectedCaptures = this.getPieceCaptures(selectedPiece.row, selectedPiece.col, state.board);
        const sameMoves = expectedCaptures.length === pendingCaptures.length && expectedCaptures.every(expected =>
          pendingCaptures.some(saved => JSON.stringify(saved) === JSON.stringify(expected))
        );
        if (!sameMoves) return false;
      } else if (selectedPiece !== null) return false;

      this.board = state.board;
      this.currentPlayer = state.currentPlayer;
      this.gameOver = Boolean(state.gameOver);
      this.winner = state.winner === null || validPlayers.includes(state.winner) ? state.winner : null;
      this.moveHistory = Array.isArray(state.moveHistory) ? state.moveHistory : [];
      this.selectedPiece = selectedPiece ? { ...selectedPiece } : null;
      this.validMoves = [];
      this.capturesInProgress = pendingCaptures.map(move => ({ ...move, captures: move.captures.map(capture => ({ ...capture })) }));
      this.undoStack = [];
      return true;
    } catch {
      return false;
    }
  }
}

// Export for Node.js testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    DraughtsGame,
    PLAYER_WHITE,
    PLAYER_BLACK,
    PIECE_MAN,
    PIECE_KING
  };
}
