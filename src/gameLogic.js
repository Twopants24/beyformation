export const DIRECTIONS = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
};

export function placeFood(gridSize, snake, rng = Math.random) {
  const occupied = new Set(snake.map((segment) => `${segment.x},${segment.y}`));
  const freeCells = [];

  for (let y = 0; y < gridSize; y += 1) {
    for (let x = 0; x < gridSize; x += 1) {
      const key = `${x},${y}`;
      if (!occupied.has(key)) {
        freeCells.push({ x, y });
      }
    }
  }

  if (freeCells.length === 0) {
    return null;
  }

  const index = Math.floor(rng() * freeCells.length);
  return freeCells[index];
}

function isOppositeDirection(a, b) {
  return a.x === -b.x && a.y === -b.y;
}

function areSameCell(a, b) {
  return a.x === b.x && a.y === b.y;
}

export function createInitialState(options = {}) {
  const gridSize = options.gridSize ?? 20;
  const snake =
    options.initialSnake ?? [
      { x: 3, y: 10 },
      { x: 2, y: 10 },
      { x: 1, y: 10 },
    ];
  const directionName = options.initialDirection ?? "RIGHT";
  const direction = DIRECTIONS[directionName];
  const food = options.food ?? placeFood(gridSize, snake, options.rng);

  return {
    gridSize,
    snake,
    direction,
    pendingDirection: direction,
    food,
    score: 0,
    gameOver: false,
  };
}

export function setDirection(state, directionName) {
  const direction = DIRECTIONS[directionName];
  if (!direction) {
    return state;
  }

  if (isOppositeDirection(state.direction, direction)) {
    return state;
  }

  return {
    ...state,
    pendingDirection: direction,
  };
}

export function step(state, rng = Math.random) {
  if (state.gameOver || !state.food) {
    return state;
  }

  const direction = state.pendingDirection;
  const currentHead = state.snake[0];
  const nextHead = {
    x: currentHead.x + direction.x,
    y: currentHead.y + direction.y,
  };

  const hitWall =
    nextHead.x < 0 ||
    nextHead.y < 0 ||
    nextHead.x >= state.gridSize ||
    nextHead.y >= state.gridSize;
  if (hitWall) {
    return {
      ...state,
      direction,
      gameOver: true,
    };
  }

  const willEat = areSameCell(nextHead, state.food);
  const bodyToCheck = willEat ? state.snake : state.snake.slice(0, -1);
  const hitBody = bodyToCheck.some((segment) => areSameCell(segment, nextHead));
  if (hitBody) {
    return {
      ...state,
      direction,
      gameOver: true,
    };
  }

  const nextSnake = [nextHead, ...state.snake];
  if (!willEat) {
    nextSnake.pop();
  }

  const nextFood = willEat ? placeFood(state.gridSize, nextSnake, rng) : state.food;

  return {
    ...state,
    direction,
    snake: nextSnake,
    food: nextFood,
    score: willEat ? state.score + 1 : state.score,
  };
}
