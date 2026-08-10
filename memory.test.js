const test = require('node:test');
const assert = require('node:assert/strict');
const { MemoryGame, MEMORY_SIZES } = require('./memory.js');
const { MemoryUI } = require('./memory-app.js');

test('uses the selected number of paired cards', () => { const game=new MemoryGame(20, () => .5); assert.equal(game.cards.length,20); assert.deepEqual([...new Set(game.cards.map(card=>card.animal))].length,10); });
test('keeps matching cards face up and counts one move', () => { const game=new MemoryGame(12); game.cards=game.cards.map((card,index)=>({ ...card, animal:Math.floor(index/2) })); game.flip(0); const result=game.flip(1); assert.equal(result.pair,true); assert.equal(game.cards[0].matched,true); assert.equal(game.open.length,0); assert.equal(game.moves,1); });
test('hides a non-matching pair', () => { const game=new MemoryGame(12); game.cards=game.cards.map((card,index)=>({ ...card, animal:index })); game.flip(0); assert.equal(game.flip(1).pair,false); game.hideOpen(); assert.equal(game.open.length,0); });
test('restores a valid saved game', () => { const game=new MemoryGame(16), restored=new MemoryGame(12); assert.equal(restored.deserialize(game.serialize()),true); assert.equal(restored.size,16); });
test('an obsolete mismatch timeout cannot change a restarted round', () => {
  const scheduled=[]; const timers={ setTimeout(callback) { scheduled.push(callback); return scheduled.length - 1; }, clearTimeout() {} };
  const ui=Object.create(MemoryUI.prototype); ui.game=new MemoryGame(12); ui.timerApi=timers; ui.mismatchTimer=null; ui.roundGeneration=0; ui.waiting=true; ui.feedback=''; ui.save=()=>{}; ui.render=()=>{};
  ui.game.cards=ui.game.cards.map((card,index)=>({ ...card, animal:index })); ui.game.flip(0); ui.game.flip(1); ui.scheduleMismatchHide();
  ui.startRound(20); scheduled[0]();
  assert.equal(ui.game.size,20); assert.equal(ui.game.open.length,0); assert.equal(ui.waiting,false);
});
test('a saved mismatched pair is hidden by a newly scheduled timeout', () => {
  const source=new MemoryGame(12); source.cards=source.cards.map((card,index)=>({ ...card, animal:index })); source.flip(0); source.flip(1);
  const scheduled=[]; const timers={ setTimeout(callback) { scheduled.push(callback); return scheduled.length - 1; }, clearTimeout() {} };
  const ui=Object.create(MemoryUI.prototype); ui.game=new MemoryGame(12); ui.timerApi=timers; ui.mismatchTimer=null; ui.roundGeneration=0; ui.waiting=false; ui.feedback=''; ui.save=()=>{}; ui.render=()=>{};
  const storage={ getItem:()=>source.serialize(), removeItem:()=>{} }; const previous=global.localStorage; global.localStorage=storage;
  try { ui.load(); scheduled[0](); assert.equal(ui.game.open.length,0); assert.equal(ui.waiting,false); } finally { global.localStorage=previous; }
});
