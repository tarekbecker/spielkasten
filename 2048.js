const GAME_2048_SIZE = 4;

class Game2048 {
  constructor(random = Math.random) { this.random = random; this.restart(); }

  restart() { this.board = Array.from({ length: GAME_2048_SIZE }, () => Array(GAME_2048_SIZE).fill(0)); this.score = 0; this.gameOver = false; this.won = false; this.addTile(); this.addTile(); }
  emptyCells() { const result = []; this.board.forEach((row, r) => row.forEach((value, c) => { if (!value) result.push([r, c]); })); return result; }
  addTile() { const empty = this.emptyCells(); if (!empty.length) return false; const [r, c] = empty[Math.floor(this.random() * empty.length)]; this.board[r][c] = this.random() < .9 ? 2 : 4; return true; }
  slide(line) { const compact = line.filter(Boolean); const result = []; let gained = 0; for (let i = 0; i < compact.length; i++) { if (compact[i] === compact[i + 1]) { const value = compact[i] * 2; result.push(value); gained += value; i++; if (value === 2048) this.won = true; } else result.push(compact[i]); } while (result.length < GAME_2048_SIZE) result.push(0); return { line: result, gained }; }
  move(direction) {
    if (this.gameOver || !['left', 'right', 'up', 'down'].includes(direction)) return false;
    let changed = false, gained = 0;
    for (let i = 0; i < GAME_2048_SIZE; i++) {
      const coords = Array.from({ length: GAME_2048_SIZE }, (_, j) => direction === 'left' || direction === 'right' ? [i, j] : [j, i]);
      if (direction === 'right' || direction === 'down') coords.reverse();
      const before = coords.map(([r, c]) => this.board[r][c]);
      const moved = this.slide(before); gained += moved.gained;
      if (before.some((value, index) => value !== moved.line[index])) changed = true;
      coords.forEach(([r, c], index) => { this.board[r][c] = moved.line[index]; });
    }
    if (changed) { this.score += gained; this.addTile(); }
    this.gameOver = !this.canMove();
    return changed;
  }
  canMove() { if (this.emptyCells().length) return true; for (let r = 0; r < GAME_2048_SIZE; r++) for (let c = 0; c < GAME_2048_SIZE; c++) if ((r < 3 && this.board[r][c] === this.board[r + 1][c]) || (c < 3 && this.board[r][c] === this.board[r][c + 1])) return true; return false; }
  serialize() { return JSON.stringify({ board: this.board, score: this.score, gameOver: this.gameOver, won: this.won }); }
  deserialize(value) { try { const state = JSON.parse(value); if (!Array.isArray(state.board) || state.board.length !== 4 || !state.board.every(row => Array.isArray(row) && row.length === 4 && row.every(value => Number.isInteger(value) && value >= 0 && (value === 0 || (value & (value - 1)) === 0)))) return false; this.board = state.board; this.score = Number.isSafeInteger(state.score) && state.score >= 0 ? state.score : 0; this.gameOver = Boolean(state.gameOver); this.won = Boolean(state.won); return true; } catch { return false; } }
}

if (typeof module !== 'undefined' && module.exports) module.exports = { Game2048, GAME_2048_SIZE };
