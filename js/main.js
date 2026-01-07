var screenCenter = new Vec2(window.innerWidth / 2, window.innerHeight / 2);

let player = null;
let player2 = null;

var input = new Input();
var mouse = new Mouse();
var snakeBasketball = new SnakeBasketball();

//	COLLISIONS
let collisionSegmentInteval = 2;
let colCellSize = window.innerWidth / 8;
let SelfCollisionsInterval = 4;
let colGrid = null;
let overlapFactor = 0.25;
let ropeGroundFriction = 0.65;

//	ELEMENTS
let ropes = [];
let entities = [];
let shapes = [];
let airPushers = [];

let winSize = new Vec2(window.innerWidth, window.innerHeight);
//	SELECTION
let useMouse = true;
let selShape = null;
let hovShape = null;
let hovDirPusher = null;
let selDirPusher = null;
let selAirPusher = null;
let hovAirPusher = null;
let selSegment = null;
let prevHov = null;
let hovSegment = null;

//	ROPES PARAMS
let gravity = new Vec2(0, 100);
let segAmount = 50;
let segSpace = 10;
let segThickness = 30;
let dampingFactor = 0.95;
let numOfConstraintsRuns = 50;
let showDots = false;
let ropeShaker = 0;
let showAnchors = true;

// SHAPES
let ShapeScale = 30;

// TIME
let frame = 0;
let dt = 1;
let now = performance.now();
let curFps = 0;
let fps = 0;
let lastFpsTimer = performance.now();

function updateSegSelection() {
  if (input.keys["z"]) shakeAll();
  if (input.keys["r"]) clearAll();

  if (hovSegment && !selSegment && mouse.clicked) {
    selSegment = hovSegment;
    if (input.keys["alt"]) selSegment.rope.duplicate();
    else if (input.keys["shift"]) {
      if (selSegment.isAnchor) selSegment.setAnchor(null);
      else selSegment.setAnchor();
    }
    selSegment.prevAnchor = selSegment.isAnchor;
    selSegment.isAnchor = true;
  } else if (selSegment && !mouse.pressed) {
    selSegment.isAnchor = selSegment.prevAnchor;
    selSegment = null;
  }
  if (selSegment) selSegment.place(new Vec2(mouse.pos.x, mouse.pos.y));

  if (input.keyClicked === "enter") {
    if (hovSegment && typeof hovSegment.rope.control === "function") hovSegment.rope.control();
    if (hovAirPusher) hovAirPusher.control();
  } else if (input.keyClicked === "backspace" || input.keyClicked === "x") {
    if (hovSegment && hovSegment.isAnchor) hovSegment.setAnchor(null);
    else if (hovSegment) hovSegment.rope.remove();
    else if (hovShape) hovShape.remove();
    else if (hovAirPusher) hovAirPusher.remove();
    else if (hovDirPusher) hovDirPusher.remove();
  }

  if (!selShape && hovShape && mouse.clicked) {
    selShape = hovShape;
    selShape.vel = new Vec2(0, 0);
    if (input.keys["alt"]) selShape.duplicate();
  }
}

function update() {
  prevHov = hovSegment;
  hovSegment = null;
  hovAirPusher = null;
  hovShape = null;
  hovDirPusher = null;

  if (ropeShaker && frame % 2 === 0) shakeAll(ropeShaker);
  for (const s of shapes) s.update();
  for (const r of ropes) r.update();
  for (const e of entities) e.update();
  if (colGrid.active) colGrid.update();
  render();
  if (snakeBasketball.active) snakeBasketball.update();
  if (!contextMenu.active || !contextMenu.hovPath) updateSegSelection();
  mouse.reset();
  input.reset();
}

function loop() {
  var newNow = performance.now();
  dt = (newNow - now) / 1000;
  now = newNow;
  if (newNow - lastFpsTimer > 1000) {
    fps = curFps;
    curFps = 0;
    lastFpsTimer = newNow;
  }
  frame++;
  curFps++;
  update();
  requestAnimationFrame(loop);
}

function initRopeSimulation() {
  initCanvas();
  colGrid = new CollisionGrid();
  upsideDownWorld();
  loop();
}
