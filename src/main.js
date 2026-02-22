import { createInitialState, setDirection, step } from "./gameLogic.js";

const TICK_MS = 140;
const GRID_SIZE = 45;

const boardEl = document.getElementById("board");
const scoreEl = document.getElementById("score");
const statusEl = document.getElementById("status");
const restartBtn = document.getElementById("restart");
const pauseBtn = document.getElementById("pause");
const controlButtons = document.querySelectorAll("[data-direction]");

let state = createInitialState({ gridSize: GRID_SIZE });
let tickHandle = null;
let paused = false;

boardEl.style.gridTemplateColumns = `repeat(${GRID_SIZE}, 1fr)`;
boardEl.style.gridTemplateRows = `repeat(${GRID_SIZE}, 1fr)`;

function directionFromKey(key) {
  switch (key) {
    case "ArrowUp":
    case "w":
    case "W":
      return "UP";
    case "ArrowDown":
    case "s":
    case "S":
      return "DOWN";
    case "ArrowLeft":
    case "a":
    case "A":
      return "LEFT";
    case "ArrowRight":
    case "d":
    case "D":
      return "RIGHT";
    default:
      return null;
  }
}

function render() {
  scoreEl.textContent = String(state.score);
  pauseBtn.textContent = paused ? "Resume" : "Pause";

  if (state.gameOver) {
    statusEl.textContent = "Game over. Press Restart.";
  } else if (paused) {
    statusEl.textContent = "Paused.";
  } else {
    statusEl.textContent = "";
  }

  const snakeSet = new Set(state.snake.map((segment) => `${segment.x},${segment.y}`));
  const foodKey = state.food ? `${state.food.x},${state.food.y}` : null;

  const cells = [];
  for (let y = 0; y < state.gridSize; y += 1) {
    for (let x = 0; x < state.gridSize; x += 1) {
      const key = `${x},${y}`;
      const classes = ["cell"];
      if (snakeSet.has(key)) classes.push("snake");
      if (foodKey === key) classes.push("food");
      cells.push(`<div class="${classes.join(" ")}"></div>`);
    }
  }

  boardEl.innerHTML = cells.join("");
}

function restart() {
  state = createInitialState({ gridSize: GRID_SIZE });
  paused = false;
  startLoop();
  render();
}

function gameTick() {
  if (paused) {
    return;
  }

  state = step(state);
  render();

  if (state.gameOver) {
    stopLoop();
  }
}

function stopLoop() {
  if (tickHandle) {
    window.clearInterval(tickHandle);
    tickHandle = null;
  }
}

function startLoop() {
  stopLoop();
  tickHandle = window.setInterval(gameTick, TICK_MS);
}

function togglePause() {
  if (state.gameOver) return;
  paused = !paused;
  render();
}

document.addEventListener("keydown", (event) => {
  if (event.key === " ") {
    event.preventDefault();
    togglePause();
    return;
  }

  const direction = directionFromKey(event.key);
  if (!direction) return;

  event.preventDefault();
  state = setDirection(state, direction);
});

controlButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const direction = button.getAttribute("data-direction");
    state = setDirection(state, direction);
  });
});

restartBtn.addEventListener("click", restart);
pauseBtn.addEventListener("click", togglePause);

render();
startLoop();
