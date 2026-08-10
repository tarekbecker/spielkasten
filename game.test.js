/**
 * Test Suite for German Draughts Game Logic
 * Uses Node.js built-in test runner (>=18)
 */

const { describe, it } = require('node:test');
const assert = require('node:assert');
const { DraughtsGame, PLAYER_WHITE, PLAYER_BLACK, PIECE_MAN, PIECE_KING } = require('./game.js');

describe('DraughtsGame - Initialization', () => {
  it('should create an 8x8 board', () => {
    const game = new DraughtsGame();
    assert.strictEqual(game.board.length, 8);
    game.board.forEach(row => {
      assert.strictEqual(row.length, 8);
    });
  });

  it('should place 12 black pieces on rows 0-2', () => {
    const game = new DraughtsGame();
    let blackCount = 0;
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = game.getPiece(row, col);
        if (piece && piece.player === PLAYER_BLACK) {
          blackCount++;
          assert.strictEqual(piece.type, PIECE_MAN);
        }
      }
    }
    assert.strictEqual(blackCount, 12);
  });

  it('should place 12 white pieces on rows 5-7', () => {
    const game = new DraughtsGame();
    let whiteCount = 0;
    for (let row = 5; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = game.getPiece(row, col);
        if (piece && piece.player === PLAYER_WHITE) {
          whiteCount++;
          assert.strictEqual(piece.type, PIECE_MAN);
        }
      }
    }
    assert.strictEqual(whiteCount, 12);
  });

  it('should place pieces only on dark squares', () => {
    const game = new DraughtsGame();
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = game.getPiece(row, col);
        if (piece) {
          assert.strictEqual((row + col) % 2, 1, `Piece at ${row},${col} should be on dark square`);
        }
      }
    }
  });

  it('should start with white player', () => {
    const game = new DraughtsGame();
    assert.strictEqual(game.currentPlayer, PLAYER_WHITE);
  });
});

describe('DraughtsGame - Basic Movement', () => {
  it('should allow white to move forward diagonally', () => {
    const game = new DraughtsGame();
    // White piece at (5, 0) can move to (4, 1)
    const moves = game.getValidMoves(5, 0);
    assert.ok(moves.length > 0);
    assert.ok(moves.some(m => m.toRow === 4 && m.toCol === 1));
  });

  it('should allow black to move forward diagonally', () => {
    const game = new DraughtsGame();
    game.currentPlayer = PLAYER_BLACK;
    // Black piece at (2, 1) can move to (3, 0) or (3, 2)
    const moves = game.getValidMoves(2, 1);
    assert.ok(moves.length > 0);
    assert.ok(moves.some(m => m.toRow === 3 && m.toCol === 0) || 
              moves.some(m => m.toRow === 3 && m.toCol === 2));
  });

  it('should not allow moving backward for men', () => {
    const game = new DraughtsGame();
    // White piece at (5, 0) should not be able to move to (6, 1)
    const moves = game.getValidMoves(5, 0);
    assert.ok(!moves.some(m => m.toRow === 6));
  });

  it('should not allow moving to occupied squares', () => {
    const game = new DraughtsGame();
    // Square (5, 2) is occupied by white
    const moves = game.getValidMoves(5, 0);
    assert.ok(!moves.some(m => m.toRow === 5 && m.toCol === 2));
  });
});

describe('DraughtsGame - Capturing', () => {
  it('should detect simple capture opportunities', () => {
    const game = new DraughtsGame();
    // Clear the board and set up a capture scenario
    game.board = Array(8).fill(null).map(() => Array(8).fill(null));
    game.board[4][3] = { player: PLAYER_WHITE, type: PIECE_MAN };
    game.board[3][4] = { player: PLAYER_BLACK, type: PIECE_MAN };
    
    const captures = game.getAllCaptures();
    assert.ok(captures.length > 0);
    assert.ok(captures.some(c => c.toRow === 2 && c.toCol === 5));
  });

  it('should allow men to capture backwards', () => {
    const game = new DraughtsGame();
    game.board = Array(8).fill(null).map(() => Array(8).fill(null));
    game.board[4][3] = { player: PLAYER_WHITE, type: PIECE_MAN };
    game.board[5][2] = { player: PLAYER_BLACK, type: PIECE_MAN };

    const moves = game.getValidMoves(4, 3);
    assert.ok(moves.some(move => move.toRow === 6 && move.toCol === 1 && move.captures.length === 1));
  });

  it('should make captures mandatory', () => {
    const game = new DraughtsGame();
    // Set up a board where white must capture
    game.board = Array(8).fill(null).map(() => Array(8).fill(null));
    game.board[4][3] = { player: PLAYER_WHITE, type: PIECE_MAN };
    game.board[3][4] = { player: PLAYER_BLACK, type: PIECE_MAN };
    game.currentPlayer = PLAYER_WHITE;
    
    const moves = game.getValidMoves(4, 3);
    // Should only show capture moves when captures are available
    assert.ok(moves.length > 0);
    assert.ok(moves.every(m => m.captures.length > 0));
  });

  it('should remove captured pieces', () => {
    const game = new DraughtsGame();
    game.board = Array(8).fill(null).map(() => Array(8).fill(null));
    game.board[4][3] = { player: PLAYER_WHITE, type: PIECE_MAN };
    game.board[3][4] = { player: PLAYER_BLACK, type: PIECE_MAN };
    game.currentPlayer = PLAYER_WHITE;
    
    const move = { fromRow: 4, fromCol: 3, toRow: 2, toCol: 5, captures: [{ row: 3, col: 4 }] };
    game.makeMove(move);
    
    assert.strictEqual(game.getPiece(3, 4), null);
    assert.ok(game.getPiece(2, 5));
  });

  it('should force the same stone to continue a multiple capture', () => {
    const game = new DraughtsGame();
    game.board = Array(8).fill(null).map(() => Array(8).fill(null));
    game.currentPlayer = PLAYER_WHITE;
    game.board[5][0] = { player: PLAYER_WHITE, type: PIECE_MAN };
    game.board[4][1] = { player: PLAYER_BLACK, type: PIECE_MAN };
    game.board[2][3] = { player: PLAYER_BLACK, type: PIECE_MAN };
    game.board[5][4] = { player: PLAYER_WHITE, type: PIECE_MAN };
    game.board[4][5] = { player: PLAYER_BLACK, type: PIECE_MAN };

    assert.ok(game.makeMove(game.getValidMoves(5, 0).find(move => move.toRow === 3 && move.toCol === 2)));
    assert.strictEqual(game.currentPlayer, PLAYER_WHITE);
    assert.deepStrictEqual(game.getValidMoves(5, 4), []);
    assert.strictEqual(game.makeMove({ fromRow: 5, fromCol: 4, toRow: 3, toCol: 6, captures: [{ row: 4, col: 5 }] }), false);
    assert.ok(game.makeMove(game.getValidMoves(3, 2).find(move => move.toRow === 1 && move.toCol === 4)));
    assert.strictEqual(game.currentPlayer, PLAYER_BLACK);
  });
});

describe('DraughtsGame - King Promotion', () => {
  it('should promote white man to king on row 0', () => {
    const game = new DraughtsGame();
    game.board = Array(8).fill(null).map(() => Array(8).fill(null));
    game.board[1][2] = { player: PLAYER_WHITE, type: PIECE_MAN };
    game.currentPlayer = PLAYER_WHITE;
    
    const move = { fromRow: 1, fromCol: 2, toRow: 0, toCol: 1, captures: [] };
    game.makeMove(move);
    
    const piece = game.getPiece(0, 1);
    assert.ok(piece);
    assert.strictEqual(piece.type, PIECE_KING);
  });

  it('should promote black man to king on row 7', () => {
    const game = new DraughtsGame();
    game.board = Array(8).fill(null).map(() => Array(8).fill(null));
    game.board[6][1] = { player: PLAYER_BLACK, type: PIECE_MAN };
    game.currentPlayer = PLAYER_BLACK;
    
    const move = { fromRow: 6, fromCol: 1, toRow: 7, toCol: 0, captures: [] };
    game.makeMove(move);
    
    const piece = game.getPiece(7, 0);
    assert.ok(piece);
    assert.strictEqual(piece.type, PIECE_KING);
  });
});

describe('DraughtsGame - King Movement', () => {
  it('should allow king to move forward and backward', () => {
    const game = new DraughtsGame();
    game.board = Array(8).fill(null).map(() => Array(8).fill(null));
    game.board[4][4] = { player: PLAYER_WHITE, type: PIECE_KING };
    game.currentPlayer = PLAYER_WHITE;
    
    const moves = game.getValidMoves(4, 4);
    
    // King should be able to move in all 4 diagonal directions
    assert.ok(moves.some(m => m.toRow === 3 && m.toCol === 3));
    assert.ok(moves.some(m => m.toRow === 3 && m.toCol === 5));
    assert.ok(moves.some(m => m.toRow === 5 && m.toCol === 3));
    assert.ok(moves.some(m => m.toRow === 5 && m.toCol === 5));
  });

  it('should allow king to move multiple squares', () => {
    const game = new DraughtsGame();
    game.board = Array(8).fill(null).map(() => Array(8).fill(null));
    game.board[4][4] = { player: PLAYER_WHITE, type: PIECE_KING };
    game.currentPlayer = PLAYER_WHITE;
    
    const moves = game.getValidMoves(4, 4);
    
    // King should be able to move more than 1 square
    assert.ok(moves.some(m => m.toRow === 0 && m.toCol === 0));
    assert.ok(moves.some(m => m.toRow === 7 && m.toCol === 7));
  });
});

describe('DraughtsGame - Game End', () => {
  it('should detect win when opponent has no pieces', () => {
    const game = new DraughtsGame();
    game.board = Array(8).fill(null).map(() => Array(8).fill(null));
    game.board[0][1] = { player: PLAYER_WHITE, type: PIECE_MAN };
    game.currentPlayer = PLAYER_BLACK;
    
    game.checkGameEnd();
    
    assert.strictEqual(game.gameOver, true);
    assert.strictEqual(game.winner, PLAYER_WHITE);
  });

  it('should detect stalemate when player has no valid moves', () => {
    const game = new DraughtsGame();
    game.board = Array(8).fill(null).map(() => Array(8).fill(null));
    // Create true stalemate: white piece blocked with no captures possible
    // White at (5,0) can move to (4,1) or be blocked
    game.board[5][0] = { player: PLAYER_WHITE, type: PIECE_MAN };
    game.board[4][1] = { player: PLAYER_BLACK, type: PIECE_MAN }; // Blocks movement
    game.board[3][2] = { player: PLAYER_BLACK, type: PIECE_MAN }; // Blocks capture landing
    game.currentPlayer = PLAYER_WHITE;
    
    game.checkGameEnd();
    
    assert.strictEqual(game.gameOver, true);
    assert.strictEqual(game.winner, PLAYER_BLACK);
  });
});

describe('DraughtsGame - Serialization', () => {
  it('should serialize and deserialize game state', () => {
    const game = new DraughtsGame();
    // Make a move
    game.board = Array(8).fill(null).map(() => Array(8).fill(null));
    game.board[4][3] = { player: PLAYER_WHITE, type: PIECE_MAN };
    game.currentPlayer = PLAYER_BLACK;
    
    const serialized = game.serialize();
    
    const newGame = new DraughtsGame();
    newGame.deserialize(serialized);
    
    assert.deepStrictEqual(newGame.board, game.board);
    assert.strictEqual(newGame.currentPlayer, game.currentPlayer);
  });

  it('should reject invalid saved game data', () => {
    const game = new DraughtsGame();
    assert.strictEqual(game.deserialize('{"board":[]}'), false);
  });

  it('restores a forced multiple capture and rejects forged continuations', () => {
    const game = new DraughtsGame();
    game.board = Array(8).fill(null).map(() => Array(8).fill(null));
    game.currentPlayer = PLAYER_WHITE;
    game.board[5][0] = { player: PLAYER_WHITE, type: PIECE_MAN };
    game.board[4][1] = { player: PLAYER_BLACK, type: PIECE_MAN };
    game.board[2][3] = { player: PLAYER_BLACK, type: PIECE_MAN };
    assert.ok(game.makeMove(game.getValidMoves(5, 0).find(move => move.toRow === 3 && move.toCol === 2)));

    const restored = new DraughtsGame();
    assert.equal(restored.deserialize(game.serialize()), true);
    assert.deepEqual(restored.selectedPiece, { row: 3, col: 2 });
    assert.deepEqual(restored.getValidMoves(3, 2), game.capturesInProgress);
    assert.equal(restored.makeMove(restored.getValidMoves(3, 2)[0]), true);

    const forged = JSON.parse(game.serialize());
    forged.capturesInProgress[0].toCol = 0;
    assert.equal(new DraughtsGame().deserialize(JSON.stringify(forged)), false);
  });
});

describe('DraughtsGame - Undo', () => {
  it('should restore the position before the last move', () => {
    const game = new DraughtsGame();
    const move = game.getValidMoves(5, 0).find(candidate => candidate.toRow === 4 && candidate.toCol === 1);
    assert.ok(game.makeMove(move));
    assert.ok(game.undoLastMove());
    assert.strictEqual(game.getPiece(5, 0).player, PLAYER_WHITE);
    assert.strictEqual(game.getPiece(4, 1), null);
    assert.strictEqual(game.currentPlayer, PLAYER_WHITE);
  });
});

describe('DraughtsGame - Restart', () => {
  it('should reset game to initial state', () => {
    const game = new DraughtsGame();
    // Make some changes
    game.board[0][0] = null;
    game.currentPlayer = PLAYER_BLACK;
    game.gameOver = true;
    game.winner = PLAYER_WHITE;
    
    game.restart();
    
    assert.strictEqual(game.currentPlayer, PLAYER_WHITE);
    assert.strictEqual(game.gameOver, false);
    assert.strictEqual(game.winner, null);
    
    // Check pieces are back
    let blackCount = 0;
    let whiteCount = 0;
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = game.getPiece(row, col);
        if (piece) {
          if (piece.player === PLAYER_BLACK) blackCount++;
          if (piece.player === PLAYER_WHITE) whiteCount++;
        }
      }
    }
    assert.strictEqual(blackCount, 12);
    assert.strictEqual(whiteCount, 12);
  });
});

console.log('Running German Draughts Tests...\n');
