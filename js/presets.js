function snakesInSpace(am = 10) {
  colGrid.init(200, false);
  SelfCollisionsInterval = 5;
  gravity = v2(0, 0);
  for (let i = 0; i < am; i++) {
    var r = Snake.instantiate(mouse.pos);
    if (i === am - 1) r.control();
  }
  for (let i = 0; i < am / 2; i++) {
    var size = r_range(10, 40);
    Ball.instantiate(rand_v2(), size);
  }
}

function forrest(am = 100) {
  colGrid.init(window.innerWidth / 8, false);
  SelfCollisionsInterval = 50;
  gravity = v2(0, 100);
  for (let i = 0; i < am; i++) {
    var p = v2((mapSize.x / am) * i, groundLevel);
    var _thick = r_range_int(1, 4);
    var _segAmount = r_range_int(35, 45);
    var _segSp = r_range_int(8, 12);
    var r = new Rope(p, p, "rgba(101, 235, 228, 1)", _thick, _segAmount, _segSp);
    r.gravity.y = -75;
    r.setSpines();
    r.spineSize.x = 5;
    r.spineSize.y = 40;
    r.spineOnBothSides = r_range_int(0, 2) === 0;
    r.setPointy(-0.75);

    // r.color2 = "rgba(0, 255, 51, 1)";

    r.segments[r.segments.length - 1].setAnchor(null);
    ropes.push(r);
  }
  shakeAll(5);
  var s = Ball.instantiate(v2(0, groundLevel * 0.1), 60);
  s.vel.x = 1000;
  s.mass = 1000000;
  s.gravity = v2(0, 100);
}

function weirdWorld(am = 400) {
  colGrid.init(200, false);
  numOfConstraintsRuns = 1;
  SelfCollisionsInterval = 0;
  showAnchors = false;
  gravity = v2(0, 0);
  var limit = 100;
  for (let i = 0; i < am; i++) {
    var p = v2(r_range(limit, mapSize.x - limit), r_range(limit, groundLevel - limit));
    var r = new Rope(p, p, getRandomColor(), 1, 60, 3);
    r.segments[r.segments.length - 1].setAnchor(null);
    ropes.push(r);
  }
  for (let i = 0; i < 4; i++) {
    var s = Ball.instantiate(rand_v2());
    s.vel = rand_v2(v2(-1000, 1000), v2(-1000, 1000));
    s.gravity.x = s.gravity.y = 0;
    s.bounceFactor = 1;
    s.dragFactor = 1;
  }
  //   Shape.setGlobalGravity(v2(0, 100));
  var p = v2(mapSize.x / 2, groundLevel / 2);
  var airPusher = AirPusher.instantiate(p, 0);
  player = airPusher;
}

function hairWorld(am = 500) {
  gravity = v2(-50, 0);
  var limit = 100;
  for (let i = 0; i < am; i++) {
    var p = v2(r_range(limit, mapSize.x - limit), r_range(limit, groundLevel - limit));
    var r = new Rope(p, p, getRandomColor(), 1, 120, 1);
    r.segments[r.segments.length - 1].setAnchor(null);
    ropes.push(r);
  }
  Rope.globalModifier(1, 30, 20);
  shakeAll(5);
  SelfCollisionsInterval = 0;
  var p = v2(mapSize.x / 2, groundLevel * 0.9);
  var airPusher = AirPusher.instantiate(p, -Math.PI / 2);
  airPusher.baseForce = 40;
  numOfConstraintsRuns = 5;
  showAnchors = false;
  Ball.instantiate();
  airPusher.control();
}

function animatedWorld() {
  gravity = v2(0, 100);
  numOfConstraintsRuns = 2;
  SelfCollisionsInterval = 0;

  var am = 100;
  var dur = 100;
  for (let i = 0; i < am; i++) {
    setTimeout(() => {
      if (input.lastKey === "r") return;
      var segSpace = Math.max((am - i) / 3, 0.1);
      segSpace = r_range(0.2, 0.4);
      var segAmount = r_range_int(20, 30);
      ropes.push(new Rope(v2(40 + (mapSize.x / am) * i, 20), null, getRandomColor(), r_range_int(1, 4), segAmount, segSpace));
    }, i * dur);
  }
  setTimeout(
    () => {
      if (input.lastKey === "r") return;
      var circle = new Ball(v2(mapSize.x - 100, groundLevel * 0.9), v2(80, 80));
      circle.vel.x = -1500;
      circle.vel.y = -1500;
      circle.bounceFactor = 1;
      circle.drag = 0.1;
      shapes.push(circle);
    },
    am * 1 * dur,
  );
}

function borderGrass() {
  colGrid.init(1, false);
  gravity = v2(0, 0);
  SelfCollisionsInterval = 0;
  showAnchors = false;
  let am = 10;
  let gravAm = 5;
  ropeShaker = 0.05;
  var pad = 5;
  let dirs = ["left", "up", "right", "down"];
  for (const d of dirs) {
    for (let i = 0; i < am; i++) {
      var p;
      var grav = v2(gravity.x, gravity.y);
      grav.y = d === "down" ? -gravAm : d === "up" ? gravAm : 0;
      grav.x = d === "right" ? -gravAm : d === "left" ? gravAm : 0;

      if (d === "down") p = v2((mapSize.x / am) * i, groundLevel - pad);
      else if (d === "left") p = v2(pad, (groundLevel / am) * i);
      else if (d === "right") p = v2(mapSize.x - pad, (groundLevel / am) * i);
      else if (d === "up") p = v2((mapSize.x / am) * i, pad);
      var r = new Rope(p, p, getRandomColor(), 2, d === "down" || d === "up" ? 50 : 70, 10);
      r.gravity = grav;
      r.segments[r.segments.length - 1].setAnchor(null);
      ropes.push(r);
      var s = Ball.instantiate(p, 5);
      s.gravity = grav;
      r.segments[r.segments.length - 1].attachToShape(s);
    }
  }
  var p = v2(mapSize.x / 2, groundLevel / 2);
  var airPusher = AirPusher.instantiate(p, 0);
  player = airPusher;
  Shape.removeAll();
}

function hangingSnakes() {
  var am = r_range_int(5, 20);
  colGrid.init(200, false);
  SelfCollisionsInterval = 5;
  gravity = v2(0, 100);

  for (let i = 0; i < am; i++) {
    var p = v2(60 + mapSize.x * (i / am), 100);
    var segAmount = r_range_int(20, 100);
    var thick = r_range_int(2, 30);
    var segSpace = r_range_int(2, 5);
    var r = new Snake(p, null, getRandomColor(), thick, segAmount, segSpace);
    r.segments[0].setAnchor();
    entities.push(r);
  }
}

function setPreset(preset) {
  setMapSize();
  snakeBasketball.active = false;
  cam.follow(null);
  clearAll();
  preset();
  //   cam.center();
  initGrass();
  initBackElements();
}

function bubbles() {
  colGrid.init(200, false);

  for (let i = 0; i < 200; i++) {
    Ball.instantiate(rand_v2(), r_range_int(5, 10));
  }
}

function platformGame() {
  setMapSize(v2(20000, 5000));

  colGrid.init(200, false);
  minimap.hide();
  showHovMenu = false;

  cam.place(v2(500, 5000 - window.innerHeight));

  var x = 2000;
  var w = 200;

  var rect = Rectangle.instantiate(v2(x, groundLevel - 100), v2(w, 100));
  rect.rotationEnabled = false;
  var rect = Rectangle.instantiate(v2(x + w * 1.5, groundLevel - 200), v2(w, 200));
  rect.rotationEnabled = false;

  var snake = Snake.instantiate(v2(x + w * 4, groundLevel - 20));
  snake.setPointy(-0.3);

  var x = 4000;

  Ball.instantiate(v2(x, groundLevel - 200), 50);

  var rect = Rectangle.instantiate(v2(x + 500, groundLevel - 500), v2(50, 500));
  rect.rotationEnabled = false;

  var playerSnake = new Snake(v2(-100, groundLevel - 20), v2(50, groundLevel - 20));
  playerSnake.segments[playerSnake.segments.length - 1].setAnchor(null);
  playerSnake.setPointy(-0.2);
  playerSnake.follow(v2(window.innerWidth / 2 + 550, groundLevel - 20), () => playerSnake.control());
  entities.push(playerSnake);
}

function bridgePreset() {
  colGrid.init(200, false);
  ropes.push(new Rope(v2(50, 50), v2(500, 500)));
}
