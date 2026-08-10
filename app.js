/**
 * German Draughts (Dame) UI Controller
 */

class DraughtsUI {
  constructor() {
    this.game = new DraughtsGame();
    this.board = document.getElementById('board');
    this.selectedSquare = null;
    this.validMoves = [];
    this.lastMove = null;
    this.deferredPrompt = null;
    this.mode = 'computer';
    this.computerPlayer = 'black';
    this.thinking = false;
    
    this.init();
  }

  init() {
    this.createBoard();
    this.loadGame();
    this.loadSettings();
    this.bindSettings();
    this.updateDisplay();
    this.setupInstallPrompt();
    this.maybeComputerMove();
    
    // Save game state before unload
    window.addEventListener('beforeunload', () => this.saveGame());
  }

  bindSettings() {
    const mode = document.getElementById('game-mode');
    const difficulty = document.getElementById('difficulty');
    mode.value = this.mode;
    difficulty.value = localStorage.getItem('draughts-difficulty') || 'medium';
    document.getElementById('difficulty-control').hidden = this.mode === 'human';
    mode.addEventListener('change', () => { this.mode = mode.value; localStorage.setItem('draughts-mode', this.mode); document.getElementById('difficulty-control').hidden = this.mode === 'human'; this.restartGame(); });
    difficulty.addEventListener('change', () => localStorage.setItem('draughts-difficulty', difficulty.value));
  }

  loadSettings() { try { this.mode = localStorage.getItem('draughts-mode') === 'human' ? 'human' : 'computer'; } catch {} }

  createBoard() {
    this.board.innerHTML = '';
    
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const square = document.createElement('div');
        square.className = `square ${(row + col) % 2 === 0 ? 'light' : 'dark'}`;
        square.dataset.row = row;
        square.dataset.col = col;
        square.addEventListener('click', () => this.handleSquareClick(row, col));
        this.board.appendChild(square);
      }
    }
  }

  renderBoard() {
    const squares = this.board.querySelectorAll('.square');
    
    squares.forEach(square => {
      const row = parseInt(square.dataset.row);
      const col = parseInt(square.dataset.col);
      const piece = this.game.getPiece(row, col);
      
      // Clear piece
      square.innerHTML = '';
      square.classList.remove('selected', 'valid-move', 'last-move');
      
      // Add piece if exists
      if (piece) {
        const pieceEl = document.createElement('div');
        pieceEl.className = `piece ${piece.player} ${piece.type}`;
        square.appendChild(pieceEl);
      }
      
      // Highlight selected
      if (this.selectedSquare && this.selectedSquare.row === row && this.selectedSquare.col === col) {
        square.classList.add('selected');
      }
      
      // Highlight valid moves
      if (this.validMoves.some(m => m.toRow === row && m.toCol === col)) {
        square.classList.add('valid-move');
      }
      
      // Highlight last move
      if (this.lastMove) {
        if ((this.lastMove.from.row === row && this.lastMove.from.col === col) ||
            (this.lastMove.to.row === row && this.lastMove.to.col === col)) {
          square.classList.add('last-move');
        }
      }
    });
  }

  handleSquareClick(row, col) {
    if (this.game.gameOver || this.thinking || (this.mode === 'computer' && this.game.currentPlayer === this.computerPlayer)) return;
    
    const piece = this.game.getPiece(row, col);
    
    // If we have a piece selected and click on a valid move target
    if (this.selectedSquare) {
      const move = this.validMoves.find(m => m.toRow === row && m.toCol === col);
      if (move) {
        this.executeMove(move);
        return;
      }
    }
    
    // If clicking on own piece, select it
    if (piece && piece.player === this.game.currentPlayer) {
      this.selectPiece(row, col);
    } else {
      this.clearSelection();
    }
  }

  selectPiece(row, col) {
    this.selectedSquare = { row, col };
    this.validMoves = this.game.getValidMoves(row, col);
    this.renderBoard();
  }

  clearSelection() {
    this.selectedSquare = null;
    this.validMoves = [];
    this.renderBoard();
  }

  executeMove(move) {
    const success = this.game.makeMove(move);
    if (success) {
      this.lastMove = {
        from: { row: move.fromRow, col: move.fromCol },
        to: { row: move.toRow, col: move.toCol }
      };
      
      // Check if we need to continue capturing
      if (this.game.capturesInProgress.length > 0) {
        this.selectPiece(move.toRow, move.toCol);
      } else {
        this.clearSelection();
      }
      
      this.updateDisplay();
      this.saveGame();
      
      if (this.game.gameOver) {
        this.showGameOver();
      } else {
        this.maybeComputerMove();
      }
    }
  }

  updateDisplay() {
    this.renderBoard();
    
    // Update status
    const indicator = document.getElementById('player-indicator');
    const statusText = document.getElementById('status-text');
    
    indicator.className = `player-indicator ${this.game.currentPlayer}`;
    
    if (this.game.gameOver) {
      statusText.textContent = 'Spiel beendet!';
    } else if (this.thinking) {
      statusText.textContent = 'Computer überlegt …';
    } else if (this.game.capturesInProgress.length > 0) {
      statusText.textContent = `${this.getPlayerName(this.game.currentPlayer)} muss weiter schlagen!`;
    } else {
      statusText.textContent = `${this.getPlayerName(this.game.currentPlayer)} ist am Zug`;
    }
    
    // Update piece counts
    const whitePieces = this.game.getAllPieces('white');
    const blackPieces = this.game.getAllPieces('black');
    document.getElementById('white-count').textContent = whitePieces.length;
    document.getElementById('black-count').textContent = blackPieces.length;
  }

  getPlayerName(player) {
    return player === 'white' ? 'Weiß' : 'Schwarz';
  }

  showGameOver() {
    const modal = document.getElementById('game-over-modal');
    const winnerText = document.getElementById('winner-text');
    const winnerMessage = document.getElementById('winner-message');
    
    if (this.game.winner) {
      modal.className = `modal show winner-${this.game.winner}`;
      winnerText.textContent = `${this.getPlayerName(this.game.winner)} gewinnt! 🎉`;
      winnerMessage.textContent = 'Herzlichen Glückwunsch zum Sieg!';
    } else {
      modal.className = 'modal show';
      winnerText.textContent = 'Unentschieden!';
      winnerMessage.textContent = 'Das Spiel endet mit einem Remis.';
    }
  }

  closeModal() {
    document.getElementById('game-over-modal').classList.remove('show');
  }

  restartGame() {
    this.game.restart();
    this.selectedSquare = null;
    this.validMoves = [];
    this.lastMove = null;
    this.thinking = false;
    this.updateDisplay();
    this.saveGame();
    this.closeModal();
    this.maybeComputerMove();
  }

  undoMove() {
    if (this.game.undoLastMove()) {
      this.selectedSquare = null;
      this.validMoves = [];
      this.lastMove = null;
      this.updateDisplay();
      this.saveGame();
    }
  }

  saveGame() {
    try {
      localStorage.setItem('draughts-game', this.game.serialize());
    } catch (e) {
      console.error('Failed to save game:', e);
    }
  }

  loadGame() {
    try {
      const saved = localStorage.getItem('draughts-game');
      if (saved) {
        if (!this.game.deserialize(saved)) {
          localStorage.removeItem('draughts-game');
          this.game.restart();
        } else if (this.game.selectedPiece) {
          this.selectedSquare = { ...this.game.selectedPiece };
          this.validMoves = this.game.getValidMoves(this.selectedSquare.row, this.selectedSquare.col);
        }
      }
    } catch (e) {
      console.error('Failed to load game:', e);
    }
  }

  allMoves() {
    if (this.game.capturesInProgress.length) return this.game.getValidMoves(this.game.selectedPiece.row, this.game.selectedPiece.col);
    return this.game.getAllPieces(this.game.currentPlayer).flatMap(piece => this.game.getValidMoves(piece.row, piece.col));
  }

  evaluate(game, player) {
    const opponent = player === 'white' ? 'black' : 'white';
    const value = pieces => pieces.reduce((sum, piece) => sum + (piece.type === 'king' ? 3 : 1), 0);
    return value(game.getAllPieces(player)) - value(game.getAllPieces(opponent));
  }

  chooseComputerMove() {
    const moves = this.allMoves();
    if (!moves.length) return null;
    const difficulty = document.getElementById('difficulty').value;
    if (difficulty === 'child') return moves[Math.floor(Math.random() * moves.length)];
    const scored = moves.map(move => {
      const copy = new DraughtsGame(); copy.deserialize(this.game.serialize()); copy.makeMove(move);
      let score = this.evaluate(copy, this.computerPlayer) * (difficulty === 'easy' ? 3 : difficulty === 'medium' ? 8 : 14);
      score += move.captures.length * 10;
      const piece = this.game.getPiece(move.fromRow, move.fromCol);
      if (piece?.type === 'man' && move.toRow === 7) score += 8;
      score += Math.random() * (difficulty === 'easy' ? 18 : difficulty === 'medium' ? 5 : 1);
      return { move, score };
    });
    scored.sort((a, b) => b.score - a.score);
    return scored[0].move;
  }

  maybeComputerMove() {
    if (this.mode !== 'computer' || this.game.gameOver || this.game.currentPlayer !== this.computerPlayer || this.thinking) return;
    this.thinking = true; this.updateDisplay();
    setTimeout(() => { const move = this.chooseComputerMove(); this.thinking = false; if (move) this.executeMove(move); }, 420);
  }

  setupInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      
      // Show custom install prompt after 5 seconds
      setTimeout(() => {
        const prompt = document.getElementById('install-prompt');
        if (prompt) prompt.classList.add('show');
      }, 5000);
    });

    window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null;
      document.getElementById('install-prompt').classList.remove('show');
    });
  }

  async installApp() {
    if (!this.deferredPrompt) return;
    
    this.deferredPrompt.prompt();
    const { outcome } = await this.deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      this.deferredPrompt = null;
      document.getElementById('install-prompt').classList.remove('show');
    }
  }

  dismissInstall() {
    document.getElementById('install-prompt').classList.remove('show');
  }
}

// Initialize game when DOM is loaded
let game;
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    game = new DraughtsUI();
  });
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DraughtsUI };
}
