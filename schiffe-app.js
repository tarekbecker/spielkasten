class BattleshipUI {
  constructor() { this.game=new BattleshipGame(); this.horizontal=true; this.pendingPlacement=null; this.showingShot=false; this.shotTimer=null; this.fleetVisible=false; this.choosingStart=!this.load(); this.bind(); this.render(); if(this.game.mode==='computer'&&this.game.phase==='battle'&&this.game.currentPlayer==='black'&&!this.game.handoff)this.runComputer(); }
  name(player) { return player === 'white' ? 'Weiß' : 'Schwarz'; }
  flag(player) { return player === 'white' ? '🏳️' : '🏴'; }
  opponent(player) { return player === 'white' ? 'black' : 'white'; }
  bind() {
    document.getElementById('rotate').addEventListener('click',()=>{this.horizontal=!this.horizontal;this.render();});
    document.getElementById('random').addEventListener('click',()=>this.randomize());
    document.getElementById('confirm').addEventListener('click',()=>this.confirmPlacement());
    document.getElementById('cancel').addEventListener('click',()=>{this.pendingPlacement=null;this.message('Wähle eine neue Position.');this.render();});
    document.getElementById('next').addEventListener('click',()=>this.next());
    document.getElementById('continue').addEventListener('click',()=>this.continueGame());
    document.getElementById('reveal-fleet').addEventListener('click',()=>{this.fleetVisible=!this.fleetVisible;this.render();});
    document.getElementById('restart').addEventListener('click',()=>this.showStart());
    document.getElementById('start-human').addEventListener('click',()=>this.startGame('human'));
    document.getElementById('start-computer').addEventListener('click',()=>document.getElementById('level-picker').hidden=false);
    document.querySelectorAll('[data-level]').forEach(button=>button.addEventListener('click',()=>this.startGame('computer',button.dataset.level)));
  }
  showStart() { clearTimeout(this.shotTimer); this.showingShot=false; this.pendingPlacement=null; this.choosingStart=true; document.getElementById('level-picker').hidden=true; this.render(); }
  startGame(mode, level='medium') { this.game.restart(mode,level); this.horizontal=true; this.pendingPlacement=null; this.showingShot=false; this.choosingStart=false; this.fleetVisible=false; this.save(); this.render(); }
  continueGame() { if(!this.game.handoff||this.showingShot)return; this.game.handoff=false; this.game.lastShot=null; this.save(); this.render(); }
  next() { const result=this.game.finishSetup(); if(!result)return; this.save(); this.render(); }
  randomize() { if(this.game.phase!=='setup'||this.game.handoff)return; this.pendingPlacement=null; if(this.game.randomPlaceFleet(this.game.setupPlayer)){this.message('Neue Zufallsformation gesetzt. Du kannst jetzt starten.');this.save();this.render();} }
  confirmPlacement() { const p=this.pendingPlacement;if(!p)return; if(this.game.place(this.game.setupPlayer,p.start,p.length,p.horizontal)){this.pendingPlacement=null;this.message(`${p.length}er-Schiff platziert.`);this.save();this.render();} }
  previewCells() { const p=this.pendingPlacement;if(!p)return [];return Array.from({length:p.length},(_,i)=>p.horizontal?p.start+i:p.start+i*10); }
  cell(board, className, onClick) { const el=document.createElement('button');el.type='button';el.className=`cell ${className}`;el.onclick=onClick;board.appendChild(el); }
  renderGrid(id, player, mode) {
    const grid=document.getElementById(id);grid.innerHTML='';
    for(let i=0;i<100;i++) { const ship=this.game.boards[player][i], shooter=mode==='target'?this.game.currentPlayer:this.opponent(player),shot=this.game.shots[shooter][i];let state='';
      if(mode==='setup'||mode==='own')state=ship?'ship':'';
      if(mode==='own'&&!this.fleetVisible)state='concealed';
      if(mode==='setup'&&this.previewCells().includes(i))state+=' preview';
      if(shot===1)state+=' miss';
      if(shot===2)state+=this.game.shipSunk(player,ship)?' sunk':' hit';
      const clickable=(mode==='setup'&&!this.pendingPlacement)||(mode==='target'&&!shot&&this.game.phase==='battle'&&!(this.game.mode==='computer'&&this.game.currentPlayer==='black'));
      this.cell(grid,state,clickable?()=>this.clickCell(i,mode):null);
    }
  }
  clickCell(index, mode) {
    if(mode==='setup') { const n=this.game.placed[this.game.setupPlayer].length,length=BattleshipGame.fleet[n];if(this.game.canPlace(this.game.setupPlayer,index,length,this.horizontal)){this.pendingPlacement={start:index,length,horizontal:this.horizontal};this.message('Passt das so? Mit ✓ bestätigen oder ✕ neu setzen.');this.render();}else this.message('Dort passt das Schiff nicht hin. Schiffe dürfen sich nicht berühren.');return; }
    const result=this.game.shoot(index);if(!result)return;this.message('');this.save();this.showShot('Du');
  }
  showShot(owner) { this.showingShot=true;this.shotOwner=owner;clearTimeout(this.shotTimer);this.render();this.shotTimer=setTimeout(()=>{this.showingShot=false;if(this.game.mode==='computer'){this.game.handoff=false;this.game.lastShot=null;if(this.game.phase==='battle'&&this.game.currentPlayer==='black'){this.save();this.render();setTimeout(()=>this.runComputer(),350);return;}this.save();this.render();return;}this.render();},1400); }
  runComputer() { if(this.game.mode!=='computer'||this.game.phase!=='battle'||this.game.currentPlayer!=='black')return; const index=this.game.aiPickShot();if(index===null)return;const result=this.game.shoot(index);if(!result)return;this.save();this.showShot('Computer'); }
  resultText(shot) { return shot.sunk?'💥 VERSENKT!':shot.hit?'🎯 TREFFER!':'🌊 WASSER!'; }
  render() {
    const setup=this.game.phase==='setup',battle=this.game.phase==='battle',finished=this.game.phase==='finished',handoff=this.game.handoff,preview=!!this.pendingPlacement,start=this.choosingStart;
    document.getElementById('start-panel').hidden=!start;document.getElementById('setup').hidden=!setup||handoff||start;document.getElementById('battle').hidden=(!(battle||finished)||handoff||start);document.getElementById('handoff').hidden=!handoff||start;document.getElementById('message').hidden=handoff||start;
    document.getElementById('next').hidden=!setup||handoff||start;document.getElementById('rotate').hidden=!setup||handoff||start;document.getElementById('rotate').disabled=preview;document.getElementById('random').hidden=!setup||handoff||start;document.getElementById('random').disabled=preview;document.getElementById('confirm').hidden=!preview||handoff||start;document.getElementById('cancel').hidden=!preview||handoff||start;document.getElementById('continue').hidden=!handoff||this.showingShot||start;document.getElementById('restart').hidden=handoff||start;
    if(start){document.getElementById('title').textContent='Neue Partie';document.getElementById('hint').textContent='Zu zweit am Gerät oder gegen den Computer?';return;}
    if(handoff){const p=setup?this.game.setupPlayer:this.game.currentPlayer,resultEl=document.getElementById('shot-result'),shot=this.game.lastShot,reveal=this.showingShot;resultEl.hidden=!shot;if(shot){resultEl.className=`shot-result ${reveal?'':'compact'} ${shot.sunk?'sunk':shot.hit?'hit':'miss'}`;resultEl.textContent=this.resultText(shot);}document.getElementById('title').textContent=reveal?'Ergebnis':`🤫 Gerät an ${this.flag(p)} ${this.name(p)} geben`;document.getElementById('hint').textContent=reveal&&shot?.winner?`${this.flag(shot.winner)} ${this.name(shot.winner)} hat gewonnen!`:'';document.getElementById('handoff-name').hidden=true;return;}
    if(this.showingShot){const shot=this.game.lastShot,resultEl=document.getElementById('shot-result');document.getElementById('title').textContent=this.shotOwner==='Computer'?'🤖 Computer schießt':'Ergebnis';document.getElementById('hint').textContent='';document.getElementById('setup').hidden=true;document.getElementById('battle').hidden=true;document.getElementById('handoff').hidden=false;resultEl.hidden=false;resultEl.className=`shot-result ${shot.sunk?'sunk':shot.hit?'hit':'miss'}`;resultEl.textContent=this.resultText(shot);return;}
    if(setup){const p=this.game.setupPlayer,n=this.game.placed[p].length,l=BattleshipGame.fleet[n];document.getElementById('title').textContent=`${this.flag(p)} ${this.name(p)}: Schiffe aufstellen`;document.getElementById('hint').textContent=l?`Setze dein ${l}er-Schiff (${n+1}/5). ${this.horizontal?'Waagerecht':'Senkrecht'}.`:'Alle Schiffe sind bereit.';document.getElementById('next').disabled=!!l;this.renderGrid('setup-board',p,'setup');return;}
    const p=this.game.currentPlayer,enemy=this.opponent(p);document.getElementById('title').textContent=finished?`${this.flag(this.game.winner)} ${this.name(this.game.winner)} gewinnt!`:`${this.game.mode==='computer'&&p==='black'?'🤖 Computer':`${this.flag(p)} ${this.name(p)}`} ist am Zug`;document.getElementById('hint').textContent=finished?'Neues Spiel für die Revanche?':this.game.mode==='computer'&&p==='black'?'Computer überlegt …':'Wähle ein Feld auf dem gegnerischen Meer.';document.getElementById('reveal-fleet').textContent=this.fleetVisible?'🙈 Eigene Flotte verbergen':'👁 Eigene Flotte anzeigen';this.renderGrid('target-board',enemy,'target');this.renderGrid('own-board',p,'own');
  }
  message(text){document.getElementById('message').textContent=text;}
  save(){try{localStorage.setItem('battleship-game',this.game.serialize());}catch(_){}}
  load(){try{const s=localStorage.getItem('battleship-game');if(!s)return false;if(!this.game.deserialize(s)){localStorage.removeItem('battleship-game');return false;}return true;}catch(_){return false;}}
}
if (typeof module !== 'undefined' && module.exports) module.exports = { BattleshipUI };
if (typeof document !== 'undefined') document.addEventListener('DOMContentLoaded',()=>window.battleship=new BattleshipUI());
