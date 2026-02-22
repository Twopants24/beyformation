import test from "node:test";
import assert from "node:assert/strict";
import { createInitialState, setDirection, step, placeFood } from "../src/gameLogic.js";

test("snake moves one cell in current direction", () => {
  const initial = createInitialState({
    gridSize: 10,
    initialSnake: [
      { x: 3, y: 3 },
      { x: 2, y: 3 },
      { x: 1, y: 3 },
    ],
    food: { x: 9, y: 9 },
  });

  const next = step(initial, () => 0);
  assert.deepEqual(next.snake, [
    { x: 4, y: 3 },
    { x: 3, y: 3 },
    { x: 2, y: 3 },
  ]);
  assert.equal(next.score, 0);
});

test("snake grows and increments score when eating food", () => {
  const initial = createInitialState({
    gridSize: 10,
    initialSnake: [
      { x: 3, y: 3 },
      { x: 2, y: 3 },
      { x: 1, y: 3 },
    ],
    food: { x: 4, y: 3 },
  });

  const next = step(initial, () => 0);
  assert.equal(next.snake.length, 4);
  assert.equal(next.score, 1);
  assert.notDeepEqual(next.food, { x: 4, y: 3 });
});

test("wall collision ends game", () => {
  const initial = createInitialState({
    gridSize: 5,
    initialSnake: [
      { x: 4, y: 2 },
      { x: 3, y: 2 },
      { x: 2, y: 2 },
    ],
    food: { x: 0, y: 0 },
  });

  const next = step(initial);
  assert.equal(next.gameOver, true);
});

test("self collision ends game", () => {
  const initial = createInitialState({
    gridSize: 7,
    initialDirection: "UP",
    initialSnake: [
      { x: 3, y: 3 },
      { x: 3, y: 4 },
      { x: 2, y: 4 },
      { x: 2, y: 3 },
      { x: 2, y: 2 },
      { x: 3, y: 2 },
    ],
    food: { x: 0, y: 0 },
  });

  const turned = setDirection(initial, "LEFT");
  const next = step(turned);
  assert.equal(next.gameOver, true);
});

test("food placement never overlaps snake", () => {
  const snake = [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 2, y: 0 },
  ];
  const food = placeFood(3, snake, () => 0);
  assert.notEqual(`${food.x},${food.y}`, "0,0");
  assert.notEqual(`${food.x},${food.y}`, "1,0");
  assert.notEqual(`${food.x},${food.y}`, "2,0");
});
