/** Mastermind game rules. Kept separate from the UI so scoring stays testable. */
const MASTERMIND_COLORS = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
const MASTERMIND_CODE_LENGTH = 4;
const MASTERMIND_MAX_GUESSES = 10;
const MASTERMIND_GUESS_OPTIONS = [10, 15, 20];

function randomCode(random = Math.random) {
  return Array.from({ length: MASTERMIND_CODE_LENGTH }, () =>
    MASTERMIND_COLORS[Math.floor(random() * MASTERMIND_COLORS.length)]
  );
}

function scoreGuess(secret, guess) {
  let exact = 0;
  const secretRemainder = [];
  const guessRemainder = [];
  for (let i = 0; i < MASTERMIND_CODE_LENGTH; i++) {
    if (secret[i] === guess[i]) exact++;
    else {
      secretRemainder.push(secret[i]);
      guessRemainder.push(guess[i]);
    }
  }
  const available = new Map();
  secretRemainder.forEach(color => available.set(color, (available.get(color) || 0) + 1));
  let colorOnly = 0;
  guessRemainder.forEach(color => {
    const count = available.get(color) || 0;
    if (count) {
      colorOnly++;
      available.set(color, count - 1);
    }
  });
  return { exact, colorOnly };
}

class MastermindGame {
  constructor(random = Math.random) {
    this.random = random;
    this.restart();
  }

  restart(maxGuesses = this.maxGuesses || MASTERMIND_MAX_GUESSES) {
    this.maxGuesses = MASTERMIND_GUESS_OPTIONS.includes(Number(maxGuesses)) ? Number(maxGuesses) : MASTERMIND_MAX_GUESSES;
    this.secret = randomCode(this.random);
    this.guesses = [];
    this.current = [];
    this.gameOver = false;
    this.won = false;
  }

  setMaxGuesses(maxGuesses) { if (!MASTERMIND_GUESS_OPTIONS.includes(Number(maxGuesses))) return false; this.restart(Number(maxGuesses)); return true; }

  addColor(color) {
    if (this.gameOver || !MASTERMIND_COLORS.includes(color) || this.current.length >= MASTERMIND_CODE_LENGTH) return false;
    this.current.push(color);
    return true;
  }

  removeColor(index) {
    if (this.gameOver || index < 0 || index >= this.current.length) return false;
    this.current.splice(index, 1);
    return true;
  }

  submitGuess() {
    if (this.gameOver || this.current.length !== MASTERMIND_CODE_LENGTH) return null;
    const colors = [...this.current];
    const score = scoreGuess(this.secret, colors);
    this.guesses.push({ colors, ...score });
    this.current = [];
    this.won = score.exact === MASTERMIND_CODE_LENGTH;
    this.gameOver = this.won || this.guesses.length >= this.maxGuesses;
    return score;
  }

  serialize() {
    return JSON.stringify({ secret: this.secret, guesses: this.guesses, current: this.current, gameOver: this.gameOver, won: this.won, maxGuesses: this.maxGuesses });
  }

  deserialize(value) {
    try {
      const state = JSON.parse(value);
      if (!Array.isArray(state.secret) || state.secret.length !== MASTERMIND_CODE_LENGTH || !state.secret.every(c => MASTERMIND_COLORS.includes(c)) || !Array.isArray(state.guesses) || !Array.isArray(state.current)) return false;
      this.secret = state.secret;
      this.guesses = state.guesses;
      this.current = state.current;
      this.gameOver = Boolean(state.gameOver);
      this.won = Boolean(state.won); this.maxGuesses = MASTERMIND_GUESS_OPTIONS.includes(Number(state.maxGuesses)) ? Number(state.maxGuesses) : MASTERMIND_MAX_GUESSES;
      return true;
    } catch { return false; }
  }
}

if (typeof module !== 'undefined' && module.exports) module.exports = { MASTERMIND_COLORS, MASTERMIND_CODE_LENGTH, MASTERMIND_MAX_GUESSES, MASTERMIND_GUESS_OPTIONS, randomCode, scoreGuess, MastermindGame };
