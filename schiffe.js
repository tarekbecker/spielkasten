class BattleshipGame {
  static fleet = [5, 4, 3, 3, 2];
  constructor() { this.restart(); }
  restart(mode = 'human', aiLevel = 'medium') {
    this.boards = { white: Array(100).fill(0), black: Array(100).fill(0) };
    this.shots = { white: Array(100).fill(0), black: Array(100).fill(0) };
    this.placed = { white: [], black: [] }; this.setupPlayer = 'white'; this.currentPlayer = 'white'; this.phase = 'setup'; this.winner = null; this.handoff = false; this.lastShot = null; this.mode = mode; this.aiLevel = aiLevel;
  }
  canPlace(player, start, length, horizontal) {
    const row = Math.floor(start / 10), col = start % 10;
    if (horizontal ? col + length > 10 : row + length > 10) return false;
    const cells = Array.from({ length }, (_, i) => horizontal ? start + i : start + i * 10);
    for (const cell of cells) {
      const r = Math.floor(cell / 10), c = cell % 10;
      for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < 10 && nc >= 0 && nc < 10 && this.boards[player][nr * 10 + nc]) return false;
      }
    }
    return true;
  }
  place(player, start, length, horizontal) {
    if (this.phase !== 'setup' || player !== this.setupPlayer || this.placed[player].length >= BattleshipGame.fleet.length || BattleshipGame.fleet[this.placed[player].length] !== length || !this.canPlace(player, start, length, horizontal)) return false;
    const cells = Array.from({ length }, (_, i) => horizontal ? start + i : start + i * 10);
    cells.forEach(cell => { this.boards[player][cell] = this.placed[player].length + 1; });
    this.placed[player].push(cells); return true;
  }
  randomPlaceRemaining(player, random = Math.random, ignoreSetupPlayer = false) {
    if (this.phase !== 'setup' || (!ignoreSetupPlayer && player !== this.setupPlayer)) return false;
    while (this.placed[player].length < BattleshipGame.fleet.length) {
      const length = BattleshipGame.fleet[this.placed[player].length];
      const candidates = [];
      for (let start = 0; start < 100; start++) for (const horizontal of [true, false]) {
        if (this.canPlace(player, start, length, horizontal)) candidates.push({ start, horizontal });
      }
      if (!candidates.length) return false;
      const candidate = candidates[Math.floor(random() * candidates.length)];
      if (!this.place(player, candidate.start, length, candidate.horizontal)) return false;
    }
    return true;
  }
  randomPlaceFleet(player, random = Math.random) {
    if (this.phase !== 'setup' || player !== this.setupPlayer) return false;
    this.boards[player].fill(0);
    this.placed[player] = [];
    return this.randomPlaceRemaining(player, random);
  }
  finishSetup() {
    if (this.placed[this.setupPlayer].length !== BattleshipGame.fleet.length) return false;
    this.lastShot = null;
    if (this.setupPlayer === 'white' && this.mode === 'computer') { this.setupPlayer='black'; this.randomPlaceRemaining('black'); this.phase = 'battle'; this.currentPlayer = 'white'; return 'battle'; }
    if (this.setupPlayer === 'white') { this.setupPlayer = 'black'; this.handoff = true; return 'black'; }
    this.phase = 'battle'; this.currentPlayer = 'white'; this.handoff = true; return 'battle';
  }
  shoot(index) {
    if (this.phase !== 'battle' || this.shots[this.currentPlayer][index]) return null;
    const opponent = this.currentPlayer === 'white' ? 'black' : 'white';
    const hit = this.boards[opponent][index] > 0;
    this.shots[this.currentPlayer][index] = hit ? 2 : 1;
    const sunk = hit && this.shipSunk(opponent, this.boards[opponent][index]);
    const result = { hit, sunk, winner: null };
    if (this.boards[opponent].every((ship, cell) => !ship || this.shots[this.currentPlayer][cell] === 2)) { this.winner = this.currentPlayer; this.phase = 'finished'; result.winner = this.winner; }
    else this.currentPlayer = opponent;
    this.lastShot = result;
    this.handoff = true;
    return result;
  }
  shipSunk(player, shipId) { return this.boards[player].every((ship, cell) => ship !== shipId || this.shots[player === 'white' ? 'black' : 'white'][cell] === 2); }
  availableShots(player) { return this.shots[player].map((shot,index)=>shot?null:index).filter(index=>index!==null); }
  unsunkShipLengths(player) { return this.placed[player].filter(cells=>!cells.every(cell=>this.shots[this.opponent(player)][cell]===2)).map(cells=>cells.length); }
  opponent(player) { return player === 'white' ? 'black' : 'white'; }
  unsunkHitGroups(player, target) {
    const hits = this.shots[player].map((shot, index) => shot === 2 && !this.shipSunk(target, this.boards[target][index]) ? index : null).filter(index => index !== null);
    const remaining = new Set(hits), groups = [];
    while (remaining.size) {
      const first = remaining.values().next().value, group = [], queue = [first];
      remaining.delete(first);
      while (queue.length) {
        const index = queue.pop(); group.push(index);
        for (const delta of [-10, 10, -1, 1]) {
          const next = index + delta;
          if (next < 0 || next >= 100 || (delta === -1 && index % 10 === 0) || (delta === 1 && index % 10 === 9) || !remaining.has(next)) continue;
          remaining.delete(next); queue.push(next);
        }
      }
      groups.push(group);
    }
    return groups;
  }
  aiPickShot(random = Math.random) {
    const player='black', target='white', available=this.availableShots(player); if(!available.length) return null;
    if(this.aiLevel==='easy') return available[Math.floor(random()*available.length)];
    const hitGroups=this.unsunkHitGroups(player,target), hits=hitGroups.flat();
    const neighbours=[]; for(const index of hits) for(const delta of [-10,10,-1,1]) { const candidate=index+delta; if(candidate<0||candidate>=100||(delta===-1&&index%10===0)||(delta===1&&index%10===9)||this.shots[player][candidate]) continue; neighbours.push(candidate); }
    if(this.aiLevel==='medium' && neighbours.length) return neighbours[Math.floor(random()*neighbours.length)];
    if(this.aiLevel==='medium') return available[Math.floor(random()*available.length)];
    const heat=Array(100).fill(0), lengths=this.unsunkShipLengths(target);
    for(const length of lengths) for(let start=0;start<100;start++) for(const horizontal of [true,false]) {
      const row=Math.floor(start/10),col=start%10;if(horizontal?col+length>10:row+length>10)continue;
      const cells=Array.from({length},(_,i)=>horizontal?start+i:start+i*10);
      if(cells.some(cell=>this.shots[player][cell]===1))continue;
      // Once a ship is hit, hunt it down. A candidate must explain one whole
      // hit group and must not silently merge hits from two different ships.
      const coveredGroups=hitGroups.filter(group=>group.every(hit=>cells.includes(hit)));
      if(hitGroups.length && (!coveredGroups.length || hits.some(hit=>cells.includes(hit)&&!coveredGroups.some(group=>group.includes(hit))))) continue;
      cells.forEach(cell=>{if(!this.shots[player][cell])heat[cell]++;});
    }
    // Hard still uses the heatmap to choose the best direction, but it must
    // always fire directly beside an unfinished hit before searching anew.
    const huntChoices=[...new Set(neighbours)];
    const pool=hitGroups.length&&huntChoices.length?huntChoices:available;
    const top=Math.max(...pool.map(index=>heat[index]));const choices=pool.filter(index=>heat[index]===top);
    return choices[Math.floor(random()*choices.length)];
  }
  serialize() { return JSON.stringify({ boards:this.boards, shots:this.shots, placed:this.placed, setupPlayer:this.setupPlayer, currentPlayer:this.currentPlayer, phase:this.phase, winner:this.winner, handoff:this.handoff, lastShot:this.lastShot, mode:this.mode, aiLevel:this.aiLevel }); }
  deserialize(raw) {
    try { const d = JSON.parse(raw), players = ['white','black']; if (!players.every(p => Array.isArray(d.boards?.[p]) && d.boards[p].length === 100 && Array.isArray(d.shots?.[p]) && d.shots[p].length === 100 && Array.isArray(d.placed?.[p])) || !['setup','battle','finished'].includes(d.phase) || !players.includes(d.currentPlayer) || !players.includes(d.setupPlayer)) return false; Object.assign(this,d); this.mode=d.mode==='computer'?'computer':'human'; this.aiLevel=['easy','medium','hard'].includes(d.aiLevel)?d.aiLevel:'medium'; this.handoff=!!d.handoff; this.lastShot=d.lastShot && typeof d.lastShot.hit === 'boolean' ? d.lastShot : null; return true; } catch (_) { return false; }
  }
}
if (typeof module !== 'undefined') module.exports = { BattleshipGame };
