class Game2048UI {
  constructor() { this.game = new Game2048(); this.best = Number(localStorage.getItem('2048-best') || 0); this.load(); this.bind(); this.render(); }
  bind() {
    document.getElementById('new-game').onclick = () => { this.game.restart(); this.save(); this.render(); };
    document.addEventListener('keydown', event => { const map = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' }; if (map[event.key]) { event.preventDefault(); this.play(map[event.key]); } });
    let start; document.getElementById('board').addEventListener('touchstart', event => { const touch = event.changedTouches[0]; start = { x: touch.clientX, y: touch.clientY }; }, { passive: true }); document.getElementById('board').addEventListener('touchend', event => { if (!start) return; const touch = event.changedTouches[0], x = touch.clientX - start.x, y = touch.clientY - start.y; if (Math.max(Math.abs(x), Math.abs(y)) < 25) return; this.play(Math.abs(x) > Math.abs(y) ? (x > 0 ? 'right' : 'left') : (y > 0 ? 'down' : 'up')); }, { passive: true });
  }
  play(direction) { if (this.game.move(direction)) { this.best = Math.max(this.best, this.game.score); this.save(); this.render(); } else if (this.game.gameOver) this.render(); }
  save() { try { localStorage.setItem('2048-game', this.game.serialize()); localStorage.setItem('2048-best', String(this.best)); } catch {} }
  load() { try { const saved = localStorage.getItem('2048-game'); if (saved && !this.game.deserialize(saved)) localStorage.removeItem('2048-game'); } catch {} }
  render() { document.getElementById('score').textContent = this.game.score; document.getElementById('best').textContent = this.best; const board = document.getElementById('board'); board.innerHTML = this.game.board.flatMap(row => row.map(value => `<div class="tile tile-${value || 'empty'}">${value || ''}</div>`)).join(''); document.getElementById('message').textContent = this.game.gameOver ? 'Keine Züge mehr – noch eine Runde?' : this.game.won ? '🎉 2048 geschafft! Weiter spielen?' : 'Wische oder nutze die Pfeiltasten.'; }
}
if (typeof document !== 'undefined') document.addEventListener('DOMContentLoaded', () => new Game2048UI());
