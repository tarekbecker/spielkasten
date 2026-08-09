const MEMORY_ANIMALS = 12;
const MEMORY_SIZES = [12, 16, 20];

class MemoryGame {
  constructor(size = 16, random = Math.random) { this.random = random; this.restart(size); }
  restart(size = this.size || 16) {
    this.size = MEMORY_SIZES.includes(+size) ? +size : 16;
    const animals = Array.from({ length: this.size / 2 }, (_, index) => index);
    this.cards = [...animals, ...animals].sort(() => this.random() - .5).map((animal, index) => ({ id: index, animal, matched: false }));
    this.open = []; this.moves = 0; this.finished = false;
  }
  flip(index) {
    const card = this.cards[index];
    if (this.finished || !card || card.matched || this.open.includes(index) || this.open.length === 2) return { changed: false };
    this.open.push(index);
    if (this.open.length < 2) return { changed: true, pair: null };
    this.moves++;
    const [first, second] = this.open;
    const pair = this.cards[first].animal === this.cards[second].animal;
    if (pair) { this.cards[first].matched = this.cards[second].matched = true; this.open = []; this.finished = this.cards.every(item => item.matched); }
    return { changed: true, pair };
  }
  hideOpen() { if (this.open.length === 2) this.open = []; }
  serialize() { return JSON.stringify({ size:this.size, cards:this.cards, open:this.open, moves:this.moves, finished:this.finished }); }
  deserialize(value) {
    try {
      const state = JSON.parse(value);
      if (!MEMORY_SIZES.includes(state.size) || !Array.isArray(state.cards) || state.cards.length !== state.size || !state.cards.every((card, i) => Number.isInteger(card.animal) && card.animal >= 0 && card.animal < MEMORY_ANIMALS && card.id === i && typeof card.matched === 'boolean') || !Array.isArray(state.open) || !state.open.every(i => Number.isInteger(i) && i >= 0 && i < state.size) || state.open.length > 2 || !Number.isInteger(state.moves) || state.moves < 0) return false;
      this.size=state.size; this.cards=state.cards; this.open=state.open; this.moves=state.moves; this.finished=Boolean(state.finished); return true;
    } catch { return false; }
  }
}

if (typeof module !== 'undefined' && module.exports) module.exports = { MemoryGame, MEMORY_SIZES };
