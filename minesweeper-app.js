const MINESWEEPER_LEVELS = {
  easy: { label: '🌱 Einfach', rows: 9, cols: 9, mines: 10 },
  medium: { label: '🎯 Mittel', rows: 12, cols: 12, mines: 25 },
  hard: { label: '🔥 Schwer', rows: 16, cols: 16, mines: 45 }
};

class MinesweeperUI {
  constructor() {
    this.game = new MinesweeperGame();
    this.level = 'easy';
    this.elapsed = 0;
    this.startedAt = null;
    this.timer = setInterval(() => this.renderTimer(), 500);
    this.load();
    this.bind();
    this.render();
  }

  bind() {
    document.getElementById('difficulty').addEventListener('change', event => this.restart(event.target.value));
    document.getElementById('new-game').onclick = () => this.restart(this.level);
    const board = document.getElementById('board');
    board.addEventListener('click', event => {
      const button = event.target.closest('[data-r]');
      if (!button) return;
      const wasFirstMove = this.game.firstMove;
      if (this.game.reveal(+button.dataset.r, +button.dataset.c)) {
        if (wasFirstMove) this.startedAt = Date.now();
        this.finishIfNeeded();
        this.save();
        this.render();
      }
    });
    board.addEventListener('contextmenu', event => {
      const button = event.target.closest('[data-r]');
      if (button) {
        event.preventDefault();
        if (this.game.toggleFlag(+button.dataset.r, +button.dataset.c)) { this.save(); this.render(); }
      }
    });
    board.addEventListener('touchstart', event => {
      const button = event.target.closest('[data-r]');
      if (!button) return;
      this.hold = setTimeout(() => {
        if (this.game.toggleFlag(+button.dataset.r, +button.dataset.c)) { this.save(); this.render(); }
        this.hold = null;
      }, 500);
    }, { passive: true });
    ['touchend', 'touchmove', 'touchcancel'].forEach(type => board.addEventListener(type, () => {
      if (this.hold) clearTimeout(this.hold);
      this.hold = null;
    }, { passive: true }));
  }

  restart(level) {
    this.level = MINESWEEPER_LEVELS[level] ? level : 'easy';
    const config = MINESWEEPER_LEVELS[this.level];
    this.game.restart(config.rows, config.cols, config.mines);
    this.elapsed = 0;
    this.startedAt = null;
    this.save();
    this.render();
  }

  seconds() { return this.elapsed + (this.startedAt ? Math.floor((Date.now() - this.startedAt) / 1000) : 0); }
  renderTimer() { const el = document.getElementById('time'); if (el) el.textContent = `${this.seconds()} s`; }

  finishIfNeeded() {
    if (!this.game.gameOver || !this.startedAt) return;
    this.elapsed = this.seconds();
    this.startedAt = null;
    if (this.game.won) {
      const key = `minesweeper-best-${this.level}`;
      const best = Number(localStorage.getItem(key) || 0);
      if (!best || this.elapsed < best) localStorage.setItem(key, String(this.elapsed));
    }
  }

  save() {
    try {
      localStorage.setItem('minesweeper-game', this.game.serialize());
      localStorage.setItem('minesweeper-meta', JSON.stringify({ level: this.level, elapsed: this.seconds() }));
    } catch {}
  }

  load() {
    try {
      const meta = JSON.parse(localStorage.getItem('minesweeper-meta') || '{}');
      this.level = MINESWEEPER_LEVELS[meta.level] ? meta.level : 'easy';
      this.elapsed = Number.isInteger(meta.elapsed) && meta.elapsed >= 0 ? meta.elapsed : 0;
      const saved = localStorage.getItem('minesweeper-game');
      if (!saved || !this.game.deserialize(saved)) this.restart(this.level);
      if (!this.game.firstMove && !this.game.gameOver) this.startedAt = Date.now();
    } catch { this.restart('easy'); }
  }

  render() {
    document.getElementById('difficulty').value = this.level;
    const board = document.getElementById('board');
    board.style.setProperty('--cols', this.game.cols);
    board.innerHTML = this.game.board.flatMap((row, r) => row.map((cell, c) => {
      const exposed = cell.revealed || (this.game.gameOver && cell.mine);
      const text = exposed ? (cell.mine ? '💣' : cell.adjacent || '') : (cell.flagged ? '🚩' : '');
      return `<button class="cell ${exposed ? 'revealed' : ''} ${cell.mine && exposed ? 'mine' : ''} n${cell.adjacent}" data-r="${r}" data-c="${c}" aria-label="Feld ${r + 1}, ${c + 1}">${text}</button>`;
    })).join('');
    document.getElementById('mines').textContent = Math.max(0, this.game.mines - this.game.flagCount());
    document.getElementById('time').textContent = `${this.seconds()} s`;
    const best = Number(localStorage.getItem(`minesweeper-best-${this.level}`) || 0);
    document.getElementById('best').textContent = best ? `${best} s` : '–';
    document.getElementById('message').textContent = this.game.won ? '🎉 Alles sicher geräumt!' : this.game.gameOver ? '💥 Boom! Noch einmal?' : 'Tippen zum Aufdecken · lange drücken für Flagge.';
  }
}

if (typeof document !== 'undefined') document.addEventListener('DOMContentLoaded', () => new MinesweeperUI());
