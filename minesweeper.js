class MinesweeperGame {
  constructor(rows = 9, cols = 9, mines = 10, random = Math.random) { this.random = random; this.restart(rows, cols, mines); }
  restart(rows = this.rows, cols = this.cols, mines = this.mines) { this.rows = rows; this.cols = cols; this.mines = mines; this.firstMove = true; this.gameOver = false; this.won = false; const places = Array.from({ length: rows * cols }, (_, i) => i); for (let i = places.length - 1; i > 0; i--) { const j = Math.floor(this.random() * (i + 1)); [places[i], places[j]] = [places[j], places[i]]; } this.board = Array.from({ length: rows }, (_, r) => Array.from({ length: cols }, (_, c) => ({ mine: places.slice(0, mines).includes(r * cols + c), revealed: false, flagged: false, adjacent: 0 }))); this.countAdjacent(); }
  valid(r, c) { return r >= 0 && r < this.rows && c >= 0 && c < this.cols; }
  neighbors(r, c) { const cells = []; for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) if ((dr || dc) && this.valid(r + dr, c + dc)) cells.push([r + dr, c + dc]); return cells; }
  countAdjacent() { this.board.forEach((row, r) => row.forEach((cell, c) => { cell.adjacent = this.neighbors(r, c).filter(([nr, nc]) => this.board[nr][nc].mine).length; })); }
  ensureSafe(r, c) {
    // The opening move should give children an actual starting area, not just
    // avoid an immediate mine. Move every mine in the 3×3 area elsewhere.
    const protectedCells = new Set([this.board[r][c], ...this.neighbors(r, c).map(([nr, nc]) => this.board[nr][nc])]);
    const minesToMove = [...protectedCells].filter(cell => cell.mine);
    const safeTargets = this.board.flat().filter(cell => !cell.mine && !protectedCells.has(cell));
    minesToMove.forEach(mine => {
      const target = safeTargets.shift() || (mine === this.board[r][c] && this.board.flat().find(cell => !cell.mine && cell !== mine));
      if (!target) return;
      mine.mine = false;
      target.mine = true;
    });
    this.countAdjacent();
  }
  reveal(r, c) {
    if (!this.valid(r, c) || this.gameOver) return false;
    const cell = this.board[r][c];
    // A flagged or already open field is not a move, so it must not use up
    // the guaranteed-safe opening reveal.
    if (cell.revealed || cell.flagged) return false;
    if (this.firstMove) { this.ensureSafe(r, c); this.firstMove = false; }
    cell.revealed = true;
    if (cell.mine) { this.gameOver = true; return true; }
    if (!cell.adjacent) this.neighbors(r, c).forEach(([nr, nc]) => this.reveal(nr, nc));
    this.checkWin();
    return true;
  }
  toggleFlag(r, c) { const cell = this.valid(r, c) && this.board[r][c]; if (!cell || cell.revealed || this.gameOver) return false; cell.flagged = !cell.flagged; return true; }
  checkWin() { if (this.board.flat().every(cell => cell.mine || cell.revealed)) { this.won = true; this.gameOver = true; } }
  flagCount() { return this.board.flat().filter(cell => cell.flagged).length; }
  serialize() { return JSON.stringify({ rows:this.rows, cols:this.cols, mines:this.mines, board:this.board, firstMove:this.firstMove, gameOver:this.gameOver, won:this.won }); }
  deserialize(value) { try { const state = JSON.parse(value); if (!Number.isInteger(state.rows) || !Number.isInteger(state.cols) || !Number.isInteger(state.mines) || state.rows < 2 || state.cols < 2 || state.mines < 1 || state.mines >= state.rows * state.cols || !Array.isArray(state.board) || state.board.length !== state.rows || !state.board.every(row => Array.isArray(row) && row.length === state.cols && row.every(cell => typeof cell.mine === 'boolean' && typeof cell.revealed === 'boolean' && typeof cell.flagged === 'boolean' && Number.isInteger(cell.adjacent)))) return false; this.rows=state.rows; this.cols=state.cols; this.mines=state.mines; this.board=state.board; this.firstMove=Boolean(state.firstMove); this.gameOver=Boolean(state.gameOver); this.won=Boolean(state.won); return true; } catch { return false; } }
}
if (typeof module !== 'undefined' && module.exports) module.exports = { MinesweeperGame };
