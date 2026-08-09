const assert = require('assert');
const { SudokuGame } = require('./sudoku.js');

for (const difficulty of Object.keys(SudokuGame.clues)) {
  const game = new SudokuGame(difficulty);
  assert.strictEqual(game.difficulty, difficulty);
  assert.strictEqual(game.solution.length, 81);
  assert.strictEqual(new Set(game.solution.slice(0, 9)).size, 9);
  assert.strictEqual(game.countSolutions(game.puzzle.slice()), 1, `${difficulty} must have one solution`);
  // Uniqueness comes first: depending on the random layout, a generator may
  // retain a few extra clues rather than risk a second valid solution.
  assert.ok(game.puzzle.filter(Boolean).length <= SudokuGame.clues[difficulty] + 3);
}
const game = new SudokuGame('leicht');
const editable = game.puzzle.findIndex(value => value === 0);
assert.ok(game.setCell(editable, game.solution[editable]));
assert.strictEqual(game.board[editable], game.solution[editable]);
const state = game.serialize();
assert.ok(new SudokuGame().deserialize(state));
assert.strictEqual(new SudokuGame().deserialize('{bad json}'), false);
console.log('Sudoku tests passed');
