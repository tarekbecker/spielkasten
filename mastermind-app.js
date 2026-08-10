class MastermindUI {
  constructor() {
    this.game = new MastermindGame();
    this.board = document.getElementById('guess-board');
    this.message = document.getElementById('message');
    this.load();
    this.bind();
    this.render();
  }

  bind() {
    document.getElementById('palette').addEventListener('click', event => {
      const color = event.target.closest('[data-color]')?.dataset.color;
      if (color && this.game.addColor(color)) { this.save(); this.render(); }
    });
    this.board.addEventListener('click', event => {
      const dot = event.target.closest('.current .code-dot[data-index]');
      if (dot && this.game.removeColor(Number(dot.dataset.index))) { this.save(); this.render(); }
    });
    document.getElementById('submit').addEventListener('click', () => {
      const score = this.game.submitGuess();
      if (!score) { this.show('Wähle erst vier Farben.'); return; }
      this.save();
      this.show(score.exact === 4 ? '🎉 Geknackt!' : this.game.gameOver ? 'Fast! Der Code wird gezeigt.' : 'Hinweis erhalten – weiter raten!');
      this.render();
    });
    document.getElementById('new-game').addEventListener('click', () => { this.game.restart(); this.save(); this.show('Neuer Geheimcode – los geht’s!'); this.render(); });
    document.querySelector('.controls').insertAdjacentHTML('afterbegin', '<button id="clear-current" class="secondary">↩️ Tipp leeren</button>');
    document.getElementById('clear-current').addEventListener('click', () => { if (!this.game.current.length) return; this.game.current=[]; this.save(); this.render(); this.show('Tipp geleert.'); });
    document.getElementById('attempt-limit').addEventListener('change', event => { this.game.setMaxGuesses(Number(event.target.value)); this.save(); this.show(`Neuer Geheimcode – du hast ${this.game.maxGuesses} Versuche.`); this.render(); });
  }

  show(text) { this.message.textContent = text; }
  save() { try { localStorage.setItem('mastermind-game', this.game.serialize()); } catch {} }
  load() { try { const saved = localStorage.getItem('mastermind-game'); if (saved && !this.game.deserialize(saved)) localStorage.removeItem('mastermind-game'); } catch {} }

  dots(colors, current = false) {
    return Array.from({ length: 4 }, (_, index) => `<button class="code-dot ${colors[index] || 'empty'}" ${current ? `data-index="${index}" aria-label="${colors[index] ? 'Farbe entfernen' : 'Leerer Platz'}"` : 'disabled'}></button>`).join('');
  }

  feedback(exact, colorOnly) {
    return `<div class="feedback" aria-label="${exact} richtig platziert, ${colorOnly} richtige Farbe">${'<span class="key exact"></span>'.repeat(exact)}${'<span class="key color"></span>'.repeat(colorOnly)}${'<span class="key empty-key"></span>'.repeat(4 - exact - colorOnly)}</div>`;
  }

  render() {
    const rows = [];
    for (let i = this.game.maxGuesses - 1; i >= 0; i--) {
      const guess = this.game.guesses[i];
      rows.push(guess ? `<div class="guess-row done"><span class="attempt">${i + 1}</span><div class="code">${this.dots(guess.colors)}</div>${this.feedback(guess.exact, guess.colorOnly)}</div>` : `<div class="guess-row"><span class="attempt">${i + 1}</span><div class="code">${this.dots([])}</div><div class="feedback muted"></div></div>`);
    }
    this.board.innerHTML = `<div class="guess-row current"><span class="attempt">?</span><div class="code">${this.dots(this.game.current, true)}</div><div class="feedback muted"></div></div>${rows.join('')}`;
    const secret = document.getElementById('secret');
    secret.innerHTML = this.game.gameOver ? `<span>Geheimcode:</span><div class="code">${this.dots(this.game.secret)}</div>` : '<span>Geheimcode:</span><div class="code hidden-code"><i></i><i></i><i></i><i></i></div>';
    document.getElementById('submit').disabled = this.game.current.length !== 4 || this.game.gameOver;
    document.getElementById('clear-current').disabled = !this.game.current.length || this.game.gameOver;
    document.getElementById('submit').textContent = this.game.gameOver ? (this.game.won ? 'Gewonnen! 🎉' : 'Runde vorbei') : 'Tipp prüfen';
    document.getElementById('tries').textContent = `${this.game.guesses.length} / ${this.game.maxGuesses} Versuche`;
    document.getElementById('attempt-limit').value = this.game.maxGuesses;
  }
}

if (typeof document !== 'undefined') document.addEventListener('DOMContentLoaded', () => new MastermindUI());
