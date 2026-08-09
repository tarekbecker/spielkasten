const test = require('node:test');
const assert = require('node:assert/strict');
Object.assign(global, require('./muehle.js'));
const { MuehleUI } = require('./muehle-app.js');

for (const level of ['medium', 'hard']) test(`${level} AI blocks an immediate opponent mill during the placing phase`, () => {
  global.document = { getElementById: () => ({ value: level }) };
  const ui = Object.create(MuehleUI.prototype);
  ui.computerPlayer = MUEHLE_PLAYER_BLACK;
  ui.game = new MuehleGame();
  // White threatens 15-16-17. Black must occupy 17 now.
  ui.game.board[15] = MUEHLE_PLAYER_WHITE;
  ui.game.board[16] = MUEHLE_PLAYER_WHITE;
  ui.game.board[11] = MUEHLE_PLAYER_BLACK;
  ui.game.board[20] = MUEHLE_PLAYER_BLACK;
  ui.game.whiteStonesOnBoard = ui.game.blackStonesOnBoard = 2;
  ui.game.whiteStonesToPlace = ui.game.blackStonesToPlace = 7;
  ui.game.currentPlayer = MUEHLE_PLAYER_BLACK;

  assert.deepEqual(ui.chooseComputerAction(), { type: 'place', to: 17 });
});
