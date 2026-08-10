class SudokuUI {
  constructor() {
    this.game = new SudokuGame();
    this.selected = null;
    this.focusValue = null;
    this.focusIndex = null;
    this.history = [];
    this.load();
    this.bind();
    this.render();
  }
  bind() {
    document.getElementById('difficulty').addEventListener('change', event => this.newGame(event.target.value));
    document.getElementById('new-game').addEventListener('click', () => this.newGame(document.getElementById('difficulty').value));
    document.getElementById('check').addEventListener('click', () => this.check());
    document.getElementById('solve').addEventListener('click', () => { if (!window.confirm('Wirklich die komplette Lösung zeigen?')) return; this.remember(); this.game.board = this.game.solution.slice(); this.render(); this.save(); this.message('Gelöst! 🥳'); });
    const controls = document.querySelector('.controls');
    controls.insertAdjacentHTML('afterbegin', '<button id="undo" class="secondary">↩️ Zurück</button><button id="hint" class="secondary">💡 Hinweis</button>');
    document.getElementById('undo').addEventListener('click', () => this.undo());
    document.getElementById('hint').addEventListener('click', () => this.hint());
    document.getElementById('keypad').addEventListener('click', event => {
      const button = event.target.closest('button[data-value]');
      if (!button || this.selected === null) return;
      this.setValue(this.selected, Number(button.dataset.value));
    });
    window.addEventListener('keydown', event => {
      if (this.selected === null) return;
      if (/^[1-9]$/.test(event.key)) this.setValue(this.selected, Number(event.key));
      if (event.key === 'Backspace' || event.key === 'Delete' || event.key === '0') this.setValue(this.selected, 0);
    });
  }
  setFocus(index, value, toggle = false) { if (!value) { this.focusValue=null; this.focusIndex=null; return; } if (toggle && this.focusValue === value) { this.focusValue=null; this.focusIndex=null; } else { this.focusValue=value; this.focusIndex=index; } }
  newGame(difficulty) { this.game.newGame(difficulty); this.selected = null; this.focusValue = null; this.focusIndex = null; this.message('Neues Sudoku – viel Spaß!'); this.render(); this.save(); }
  remember() { this.history.push({ board: this.game.board.slice(), selected: this.selected, focusValue: this.focusValue, focusIndex: this.focusIndex }); if (this.history.length > 80) this.history.shift(); }
  numberCount(value) { return this.game.board.filter(cell => cell === value).length; }
  setValue(index, value) {
    if (index === null || this.game.puzzle[index] !== 0 || this.game.board[index] === value) return;
    // A Sudoku contains each digit exactly nine times. Keep keyboard input in
    // sync with the disabled keypad, so an exhausted digit cannot be added.
    if (value && this.numberCount(value) >= 9) return;
    this.remember(); this.game.setCell(index, value); this.setFocus(index, value); this.render(); this.save();
  }
  undo() { const previous = this.history.pop(); if (!previous) return; this.game.board = previous.board; this.selected = previous.selected; this.focusValue = previous.focusValue; this.focusIndex = previous.focusIndex; this.render(); this.save(); this.message('Letzten Zug zurückgenommen.'); }
  hint() { const index = this.game.board.findIndex((value, i) => value === 0 && this.game.puzzle[i] === 0); if (index === -1) return; this.remember(); const value = this.game.solution[index]; this.game.setCell(index, value); this.selected = index; this.setFocus(index, value); this.render(); this.save(); this.message('Eine passende Zahl ist eingesetzt.'); }
  render() {
    document.getElementById('difficulty').value = this.game.difficulty;
    document.getElementById('undo').disabled = !this.history.length;
    document.querySelectorAll('#keypad button[data-value]').forEach(button => {
      const value = Number(button.dataset.value);
      button.disabled = value > 0 && this.numberCount(value) >= 9;
    });
    const board = document.getElementById('sudoku-board'); board.innerHTML = '';
    this.game.board.forEach((value, index) => {
      const cell = document.createElement('button');
      const given = this.game.puzzle[index] !== 0;
      const sameLine=this.focusIndex !== null && (Math.floor(index/9)===Math.floor(this.focusIndex/9) || index%9===this.focusIndex%9);
      const sameNumber=this.focusValue !== null && value===this.focusValue;
      cell.type = 'button'; cell.className = `cell ${given ? 'given' : 'entry'} ${sameLine ? 'focus-line' : ''} ${sameNumber ? 'focus-number' : ''} ${this.selected === index ? 'selected' : ''} ${this.game.conflicts(index) ? 'conflict' : ''}`;
      cell.textContent = value || '';
      cell.setAttribute('aria-label', `Feld ${Math.floor(index / 9) + 1}, ${index % 9 + 1}${given ? ', Vorgabe' : ''}`);
      cell.addEventListener('click', () => { if (value) this.setFocus(index, value, true); if (!given) this.selected = index; this.render(); });
      board.appendChild(cell);
    });
  }
  check() {
    const wrong = this.game.board.filter((value, index) => value && value !== this.game.solution[index]).length;
    if (wrong) this.message(`${wrong} Zahl${wrong === 1 ? '' : 'en'} stimmt${wrong === 1 ? '' : 'en'} noch nicht.`);
    else if (this.game.isComplete()) this.message('Perfekt gelöst! 🎉');
    else this.message('Bis hierhin alles richtig. Weiter so!');
  }
  message(text) { document.getElementById('message').textContent = text; }
  save() { try { localStorage.setItem('sudoku-game', this.game.serialize()); } catch (_) {} }
  load() { try { const saved = localStorage.getItem('sudoku-game'); if (saved && !this.game.deserialize(saved)) localStorage.removeItem('sudoku-game'); } catch (_) {} }
}
let sudoku;
document.addEventListener('DOMContentLoaded', () => { sudoku = new SudokuUI(); });
