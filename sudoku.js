/** A small, dependency-free Sudoku engine. Every generated puzzle has one solution. */
class SudokuGame {
  static clues = { kinder: 50, leicht: 42, mittel: 34, schwer: 28, profi: 24 };

  constructor(difficulty = 'mittel') {
    this.newGame(difficulty);
  }

  newGame(difficulty = 'mittel') {
    this.difficulty = SudokuGame.clues[difficulty] ? difficulty : 'mittel';
    this.solution = SudokuGame.createSolution();
    this.puzzle = this.solution.slice();
    this.removeCells(SudokuGame.clues[this.difficulty]);
    this.board = this.puzzle.slice();
  }

  static shuffled(items) {
    const copy = items.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  static createSolution() {
    const pattern = (row, col) => (row * 3 + Math.floor(row / 3) + col) % 9;
    const rows = SudokuGame.shuffled([0, 1, 2]).flatMap(group => SudokuGame.shuffled([0, 1, 2]).map(row => group * 3 + row));
    const cols = SudokuGame.shuffled([0, 1, 2]).flatMap(group => SudokuGame.shuffled([0, 1, 2]).map(col => group * 3 + col));
    const numbers = SudokuGame.shuffled([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    return rows.flatMap(row => cols.map(col => numbers[pattern(row, col)]));
  }

  removeCells(targetClues) {
    const positions = SudokuGame.shuffled(Array.from({ length: 81 }, (_, index) => index));
    let clues = 81;
    for (const index of positions) {
      if (clues <= targetClues) break;
      const old = this.puzzle[index];
      this.puzzle[index] = 0;
      if (this.countSolutions(this.puzzle.slice(), 2) !== 1) this.puzzle[index] = old;
      else clues--;
    }
  }

  countSolutions(board, limit = 2) {
    let bestIndex = -1;
    let bestCandidates = null;
    for (let index = 0; index < 81; index++) {
      if (board[index]) continue;
      const candidates = this.candidates(board, index);
      if (!candidates.length) return 0;
      if (!bestCandidates || candidates.length < bestCandidates.length) {
        bestIndex = index;
        bestCandidates = candidates;
        if (candidates.length === 1) break;
      }
    }
    if (bestIndex === -1) return 1;
    let total = 0;
    for (const value of bestCandidates) {
      board[bestIndex] = value;
      total += this.countSolutions(board, limit - total);
      if (total >= limit) break;
    }
    board[bestIndex] = 0;
    return total;
  }

  candidates(board, index) {
    const row = Math.floor(index / 9), col = index % 9;
    const used = new Set();
    for (let i = 0; i < 9; i++) { used.add(board[row * 9 + i]); used.add(board[i * 9 + col]); }
    const boxRow = Math.floor(row / 3) * 3, boxCol = Math.floor(col / 3) * 3;
    for (let r = boxRow; r < boxRow + 3; r++) for (let c = boxCol; c < boxCol + 3; c++) used.add(board[r * 9 + c]);
    return [1, 2, 3, 4, 5, 6, 7, 8, 9].filter(value => !used.has(value));
  }

  setCell(index, value) {
    if (this.puzzle[index] !== 0) return false;
    this.board[index] = Number.isInteger(value) && value >= 1 && value <= 9 ? value : 0;
    return true;
  }

  conflicts(index) {
    const value = this.board[index];
    if (!value) return false;
    const row = Math.floor(index / 9), col = index % 9;
    for (let i = 0; i < 9; i++) {
      if (i !== col && this.board[row * 9 + i] === value) return true;
      if (i !== row && this.board[i * 9 + col] === value) return true;
    }
    const boxRow = Math.floor(row / 3) * 3, boxCol = Math.floor(col / 3) * 3;
    for (let r = boxRow; r < boxRow + 3; r++) for (let c = boxCol; c < boxCol + 3; c++) if ((r !== row || c !== col) && this.board[r * 9 + c] === value) return true;
    return false;
  }

  isComplete() { return this.board.every((value, index) => value === this.solution[index]); }
  serialize() { return JSON.stringify({ difficulty: this.difficulty, puzzle: this.puzzle, solution: this.solution, board: this.board }); }
  deserialize(raw) {
    try {
      const data = JSON.parse(raw);
      if (!SudokuGame.clues[data.difficulty] || ![data.puzzle, data.solution, data.board].every(a => Array.isArray(a) && a.length === 81) || !data.solution.every(n => Number.isInteger(n) && n >= 1 && n <= 9) || !data.puzzle.every((n, i) => n === 0 || n === data.solution[i]) || !data.board.every(n => Number.isInteger(n) && n >= 0 && n <= 9)) return false;
      this.difficulty = data.difficulty; this.puzzle = data.puzzle; this.solution = data.solution; this.board = data.board;
      return true;
    } catch (_) { return false; }
  }
}

if (typeof module !== 'undefined') module.exports = { SudokuGame };
