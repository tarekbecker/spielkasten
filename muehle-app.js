/**
 * Nine Men's Morris (Mühle) UI Controller
 */

class MuehleUI {
  constructor() {
    this.game = new MuehleGame();
    this.boardEl = document.getElementById('board');
    this.selectedPoint = null;
    this.validMoves = [];
    this.deferredPrompt = null;
    this.mode = 'computer'; this.computerPlayer = MUEHLE_PLAYER_BLACK; this.thinking = false;
    
    this.init();
  }

  init() {
    this.createBoard();
    this.loadGame();
    this.loadSettings(); this.bindSettings();
    this.updateDisplay();
    this.setupInstallPrompt();
    this.maybeComputerMove();
    
    // Save game state before unload
    window.addEventListener('beforeunload', () => this.saveGame());
  }

  loadSettings() { try { this.mode = localStorage.getItem('muehle-mode') === 'human' ? 'human' : 'computer'; } catch {} }
  bindSettings() { const mode=document.getElementById('game-mode'), difficulty=document.getElementById('difficulty'); mode.value=this.mode; difficulty.value=localStorage.getItem('muehle-difficulty')||'medium'; document.getElementById('difficulty-control').hidden=this.mode==='human'; mode.addEventListener('change',()=>{this.mode=mode.value;localStorage.setItem('muehle-mode',this.mode);document.getElementById('difficulty-control').hidden=this.mode==='human';this.restartGame();});difficulty.addEventListener('change',()=>localStorage.setItem('muehle-difficulty',difficulty.value)); }

  // Point coordinates for SVG board (percentage-based)
  getPointCoordinates() {
    return [
      { x: 5, y: 5 },      // 0 - top-left outer
      { x: 50, y: 5 },     // 1 - top-middle outer
      { x: 95, y: 5 },     // 2 - top-right outer
      { x: 22, y: 22 },    // 3 - top-left middle
      { x: 50, y: 22 },    // 4 - top-middle middle
      { x: 78, y: 22 },    // 5 - top-right middle
      { x: 39, y: 39 },    // 6 - top-left inner
      { x: 50, y: 39 },    // 7 - top-middle inner
      { x: 61, y: 39 },    // 8 - top-right inner
      { x: 5, y: 50 },     // 9 - left-middle outer
      { x: 22, y: 50 },    // 10 - left-middle middle
      { x: 39, y: 50 },    // 11 - left-middle inner
      { x: 61, y: 50 },    // 12 - right-middle inner
      { x: 78, y: 50 },    // 13 - right-middle middle
      { x: 95, y: 50 },    // 14 - right-middle outer
      { x: 39, y: 61 },    // 15 - bottom-left inner
      { x: 50, y: 61 },    // 16 - bottom-middle inner
      { x: 61, y: 61 },    // 17 - bottom-right inner
      { x: 22, y: 78 },    // 18 - bottom-left middle
      { x: 50, y: 78 },    // 19 - bottom-middle middle
      { x: 78, y: 78 },    // 20 - bottom-right middle
      { x: 5, y: 95 },     // 21 - bottom-left outer
      { x: 50, y: 95 },    // 22 - bottom-middle outer
      { x: 95, y: 95 }     // 23 - bottom-right outer
    ];
  }

  createBoard() {
    this.boardEl.innerHTML = '';
    
    const coords = this.getPointCoordinates();
    
    // Create SVG board
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 100 100');
    svg.setAttribute('class', 'board-svg');
    
    // Draw connecting lines
    const lines = [
      // Outer square
      [0, 1], [1, 2], [2, 14], [14, 23], [23, 22], [22, 21], [21, 9], [9, 0],
      // Middle square
      [3, 4], [4, 5], [5, 13], [13, 20], [20, 19], [19, 18], [18, 10], [10, 3],
      // Inner square
      [6, 7], [7, 8], [8, 12], [12, 17], [17, 16], [16, 15], [15, 11], [11, 6],
      // Connecting lines
      [1, 4], [4, 7], [14, 13], [13, 12], [22, 19], [19, 16], [9, 10], [10, 11]
    ];
    
    for (const [from, to] of lines) {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', coords[from].x);
      line.setAttribute('y1', coords[from].y);
      line.setAttribute('x2', coords[to].x);
      line.setAttribute('y2', coords[to].y);
      line.setAttribute('class', 'board-line');
      svg.appendChild(line);
    }
    
    // Draw points and pieces
    for (let i = 0; i < 24; i++) {
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('class', 'point-group');
      g.setAttribute('data-point', i);
      g.addEventListener('click', () => this.handlePointClick(i));
      
      // Point circle (clickable area)
      const point = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      point.setAttribute('cx', coords[i].x);
      point.setAttribute('cy', coords[i].y);
      point.setAttribute('r', 4);
      point.setAttribute('class', 'board-point');
      point.setAttribute('id', `point-${i}`);
      g.appendChild(point);
      
      // Piece circle (initially hidden)
      const piece = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      piece.setAttribute('cx', coords[i].x);
      piece.setAttribute('cy', coords[i].y);
      piece.setAttribute('r', 0);
      piece.setAttribute('class', 'game-piece');
      piece.setAttribute('id', `piece-${i}`);
      g.appendChild(piece);
      
      svg.appendChild(g);
    }
    
    this.boardEl.appendChild(svg);
  }

  renderBoard() {
    const coords = this.getPointCoordinates();
    
    // Update all points and pieces
    for (let i = 0; i < 24; i++) {
      const pointEl = document.getElementById(`point-${i}`);
      const pieceEl = document.getElementById(`piece-${i}`);
      
      // Reset classes
      pointEl.classList.remove('selected', 'valid-move', 'in-mill', 'removable');
      pieceEl.classList.remove('white', 'black', 'selected', 'in-mill', 'removable');
      
      // Show piece if present
      const piece = this.game.getPiece(i);
      if (piece) {
        // Larger than the brown board point so the stone colour remains
        // unmistakable on every browser, especially mobile Safari.
        pieceEl.setAttribute('r', 4.25);
        pieceEl.classList.add(piece);
        
        // Highlight if part of mill
        if (this.game.isPartOfMill(i)) {
          pointEl.classList.add('in-mill');
          pieceEl.classList.add('in-mill');
        }
      } else {
        pieceEl.setAttribute('r', 0);
      }
      
      // Highlight selected point
      if (this.selectedPoint === i) {
        pointEl.classList.add('selected');
        pieceEl.classList.add('selected');
      }
      
      // Highlight valid moves
      if (this.validMoves.includes(i)) {
        pointEl.classList.add('valid-move');
      }
      
      // Highlight removable stones
      if (this.game.removingStone) {
        const removable = this.game.getRemovableStones();
        if (removable.includes(i)) {
          pointEl.classList.add('removable');
          pieceEl.classList.add('removable');
        }
      }
    }
  }

  handlePointClick(point) {
    if (this.game.gameOver || this.thinking || (this.mode==='computer' && this.game.currentPlayer===this.computerPlayer)) return;
    if (this.game.removingStone) { const result=this.game.removeStone(point); if(result.success)this.afterAction(); return; }
    if (this.game.phase===MUEHLE_PHASE_PLACING) { const result=this.game.placeStone(point); if(result.success)this.afterAction(); return; }
    const piece=this.game.getPiece(point);
    if(this.selectedPoint!==null&&this.validMoves.includes(point)){const result=this.game.moveStone(this.selectedPoint,point);if(result.success)this.afterAction();return;}
    if(piece===this.game.currentPlayer){this.selectedPoint=point;this.validMoves=this.game.getValidMovingMoves(point);this.renderBoard();}else{this.selectedPoint=null;this.validMoves=[];this.renderBoard();}
  }

  afterAction() { this.selectedPoint=null; this.validMoves=[]; this.updateDisplay(); this.saveGame(); if(this.game.gameOver)this.showGameOver(); else this.maybeComputerMove(); }

  updateDisplay() {
    this.renderBoard();
    
    const status = this.game.getStatus();
    const indicator = document.getElementById('player-indicator');
    const statusText = document.getElementById('status-text');
    const phaseText = document.getElementById('phase-text');
    
    // Update player indicator
    indicator.className = `player-indicator ${this.game.currentPlayer}`;
    
    // Update status text
    statusText.textContent = this.thinking ? 'Computer überlegt …' : status.message;
    
    // Update phase indicator
    if (this.game.gameOver) {
      phaseText.textContent = '🏆 Spiel beendet';
    } else if (this.game.removingStone) {
      phaseText.textContent = '✂️ Stein entfernen';
    } else if (this.game.phase === MUEHLE_PHASE_PLACING) {
      const whiteRemaining = this.game.whiteStonesToPlace;
      const blackRemaining = this.game.blackStonesToPlace;
      phaseText.textContent = `📍 Setzphase (⚪${whiteRemaining} ⚫${blackRemaining})`;
    } else {
      const whiteStones = this.game.whiteStonesOnBoard;
      const blackStones = this.game.blackStonesOnBoard;
      const canFlyWhite = whiteStones === 3;
      const canFlyBlack = blackStones === 3;
      phaseText.textContent = `🔄 Zugphase (⚪${whiteStones}${canFlyWhite ? '✈️' : ''} ⚫${blackStones}${canFlyBlack ? '✈️' : ''})`;
    }
    
    // Update stone count display
    document.getElementById('white-placed').textContent = 9 - this.game.whiteStonesToPlace;
    document.getElementById('white-onboard').textContent = this.game.whiteStonesOnBoard;
    document.getElementById('black-placed').textContent = 9 - this.game.blackStonesToPlace;
    document.getElementById('black-onboard').textContent = this.game.blackStonesOnBoard;
  }

  showGameOver() {
    const modal = document.getElementById('game-over-modal');
    const winnerText = document.getElementById('winner-text');
    const winnerMessage = document.getElementById('winner-message');
    
    if (this.game.winner) {
      modal.className = `modal show winner-${this.game.winner}`;
      winnerText.textContent = `${this.game.winner === MUEHLE_PLAYER_WHITE ? 'Weiß' : 'Schwarz'} gewinnt! 🎉`;
      winnerMessage.textContent = 'Herzlichen Glückwunsch zum Sieg!';
    } else {
      modal.className = 'modal show';
      winnerText.textContent = 'Unentschieden!';
      winnerMessage.textContent = 'Diese Partie endet remis.';
    }
  }

  closeModal() {
    document.getElementById('game-over-modal').classList.remove('show');
  }

  restartGame() {
    this.game.restart();
    this.selectedPoint = null;
    this.validMoves = [];
    this.thinking = false;
    this.updateDisplay();
    this.saveGame();
    this.closeModal();
    this.maybeComputerMove();
  }

  saveGame() {
    try {
      localStorage.setItem('muehle-game', this.game.serialize());
    } catch (e) {
      console.error('Failed to save game:', e);
    }
  }

  loadGame() {
    try {
      const saved = localStorage.getItem('muehle-game');
      if (saved) {
        if (this.game.deserialize(saved)) {
          this.saveGame();
        } else {
          localStorage.removeItem('muehle-game');
          this.game.restart();
        }
      }
    } catch (e) {
      console.error('Failed to load game:', e);
    }
  }

  actionsFor(game) { return game.removingStone ? game.getRemovableStones().map(point => ({ type: 'remove', point })) : game.getAllValidMoves(); }
  computerActions() { return this.actionsFor(this.game); }
  applyComputerAction(action, target=this.game) { if(action.type==='remove')return target.removeStone(action.point); if(action.type==='place')return target.placeStone(action.to); return target.moveStone(action.from,action.to); }
  cloneGame(game) { const copy=new MuehleGame(); copy.deserialize(game.serialize()); return copy; }
  evaluate(game) {
    const opponent=this.computerPlayer===MUEHLE_PLAYER_WHITE ? MUEHLE_PLAYER_BLACK : MUEHLE_PLAYER_WHITE;
    if(game.gameOver) return game.winner===this.computerPlayer ? 100000 : game.winner===opponent ? -100000 : 0;
    const own=game.getPlayerPoints(this.computerPlayer).length, theirs=game.getPlayerPoints(opponent).length;
    const mills=game.countMills(this.computerPlayer)-game.countMills(opponent);
    return (own-theirs)*100+mills*50;
  }
  search(game, depth, alpha=-Infinity, beta=Infinity) {
    if(depth===0 || game.gameOver) return this.evaluate(game);
    const actions=this.actionsFor(game); if(!actions.length) return this.evaluate(game);
    const maximizing=game.currentPlayer===this.computerPlayer;
    let best=maximizing ? -Infinity : Infinity;
    for(const action of actions) {
      const copy=this.cloneGame(game); this.applyComputerAction(action, copy);
      const score=this.search(copy, depth-1, alpha, beta);
      if(maximizing) { best=Math.max(best,score); alpha=Math.max(alpha,best); } else { best=Math.min(best,score); beta=Math.min(beta,best); }
      if(beta<=alpha) break;
    }
    return best;
  }
  leavesImmediateOpponentMill(action) {
    const after=this.cloneGame(this.game);
    this.applyComputerAction(action, after);
    const opponent=this.computerPlayer===MUEHLE_PLAYER_WHITE ? MUEHLE_PLAYER_BLACK : MUEHLE_PLAYER_WHITE;
    // A mill of our own grants a removal before the opponent can move, so it
    // cannot be an immediate opponent threat yet.
    if(after.currentPlayer!==opponent || after.removingStone) return false;
    const millsBefore=after.countMills(opponent);
    return this.actionsFor(after).some(reply => {
      const response=this.cloneGame(after);
      this.applyComputerAction(reply, response);
      return response.countMills(opponent)>millsBefore;
    });
  }
  chooseComputerAction() {
    const actions=this.computerActions(); if(!actions.length)return null;
    const level=document.getElementById('difficulty').value;
    if(level==='child')return actions[Math.floor(Math.random()*actions.length)];
    // Medium is intentionally shallow, but it must never overlook a one-move
    // mill. Restrict it to blocking moves whenever at least one exists.
    const safeActions=level==='medium' ? actions.filter(action => !this.leavesImmediateOpponentMill(action)) : actions;
    const candidates=safeActions.length ? safeActions : actions;
    const depth={easy:1,medium:2,hard:3}[level]||2;
    let best=-Infinity, choices=[];
    for(const action of candidates) {
      const copy=this.cloneGame(this.game); this.applyComputerAction(action,copy);
      const score=this.search(copy,depth-1);
      if(score>best) { best=score; choices=[action]; } else if(score===best) choices.push(action);
    }
    return choices[Math.floor(Math.random()*choices.length)];
  }
  maybeComputerMove() { if(this.mode!=='computer'||this.game.gameOver||this.game.currentPlayer!==this.computerPlayer||this.thinking)return;this.thinking=true;this.updateDisplay();setTimeout(()=>{const action=this.chooseComputerAction();this.thinking=false;if(action){this.applyComputerAction(action);this.afterAction();}},430); }

  setupInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      
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
    game = new MuehleUI();
  });
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { MuehleUI };
}
