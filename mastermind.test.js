const test = require('node:test');
const assert = require('node:assert/strict');
const { scoreGuess, MastermindGame } = require('./mastermind.js');

test('scores exact and misplaced colors', () => {
  assert.deepEqual(scoreGuess(['red', 'blue', 'green', 'yellow'], ['red', 'green', 'blue', 'orange']), { exact: 1, colorOnly: 2 });
});
test('does not count duplicate guesses twice', () => {
  assert.deepEqual(scoreGuess(['red', 'blue', 'green', 'yellow'], ['blue', 'blue', 'blue', 'blue']), { exact: 1, colorOnly: 0 });
});
test('wins after four exact colors', () => {
  const game = new MastermindGame(() => 0); game.current = ['red', 'red', 'red', 'red'];
  assert.deepEqual(game.submitGuess(), { exact: 4, colorOnly: 0 }); assert.equal(game.won, true); assert.equal(game.gameOver, true);
});
test('uses a selectable attempt limit', () => { const game = new MastermindGame(); assert.equal(game.setMaxGuesses(15), true); assert.equal(game.maxGuesses, 15); assert.equal(game.setMaxGuesses(12), false); });
