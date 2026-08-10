const test = require('node:test'); const assert = require('node:assert/strict'); const { MinesweeperGame } = require('./minesweeper.js');
test('first revealed square is always safe', () => { const game = new MinesweeperGame(3, 3, 1, () => 0); game.reveal(0, 0); assert.equal(game.board[0][0].mine, false); assert.equal(game.won, true); });
test('first revealed square and its neighbors are mine-free', () => { const game = new MinesweeperGame(9, 9, 10, () => 0); game.reveal(4, 4); assert.equal(game.board[4][4].mine, false); for (const [r, c] of game.neighbors(4, 4)) assert.equal(game.board[r][c].mine, false); });
test('revealing empty field spreads to neighbors', () => { const game = new MinesweeperGame(3, 3, 1); game.board.flat().forEach(cell => { cell.mine = false; }); game.board[2][2].mine = true; game.countAdjacent(); game.reveal(0, 0); assert.equal(game.board[0][0].revealed, true); assert.equal(game.board[1][1].revealed, true); });
test('a flag can be toggled', () => { const game = new MinesweeperGame(); assert.equal(game.toggleFlag(0, 0), true); assert.equal(game.board[0][0].flagged, true); assert.equal(game.toggleFlag(0, 0), true); assert.equal(game.board[0][0].flagged, false); });
test('a flagged square does not consume the safe first reveal', () => {
  const game = new MinesweeperGame(3, 3, 1, () => 0);
  assert.equal(game.toggleFlag(0, 0), true);
  assert.equal(game.reveal(0, 0), false);
  assert.equal(game.firstMove, true);
  assert.equal(game.toggleFlag(0, 0), true);
  assert.equal(game.reveal(0, 0), true);
  assert.equal(game.board[0][0].mine, false);
  assert.equal(game.gameOver, true);
  assert.equal(game.won, true);
});
