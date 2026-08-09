const test = require('node:test');
const assert = require('node:assert/strict');
const { MemoryGame, MEMORY_SIZES } = require('./memory.js');

test('uses the selected number of paired cards', () => { const game=new MemoryGame(20, () => .5); assert.equal(game.cards.length,20); assert.deepEqual([...new Set(game.cards.map(card=>card.animal))].length,10); });
test('keeps matching cards face up and counts one move', () => { const game=new MemoryGame(12); game.cards=game.cards.map((card,index)=>({ ...card, animal:Math.floor(index/2) })); game.flip(0); const result=game.flip(1); assert.equal(result.pair,true); assert.equal(game.cards[0].matched,true); assert.equal(game.open.length,0); assert.equal(game.moves,1); });
test('hides a non-matching pair', () => { const game=new MemoryGame(12); game.cards=game.cards.map((card,index)=>({ ...card, animal:index })); game.flip(0); assert.equal(game.flip(1).pair,false); game.hideOpen(); assert.equal(game.open.length,0); });
test('restores a valid saved game', () => { const game=new MemoryGame(16), restored=new MemoryGame(12); assert.equal(restored.deserialize(game.serialize()),true); assert.equal(restored.size,16); });
