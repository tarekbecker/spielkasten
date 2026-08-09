class MemoryUI {
  constructor() { this.game = new MemoryGame(); this.waiting = false; this.load(); this.bind(); this.render(); }
  bind() {
    document.getElementById('card-count').value = this.game.size;
    document.getElementById('card-count').onchange = event => { this.game.restart(+event.target.value); this.waiting=false; this.save(); this.render(); };
    document.getElementById('new-game').onclick = () => { this.game.restart(this.game.size); this.waiting=false; this.save(); this.render(); };
    document.getElementById('board').onclick = event => this.pick(+event.target.closest('[data-card]')?.dataset.card);
  }
  pick(index) {
    if (this.waiting || !Number.isInteger(index)) return;
    const result=this.game.flip(index); if (!result.changed) return;
    this.save(); this.render();
    if (result.pair === false) { this.waiting=true; setTimeout(() => { this.game.hideOpen(); this.waiting=false; this.save(); this.render(); }, 750); }
  }
  save() { try { localStorage.setItem('memory-game', this.game.serialize()); } catch {} }
  load() { try { const saved=localStorage.getItem('memory-game'); if (saved && !this.game.deserialize(saved)) localStorage.removeItem('memory-game'); } catch {} }
  render() {
    const board=document.getElementById('board'); board.dataset.size=this.game.size;
    board.innerHTML=this.game.cards.map((card,index) => { const face=card.matched || this.game.open.includes(index); const col=card.animal%4, row=Math.floor(card.animal/4); return `<button class="memory-card ${face?'face-up':''} ${card.matched?'matched':''}" data-card="${index}" aria-label="Karte ${index+1}"><span class="card-inner"><span class="card-back">🐾</span><span class="animal" style="--x:${col*100/3}%;--y:${row*100/2}%"></span></span></button>`; }).join('');
    document.getElementById('moves').textContent=this.game.moves;
    document.getElementById('message').textContent=this.game.finished ? `Geschafft! ${this.game.moves} Versuche. 🎉` : this.waiting ? 'Gut merken …' : 'Finde die gleichen Tiere!';
  }
}
if (typeof document !== 'undefined') document.addEventListener('DOMContentLoaded', () => new MemoryUI());
