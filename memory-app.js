class MemoryUI {
  constructor(timerApi = globalThis) { this.game = new MemoryGame(); this.timerApi = timerApi; this.mismatchTimer = null; this.roundGeneration = 0; this.waiting = false; this.feedback = ''; this.load(); this.bind(); this.render(); }
  bind() {
    document.getElementById('card-count').value = this.game.size;
    document.querySelector('.bar').insertAdjacentHTML('beforeend', '<span id="pairs">🧩 Paare: 0/0</span>');
    document.getElementById('card-count').onchange = event => this.startRound(+event.target.value);
    document.getElementById('new-game').onclick = () => this.startRound(this.game.size);
    document.getElementById('board').onclick = event => this.pick(+event.target.closest('[data-card]')?.dataset.card);
  }
  pick(index) {
    if (this.waiting || !Number.isInteger(index)) return;
    const result=this.game.flip(index); if (!result.changed) return;
    this.feedback = result.pair === true ? '🎉 Paar gefunden!' : '';
    this.save(); this.render();
    if (result.pair === false) { this.waiting=true; this.scheduleMismatchHide(); }
  }
  clearMismatchTimer() { if (this.mismatchTimer !== null) this.timerApi.clearTimeout(this.mismatchTimer); this.mismatchTimer = null; }
  startRound(size) { this.clearMismatchTimer(); this.roundGeneration++; this.game.restart(size); this.waiting=false; this.feedback=''; this.save(); this.render(); }
  scheduleMismatchHide() {
    this.clearMismatchTimer();
    const generation = this.roundGeneration;
    this.mismatchTimer = this.timerApi.setTimeout(() => {
      if (generation !== this.roundGeneration) return;
      this.mismatchTimer = null; this.game.hideOpen(); this.waiting=false; this.feedback=''; this.save(); this.render();
    }, 750);
  }
  save() { try { localStorage.setItem('memory-game', this.game.serialize()); } catch {} }
  load() { try { const saved=localStorage.getItem('memory-game'); if (saved && !this.game.deserialize(saved)) localStorage.removeItem('memory-game'); else if (this.game.open.length === 2) { this.waiting=true; this.scheduleMismatchHide(); } } catch {} }
  render() {
    const board=document.getElementById('board'); board.dataset.size=this.game.size;
    board.innerHTML=this.game.cards.map((card,index) => { const face=card.matched || this.game.open.includes(index); const col=card.animal%4, row=Math.floor(card.animal/4); return `<button class="memory-card ${face?'face-up':''} ${card.matched?'matched':''}" data-card="${index}" aria-label="Karte ${index+1}"><span class="card-inner"><span class="card-back">🐾</span><span class="animal" style="--x:${col*100/3}%;--y:${row*100/2}%"></span></span></button>`; }).join('');
    document.getElementById('moves').textContent=this.game.moves;
    const pairs=this.game.cards.filter(card=>card.matched).length/2;
    document.getElementById('pairs').textContent=`🧩 Paare: ${pairs}/${this.game.size/2}`;
    document.getElementById('new-game').textContent=this.game.finished ? '🔄 Revanche' : '🔄 Neu';
    document.getElementById('message').textContent=this.game.finished ? `Geschafft! ${this.game.moves} Versuche. 🎉` : this.waiting ? 'Gut merken …' : this.feedback || 'Finde die gleichen Tiere!';
  }
}
if (typeof module !== 'undefined' && module.exports) module.exports = { MemoryUI };
if (typeof document !== 'undefined') document.addEventListener('DOMContentLoaded', () => new MemoryUI());
