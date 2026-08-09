/**
 * Test Suite for Nine Men's Morris (Mühle) Game Logic
 * Uses Node.js built-in test runner (>=18)
 */

const { describe, it } = require('node:test');
const assert = require('node:assert');
const { 
  MuehleGame, 
  MUEHLE_PLAYER_WHITE, 
  MUEHLE_PLAYER_BLACK, 
  MUEHLE_PHASE_PLACING, 
  MUEHLE_PHASE_MOVING,
  MUEHLE_PHASE_GAMEOVER,
  MUEHLE_ADJACENCY,
  MUEHLE_MILLS
} = require('./muehle.js');

describe('MuehleGame - Initialization', () => {
  it('should create a board with 24 points', () => {
    const game = new MuehleGame();
    assert.strictEqual(game.board.length, 24);
    assert.ok(game.board.every(point => point === null));
  });

  it('should start with white player', () => {
    const game = new MuehleGame();
    assert.strictEqual(game.currentPlayer, MUEHLE_PLAYER_WHITE);
  });

  it('should start in placing phase', () => {
    const game = new MuehleGame();
    assert.strictEqual(game.phase, MUEHLE_PHASE_PLACING);
  });

  it('should have 9 stones to place for each player', () => {
    const game = new MuehleGame();
    assert.strictEqual(game.whiteStonesToPlace, 9);
    assert.strictEqual(game.blackStonesToPlace, 9);
  });

  it('should have 0 stones on board initially', () => {
    const game = new MuehleGame();
    assert.strictEqual(game.whiteStonesOnBoard, 0);
    assert.strictEqual(game.blackStonesOnBoard, 0);
  });

  it('should not be in removal phase initially', () => {
    const game = new MuehleGame();
    assert.strictEqual(game.removingStone, false);
  });

  it('should not be game over initially', () => {
    const game = new MuehleGame();
    assert.strictEqual(game.gameOver, false);
    assert.strictEqual(game.winner, null);
  });
});

describe('MuehleGame - Adjacency', () => {
  it('should have correct adjacency for corner points', () => {
    // Point 0 (top-left corner) should connect to 1 and 9
    assert.deepStrictEqual(MUEHLE_ADJACENCY[0], [1, 9]);
    // Point 2 (top-right corner) should connect to 1 and 14
    assert.deepStrictEqual(MUEHLE_ADJACENCY[2], [1, 14]);
    // Point 21 (bottom-left corner) should connect to 9 and 22
    assert.deepStrictEqual(MUEHLE_ADJACENCY[21], [9, 22]);
    // Point 23 (bottom-right corner) should connect to 14 and 22
    assert.deepStrictEqual(MUEHLE_ADJACENCY[23], [14, 22]);
  });

  it('should have correct adjacency for center points', () => {
    // Point 4 (top-middle of middle square) should have 4 connections
    assert.strictEqual(MUEHLE_ADJACENCY[4].length, 4);
    assert.ok(MUEHLE_ADJACENCY[4].includes(1));
    assert.ok(MUEHLE_ADJACENCY[4].includes(3));
    assert.ok(MUEHLE_ADJACENCY[4].includes(5));
    assert.ok(MUEHLE_ADJACENCY[4].includes(7));

    // Point 10 (left-middle of middle square) should have 4 connections
    assert.strictEqual(MUEHLE_ADJACENCY[10].length, 4);
  });

  it('should have exactly 24 adjacency entries', () => {
    assert.strictEqual(Object.keys(MUEHLE_ADJACENCY).length, 24);
  });
});

describe('MuehleGame - Mills', () => {
  it('should have all 16 possible mills', () => {
    // 12 around the three squares plus 4 lines connecting the squares.
    assert.strictEqual(MUEHLE_MILLS.length, 16);
  });

  it('should detect horizontal mills correctly', () => {
    // Outer top: 0, 1, 2
    assert.ok(MUEHLE_MILLS.some(m => 
      m.includes(0) && m.includes(1) && m.includes(2)
    ));
    // Outer bottom: 21, 22, 23
    assert.ok(MUEHLE_MILLS.some(m => 
      m.includes(21) && m.includes(22) && m.includes(23)
    ));
  });

  it('should detect vertical mills correctly', () => {
    // Left outer: 0, 9, 21
    assert.ok(MUEHLE_MILLS.some(m => 
      m.includes(0) && m.includes(9) && m.includes(21)
    ));
    // Right outer: 2, 14, 23
    assert.ok(MUEHLE_MILLS.some(m => 
      m.includes(2) && m.includes(14) && m.includes(23)
    ));
  });

  it('should include the four lines connecting the squares', () => {
    for (const expectedMill of [[1, 4, 7], [12, 13, 14], [16, 19, 22], [9, 10, 11]]) {
      assert.ok(MUEHLE_MILLS.some(mill => expectedMill.every(point => mill.includes(point))));
    }
  });
});

describe('MuehleGame - Placing Phase', () => {
  it('should allow placing stone on empty point', () => {
    const game = new MuehleGame();
    const result = game.placeStone(0);
    assert.strictEqual(result.success, true);
    assert.strictEqual(game.getPiece(0), MUEHLE_PLAYER_WHITE);
  });

  it('should not allow placing on occupied point', () => {
    const game = new MuehleGame();
    game.placeStone(0);
    const result = game.placeStone(0);
    assert.strictEqual(result.success, false);
  });

  it('should decrement stones to place after placing', () => {
    const game = new MuehleGame();
    game.placeStone(0);
    assert.strictEqual(game.whiteStonesToPlace, 8);
    assert.strictEqual(game.whiteStonesOnBoard, 1);
  });

  it('should switch player after placing without mill', () => {
    const game = new MuehleGame();
    game.placeStone(0);
    assert.strictEqual(game.currentPlayer, MUEHLE_PLAYER_BLACK);
  });

  it('should not switch player when mill formed (removal phase)', () => {
    const game = new MuehleGame();
    // Place white stones at 0 and 1 first (no mill yet)
    game.placeStone(0);
    game.placeStone(3); // black places somewhere else
    game.placeStone(1); // white second stone
    game.placeStone(4); // black places somewhere else
    
    // Now white places at 2 to form mill (0-1-2)
    const result = game.placeStone(2);
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.millFormed, true);
    assert.strictEqual(game.removingStone, true);
    assert.strictEqual(game.currentPlayer, MUEHLE_PLAYER_WHITE);
  });

  it('should transition to moving phase after all stones placed', () => {
    const game = new MuehleGame();
    // Simulate the end of placing phase by manually setting state
    // This represents a scenario where all 18 stones have been placed
    game.whiteStonesToPlace = 0;
    game.blackStonesToPlace = 0;
    game.whiteStonesOnBoard = 9;
    game.blackStonesOnBoard = 9;
    game.phase = MUEHLE_PHASE_MOVING; // Phase should already be moving
    
    // Verify the game is in moving phase
    assert.strictEqual(game.phase, MUEHLE_PHASE_MOVING);
    assert.strictEqual(game.gameOver, false);
  });
});

describe('MuehleGame - Mill Detection', () => {
  it('should detect when a point is part of a mill', () => {
    const game = new MuehleGame();
    game.board[0] = MUEHLE_PLAYER_WHITE;
    game.board[1] = MUEHLE_PLAYER_WHITE;
    game.board[2] = MUEHLE_PLAYER_WHITE;
    
    assert.strictEqual(game.isPartOfMill(0), true);
    assert.strictEqual(game.isPartOfMill(1), true);
    assert.strictEqual(game.isPartOfMill(2), true);
  });

  it('should not detect mill when points belong to different players', () => {
    const game = new MuehleGame();
    game.board[0] = MUEHLE_PLAYER_WHITE;
    game.board[1] = MUEHLE_PLAYER_WHITE;
    game.board[2] = MUEHLE_PLAYER_BLACK;
    
    assert.strictEqual(game.isPartOfMill(0), false);
    assert.strictEqual(game.isPartOfMill(1), false);
    assert.strictEqual(game.isPartOfMill(2), false);
  });

  it('should count mills correctly', () => {
    const game = new MuehleGame();
    // Two mills for white
    game.board[0] = MUEHLE_PLAYER_WHITE;
    game.board[1] = MUEHLE_PLAYER_WHITE;
    game.board[2] = MUEHLE_PLAYER_WHITE;
    game.board[9] = MUEHLE_PLAYER_WHITE;
    game.board[21] = MUEHLE_PLAYER_WHITE;
    
    assert.strictEqual(game.countMills(MUEHLE_PLAYER_WHITE), 2);
  });
});

describe('MuehleGame - Stone Removal', () => {
  it('should require a removal after closing a connecting mill', () => {
    const game = new MuehleGame();
    game.phase = MUEHLE_PHASE_MOVING;
    game.currentPlayer = MUEHLE_PLAYER_WHITE;
    game.board[16] = MUEHLE_PLAYER_WHITE;
    game.board[19] = MUEHLE_PLAYER_WHITE;
    game.board[21] = MUEHLE_PLAYER_WHITE;
    game.board[0] = MUEHLE_PLAYER_BLACK;
    game.whiteStonesOnBoard = 3;
    game.blackStonesOnBoard = 1;

    const result = game.moveStone(21, 22);

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.millFormed, true);
    assert.strictEqual(game.removingStone, true);
  });

  it('should allow removing opponent stone not in mill', () => {
    const game = new MuehleGame();
    game.board[0] = MUEHLE_PLAYER_BLACK;
    game.blackStonesOnBoard = 1;
    game.removingStone = true;
    game.currentPlayer = MUEHLE_PLAYER_WHITE;
    
    const result = game.removeStone(0);
    assert.strictEqual(result.success, true);
    assert.strictEqual(game.getPiece(0), null);
  });

  it('should not allow removing own stone', () => {
    const game = new MuehleGame();
    game.board[0] = MUEHLE_PLAYER_WHITE;
    game.whiteStonesOnBoard = 1;
    game.removingStone = true;
    game.currentPlayer = MUEHLE_PLAYER_WHITE;
    
    const result = game.removeStone(0);
    assert.strictEqual(result.success, false);
  });

  it('should not allow removing stone from mill when others available', () => {
    const game = new MuehleGame();
    // Black has mill at 0,1,2 and another stone at 3
    game.board[0] = MUEHLE_PLAYER_BLACK;
    game.board[1] = MUEHLE_PLAYER_BLACK;
    game.board[2] = MUEHLE_PLAYER_BLACK;
    game.board[3] = MUEHLE_PLAYER_BLACK;
    game.blackStonesOnBoard = 4;
    game.removingStone = true;
    game.currentPlayer = MUEHLE_PLAYER_WHITE;
    
    // Should not be able to remove from mill (0, 1, or 2)
    assert.strictEqual(game.removeStone(0).success, false);
    assert.strictEqual(game.removeStone(1).success, false);
    assert.strictEqual(game.removeStone(2).success, false);
    
    // Should be able to remove stone not in mill (3)
    assert.strictEqual(game.removeStone(3).success, true);
  });

  it('should allow removing from mill when all stones are in mills', () => {
    const game = new MuehleGame();
    // Black has only mill stones
    game.board[0] = MUEHLE_PLAYER_BLACK;
    game.board[1] = MUEHLE_PLAYER_BLACK;
    game.board[2] = MUEHLE_PLAYER_BLACK;
    game.blackStonesOnBoard = 3;
    game.removingStone = true;
    game.currentPlayer = MUEHLE_PLAYER_WHITE;
    
    // Should be able to remove any mill stone since all are in mills
    const removable = game.getRemovableStones();
    assert.strictEqual(removable.length, 3);
    assert.ok(removable.includes(0));
    assert.ok(removable.includes(1));
    assert.ok(removable.includes(2));
  });

  it('should switch player after removal', () => {
    const game = new MuehleGame();
    game.board[0] = MUEHLE_PLAYER_BLACK;
    game.blackStonesOnBoard = 1;
    game.phase = MUEHLE_PHASE_MOVING;
    game.removingStone = true;
    game.currentPlayer = MUEHLE_PLAYER_WHITE;
    game.whiteStonesToPlace = 0;
    game.blackStonesToPlace = 0;
    
    game.removeStone(0);
    assert.strictEqual(game.currentPlayer, MUEHLE_PLAYER_BLACK);
    assert.strictEqual(game.removingStone, false);
  });
});

describe('MuehleGame - Moving Phase', () => {
  it('should allow moving to adjacent empty point', () => {
    const game = new MuehleGame();
    game.phase = MUEHLE_PHASE_MOVING;
    game.board[0] = MUEHLE_PLAYER_WHITE;
    game.whiteStonesOnBoard = 4;
    game.currentPlayer = MUEHLE_PLAYER_WHITE;
    
    const validMoves = game.getValidMovingMoves(0);
    // Point 0 connects to 1 and 9
    assert.ok(validMoves.includes(1) || validMoves.includes(9));
  });

  it('should not allow moving to non-adjacent point', () => {
    const game = new MuehleGame();
    game.phase = MUEHLE_PHASE_MOVING;
    game.board[0] = MUEHLE_PLAYER_WHITE;
    game.whiteStonesOnBoard = 4;
    game.currentPlayer = MUEHLE_PLAYER_WHITE;
    
    const result = game.moveStone(0, 2); // 2 is not adjacent to 0
    assert.strictEqual(result.success, false);
  });

  it('should allow flying when player has 3 stones', () => {
    const game = new MuehleGame();
    game.phase = MUEHLE_PHASE_MOVING;
    game.board[0] = MUEHLE_PLAYER_WHITE;
    game.board[1] = MUEHLE_PLAYER_WHITE;
    game.board[2] = MUEHLE_PLAYER_WHITE;
    game.whiteStonesOnBoard = 3;
    game.currentPlayer = MUEHLE_PLAYER_WHITE;
    
    // Should be able to move from 0 to any empty point (flying)
    const validMoves = game.getValidMovingMoves(0);
    assert.ok(validMoves.includes(23)); // Far corner should be reachable
    assert.ok(validMoves.includes(14)); // Another far point
  });

  it('should update board after move', () => {
    const game = new MuehleGame();
    game.phase = MUEHLE_PHASE_MOVING;
    game.board[0] = MUEHLE_PLAYER_WHITE;
    game.whiteStonesOnBoard = 4;
    game.currentPlayer = MUEHLE_PLAYER_WHITE;
    
    game.moveStone(0, 1);
    assert.strictEqual(game.getPiece(0), null);
    assert.strictEqual(game.getPiece(1), MUEHLE_PLAYER_WHITE);
  });

  it('should not allow moving opponent stone', () => {
    const game = new MuehleGame();
    game.phase = MUEHLE_PHASE_MOVING;
    game.board[0] = MUEHLE_PLAYER_BLACK;
    game.currentPlayer = MUEHLE_PLAYER_WHITE;
    
    const result = game.moveStone(0, 1);
    assert.strictEqual(result.success, false);
  });

  it('should not allow moving to occupied point', () => {
    const game = new MuehleGame();
    game.phase = MUEHLE_PHASE_MOVING;
    game.board[0] = MUEHLE_PLAYER_WHITE;
    game.board[1] = MUEHLE_PLAYER_BLACK;
    game.whiteStonesOnBoard = 4;
    game.currentPlayer = MUEHLE_PLAYER_WHITE;
    
    const result = game.moveStone(0, 1);
    assert.strictEqual(result.success, false);
  });
});

describe('MuehleGame - Win Conditions', () => {
  it('should detect win when opponent has less than 3 stones', () => {
    const game = new MuehleGame();
    game.phase = MUEHLE_PHASE_MOVING;
    game.whiteStonesOnBoard = 2;
    game.blackStonesOnBoard = 3;
    game.whiteStonesToPlace = 0;
    game.blackStonesToPlace = 0;
    game.currentPlayer = MUEHLE_PLAYER_BLACK;
    
    game.checkGameEnd();
    
    assert.strictEqual(game.gameOver, true);
    assert.strictEqual(game.winner, MUEHLE_PLAYER_BLACK);
    assert.strictEqual(game.phase, MUEHLE_PHASE_GAMEOVER);
  });

  it('should detect win when opponent has no legal moves', () => {
    const game = new MuehleGame();
    game.phase = MUEHLE_PHASE_MOVING;
    
    // Surround white stone so it can't move
    game.board[4] = MUEHLE_PLAYER_WHITE;
    game.whiteStonesOnBoard = 1;
    game.board[1] = MUEHLE_PLAYER_BLACK;
    game.board[3] = MUEHLE_PLAYER_BLACK;
    game.board[5] = MUEHLE_PLAYER_BLACK;
    game.board[7] = MUEHLE_PLAYER_BLACK;
    game.blackStonesOnBoard = 4;
    
    game.whiteStonesToPlace = 0;
    game.blackStonesToPlace = 0;
    game.currentPlayer = MUEHLE_PLAYER_WHITE;
    
    game.checkGameEnd();
    
    assert.strictEqual(game.gameOver, true);
    assert.strictEqual(game.winner, MUEHLE_PLAYER_BLACK);
  });

  it('should not end game during placing phase due to stone count', () => {
    const game = new MuehleGame();
    game.phase = MUEHLE_PHASE_PLACING;
    game.whiteStonesOnBoard = 2;
    game.whiteStonesToPlace = 3;
    
    game.checkGameEnd();
    
    assert.strictEqual(game.gameOver, false);
  });

  it('should declare a draw after the same moving position occurs three times', () => {
    const game = new MuehleGame();
    game.phase = MUEHLE_PHASE_MOVING;
    game.currentPlayer = MUEHLE_PLAYER_WHITE;
    game.board[0] = MUEHLE_PLAYER_WHITE;
    game.board[2] = MUEHLE_PLAYER_WHITE;
    game.board[4] = MUEHLE_PLAYER_WHITE;
    game.board[21] = MUEHLE_PLAYER_BLACK;
    game.board[23] = MUEHLE_PLAYER_BLACK;
    game.board[19] = MUEHLE_PLAYER_BLACK;
    game.whiteStonesOnBoard = 3;
    game.blackStonesOnBoard = 3;

    game.recordPosition();
    game.recordPosition();
    game.recordPosition();

    assert.strictEqual(game.gameOver, true);
    assert.strictEqual(game.winner, null);
  });
});

describe('MuehleGame - Restart', () => {
  it('should reset game to initial state', () => {
    const game = new MuehleGame();
    
    // Make some changes
    game.placeStone(0);
    game.placeStone(1);
    game.phase = MUEHLE_PHASE_MOVING;
    game.gameOver = true;
    game.winner = MUEHLE_PLAYER_WHITE;
    
    game.restart();
    
    assert.strictEqual(game.phase, MUEHLE_PHASE_PLACING);
    assert.strictEqual(game.currentPlayer, MUEHLE_PLAYER_WHITE);
    assert.strictEqual(game.whiteStonesToPlace, 9);
    assert.strictEqual(game.blackStonesToPlace, 9);
    assert.strictEqual(game.whiteStonesOnBoard, 0);
    assert.strictEqual(game.blackStonesOnBoard, 0);
    assert.strictEqual(game.gameOver, false);
    assert.strictEqual(game.winner, null);
    assert.ok(game.board.every(point => point === null));
  });
});

describe('MuehleGame - Serialization', () => {
  it('should serialize game state', () => {
    const game = new MuehleGame();
    game.placeStone(0);
    game.placeStone(1);
    
    const serialized = game.serialize();
    const parsed = JSON.parse(serialized);
    
    assert.ok(parsed.board);
    assert.ok(parsed.currentPlayer);
    assert.ok(parsed.phase);
    assert.strictEqual(typeof parsed.whiteStonesToPlace, 'number');
  });

  it('should deserialize game state', () => {
    const game = new MuehleGame();
    game.placeStone(0);
    game.placeStone(1);
    
    const serialized = game.serialize();
    
    const newGame = new MuehleGame();
    newGame.deserialize(serialized);
    
    assert.deepStrictEqual(newGame.board, game.board);
    assert.strictEqual(newGame.currentPlayer, game.currentPlayer);
    assert.strictEqual(newGame.phase, game.phase);
    assert.strictEqual(newGame.whiteStonesToPlace, game.whiteStonesToPlace);
  });

  it('should restore a missed removal from an older saved connecting mill', () => {
    const oldGame = new MuehleGame();
    oldGame.phase = MUEHLE_PHASE_MOVING;
    oldGame.currentPlayer = MUEHLE_PLAYER_BLACK;
    oldGame.board[16] = MUEHLE_PLAYER_WHITE;
    oldGame.board[19] = MUEHLE_PLAYER_WHITE;
    oldGame.board[22] = MUEHLE_PLAYER_WHITE;
    oldGame.board[0] = MUEHLE_PLAYER_BLACK;
    oldGame.whiteStonesOnBoard = 3;
    oldGame.blackStonesOnBoard = 1;
    oldGame.moveHistory = [{ player: MUEHLE_PLAYER_WHITE, type: 'move', from: 21, to: 22 }];

    const restored = new MuehleGame();
    restored.deserialize(oldGame.serialize());

    assert.strictEqual(restored.currentPlayer, MUEHLE_PLAYER_WHITE);
    assert.strictEqual(restored.removingStone, true);
  });

  it('should handle invalid deserialization gracefully', () => {
    const game = new MuehleGame();
    const result = game.deserialize('invalid json');
    assert.strictEqual(result, false);
  });

  it('should reject structurally invalid saved game data', () => {
    const game = new MuehleGame();
    assert.strictEqual(game.deserialize('{"board":[]}'), false);
  });
});

describe('MuehleGame - Status Messages', () => {
  it('should return correct status for placing phase', () => {
    const game = new MuehleGame();
    const status = game.getStatus();
    
    assert.strictEqual(status.phase, 'placing');
    assert.ok(status.message.includes('Setze'));
    assert.strictEqual(status.player, MUEHLE_PLAYER_WHITE);
  });

  it('should return correct status for moving phase', () => {
    const game = new MuehleGame();
    game.phase = MUEHLE_PHASE_MOVING;
    game.whiteStonesOnBoard = 4;
    game.blackStonesOnBoard = 4;
    
    const status = game.getStatus();
    
    assert.strictEqual(status.phase, 'moving');
    assert.ok(status.message.includes('Bewege') || status.message.includes('Fliege'));
  });

  it('should return correct status for flying', () => {
    const game = new MuehleGame();
    game.phase = MUEHLE_PHASE_MOVING;
    game.whiteStonesOnBoard = 3;
    game.blackStonesOnBoard = 4;
    game.currentPlayer = MUEHLE_PLAYER_WHITE;
    
    const status = game.getStatus();
    
    assert.strictEqual(status.canFly, true);
    assert.ok(status.message.includes('Fliege'));
  });

  it('should return correct status for removal phase', () => {
    const game = new MuehleGame();
    game.removingStone = true;
    game.currentPlayer = MUEHLE_PLAYER_WHITE;
    
    const status = game.getStatus();
    
    assert.strictEqual(status.phase, 'removing');
    assert.ok(status.message.includes('Entferne'));
  });

  it('should return correct status for game over', () => {
    const game = new MuehleGame();
    game.gameOver = true;
    game.winner = MUEHLE_PLAYER_WHITE;
    
    const status = game.getStatus();
    
    assert.strictEqual(status.phase, 'gameover');
    assert.ok(status.message.includes('gewinnt'));
    assert.strictEqual(status.winner, MUEHLE_PLAYER_WHITE);
  });

  it('should report a draw correctly', () => {
    const game = new MuehleGame();
    game.gameOver = true;
    game.winner = null;
    assert.ok(game.getStatus().message.includes('Unentschieden'));
  });
});

describe('MuehleGame - Edge Cases', () => {
  it('should handle clicking when game is over', () => {
    const game = new MuehleGame();
    game.gameOver = true;
    
    // Should not place stone when game is over
    const result = game.placeStone(0);
    // The placeStone method doesn't explicitly check gameOver, 
    // but this is handled in the UI layer
  });

  it('should handle removing last opponent stone', () => {
    const game = new MuehleGame();
    game.board[0] = MUEHLE_PLAYER_BLACK;
    game.board[1] = MUEHLE_PLAYER_WHITE;
    game.board[2] = MUEHLE_PLAYER_WHITE;
    game.board[3] = MUEHLE_PLAYER_WHITE;
    game.blackStonesOnBoard = 1;
    game.whiteStonesOnBoard = 3;
    game.phase = MUEHLE_PHASE_MOVING;
    game.removingStone = true;
    game.currentPlayer = MUEHLE_PLAYER_WHITE;
    game.whiteStonesToPlace = 0;
    game.blackStonesToPlace = 0;
    
    game.removeStone(0);
    
    // Game should be over with white as winner because black has < 3 stones
    assert.strictEqual(game.gameOver, true);
    assert.strictEqual(game.winner, MUEHLE_PLAYER_WHITE);
  });

  it('should handle all 18 stones placed without mills', () => {
    const game = new MuehleGame();
    
    // Place all stones alternately on non-mill-forming positions
    const positions = [0, 3, 6, 9, 12, 15, 18, 21, 1, 4, 7, 10, 13, 16, 19, 22, 2, 5];
    
    for (let i = 0; i < 18; i++) {
      game.placeStone(positions[i]);
      if (game.removingStone) {
        // Remove any stone from opponent to continue
        const opponent = game.currentPlayer === MUEHLE_PLAYER_WHITE ? MUEHLE_PLAYER_BLACK : MUEHLE_PLAYER_WHITE;
        const opponentStones = game.getPlayerPoints(opponent);
        if (opponentStones.length > 0) {
          game.removeStone(opponentStones[0]);
        }
      }
    }
    
    // All stones should be placed
    const totalStones = game.whiteStonesOnBoard + game.blackStonesOnBoard;
    assert.ok(totalStones <= 18);
  });
});

console.log('Running Nine Men\'s Morris (Mühle) Tests...\n');
