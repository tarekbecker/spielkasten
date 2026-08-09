class SudokuUI {
  constructor() {
    this.game = new SudokuGame();
    this.selected = null;
    this.focusValue = null;
    this.focusIndex = null;
    this.load();
    this.bind();
    this.render();
  }
  bind() {
    document.getElementById('difficulty').addEventListener('change', event => this.newGame(event.target.value));
    document.getElementById('new-game').addEventListener('click', () => this.newGame(document.getElementById('difficulty').value));
    document.getElementById('check').addEventListener('click', () => this.check());
    document.getElementById('solve').addEventListener('click', () => { this.game.board = this.game.solution.slice(); this.render(); this.save(); this.message('Gelöst! 🥳'); });
    document.getElementById('keypad').addEventListener('click', event => {
      const button = event.target.closest('button[data-value]');
      if (!button || this.selected === null) return;
      const value = Number(button.dataset.value); this.game.setCell(this.selected, value); this.setFocus(this.selected, value); this.render(); this.save();
    });
    window.addEventListener('keydown', event => {
      if (this.selected === null) return;
      if (/^[1-9]$/.test(event.key)) { const value=Number(event.key); this.game.setCell(this.selected, value); this.setFocus(this.selected, value); this.render(); this.save(); }
      if (event.key === 'Backspace' || event.key === 'Delete' || event.key === '0') { this.game.setCell(this.selected, 0); this.setFocus(this.selected, 0); this.render(); this.save(); }
    });
  }
  setFocus(index, value, toggle = false) { if (!value) { this.focusValue=null; this.focusIndex=null; return; } if (toggle && this.focusValue === value) { this.focusValue=null; this.focusIndex=null; } else { this.focusValue=value; this.focusIndex=index; } }
  newGame(difficulty) { this.game.newGame(difficulty); this.selected = null; this.focusValue = null; this.focusIndex = null; this.message('Neues Sudoku – viel Spaß!'); this.render(); this.save(); }
  render() {
    document.getElementById('difficulty').value = this.game.difficulty;
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
