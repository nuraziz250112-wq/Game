const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

resize();
window.addEventListener("resize", resize);

// Әлем
const TILE = 32;
const WORLD_W = 150;
const WORLD_H = 60;

let world = [];

for (let y = 0; y < WORLD_H; y++) {
  world[y] = [];

  for (let x = 0; x < WORLD_W; x++) {

    let ground = 15 + Math.floor(
      Math.sin(x * 0.15) * 2 +
      Math.sin(x * 0.04) * 4
    );

    if (y < ground) {
      world[y][x] = 0; // ауа
    }
    else if (y === ground) {
      world[y][x] = 1; // шөп
    }
    else if (y < ground + 4) {
      world[y][x] = 2; // топырақ
    }
    else {
      world[y][x] = 3; // тас
    }
  }
}

// Ойыншы
const player = {
  x: 10 * TILE,
  y: 5 * TILE,
  w: 24,
  h: 30,
  vx: 0,
  vy: 0,
  speed: 4,
  jump: 11,
  grounded: false
};

let cameraX = 0;
let cameraY = 0;

let keys = {
  left: false,
  right: false
};

let inventory = 20;

// Блок түстері
const colors = {
  1: "#35a852",
  2: "#9b642f",
  3: "#777777"
};

function solid(x, y) {
  if (x < 0 || y < 0 || x >= WORLD_W || y >= WORLD_H)
    return true;

  return world[y][x] !== 0;
}

function collision(px, py, pw, ph) {

  let left = Math.floor(px / TILE);
  let right = Math.floor((px + pw) / TILE);
  let top = Math.floor(py / TILE);
  let bottom = Math.floor((py + ph) / TILE);

  for (let y = top; y <= bottom; y++) {
    for (let x = left; x <= right; x++) {

      if (solid(x, y)) {
        return true;
      }
    }
  }

  return false;
}

// Қозғалыс
function update() {

  player.vx = 0;

  if (keys.left)
    player.vx = -player.speed;

  if (keys.right)
    player.vx = player.speed;

  // X
  player.x += player.vx;

  if (collision(player.x, player.y, player.w, player.h)) {

    if (player.vx > 0)
      player.x = Math.floor((player.x + player.w) / TILE) * TILE - player.w;
    else
      player.x = Math.floor(player.x / TILE + 1) * TILE;

  }

  // Гравитация
  player.vy += 0.5;

  if (player.vy > 12)
    player.vy = 12;

  player.y += player.vy;

  if (collision(player.x, player.y, player.w, player.h)) {

    if (player.vy > 0) {
      player.y =
        Math.floor((player.y + player.h) / TILE) * TILE -
        player.h;

      player.grounded = true;
    }
    else {
      player.y =
        Math.floor(player.y / TILE + 1) * TILE;

    }

    player.vy = 0;

  } else {
    player.grounded = false;
  }

  // Камера
  cameraX = player.x - canvas.width / 2;
  cameraY = player.y - canvas.height / 2;

  cameraX = Math.max(0, cameraX);
  cameraY = Math.max(0, cameraY);

  cameraX = Math.min(
    cameraX,
    WORLD_W * TILE - canvas.width
  );

  cameraY = Math.min(
    cameraY,
    WORLD_H * TILE - canvas.height
  );

  document.getElementById("blockCount").textContent = inventory;
}

// Сурет салу
function draw() {

  // аспан
  ctx.fillStyle = "#6ec6ff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // күн
  ctx.fillStyle = "#ffe066";
  ctx.beginPath();
  ctx.arc(80, 80, 35, 0, Math.PI * 2);
  ctx.fill();

  // блоктар
  let startX = Math.floor(cameraX / TILE);
  let endX = startX + Math.ceil(canvas.width / TILE) + 2;

  let startY = Math.floor(cameraY / TILE);
  let endY = startY + Math.ceil(canvas.height / TILE) + 2;

  for (let y = startY; y < endY; y++) {

    for (let x = startX; x < endX; x++) {

      if (x < 0 || y < 0 ||
          x >= WORLD_W || y >= WORLD_H)
        continue;

      let block = world[y][x];

      if (block !== 0) {

        ctx.fillStyle = colors[block];

        ctx.fillRect(
          x * TILE - cameraX,
          y * TILE - cameraY,
          TILE,
          TILE
        );

        ctx.strokeStyle = "rgba(0,0,0,0.15)";
        ctx.strokeRect(
          x * TILE - cameraX,
          y * TILE - cameraY,
          TILE,
          TILE
        );
      }
    }
  }

  // ойыншы
  ctx.fillStyle = "#ff4444";

  ctx.fillRect(
    player.x - cameraX,
    player.y - cameraY,
    player.w,
    player.h
  );
}

// Секіру
function jump() {

  if (player.grounded) {
    player.vy = -player.jump;
    player.grounded = false;
  }
}

// Блок сындыру
function breakBlock() {

  let tx = Math.floor(
    (player.x + player.w / 2) / TILE
  );

  let ty = Math.floor(
    (player.y + player.h / 2) / TILE
  );

  if (world[ty] && world[ty][tx] !== 0) {

    world[ty][tx] = 0;
    inventory++;
  }
}

// Блок қою
function placeBlock() {

  if (inventory <= 0)
    return;

  let tx = Math.floor(
    (player.x + player.w / 2) / TILE
  );

  let ty = Math.floor(
    (player.y + player.h + TILE / 2) / TILE
  );

  if (
    tx >= 0 &&
    ty >= 0 &&
    tx < WORLD_W &&
    ty < WORLD_H &&
    world[ty][tx] === 0
  ) {

    world[ty][tx] = 2;
    inventory--;
  }
}

// Телефон басқаруы
function button(id, down, up) {

  const el = document.getElementById(id);

  el.addEventListener("touchstart", e => {
    e.preventDefault();
    down();
  });

  el.addEventListener("touchend", e => {
    e.preventDefault();
    up();
  });

  // компьютерде де жұмыс істесін
  el.addEventListener("mousedown", down);
  el.addEventListener("mouseup", up);
}

button(
  "left",
  () => keys.left = true,
  () => keys.left = false
);

button(
  "right",
  () => keys.right = true,
  () => keys.right = false
);

document.getElementById("jump")
  .addEventListener("touchstart", e => {
    e.preventDefault();
    jump();
  });

document.getElementById("break")
  .addEventListener("touchstart", e => {
    e.preventDefault();
    breakBlock();
  });

document.getElementById("place")
  .addEventListener("touchstart", e => {
    e.preventDefault();
    placeBlock();
  });

// Пернетақта
window.addEventListener("keydown", e => {

  if (e.key === "ArrowLeft")
    keys.left = true;

  if (e.key === "ArrowRight")
    keys.right = true;

  if (e.key === " " || e.key === "ArrowUp")
    jump();

  if (e.key === "x")
    breakBlock();

  if (e.key === "z")
    placeBlock();
});

// Негізгі цикл
function gameLoop() {

  update();
  draw();

  requestAnimationFrame(gameLoop);
}

gameLoop();
