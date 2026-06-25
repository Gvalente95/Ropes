function updateInputs() {
  var hov = hovSegment || hovShape || hovDirPusher || hovAirPusher;
  var k = input.keyClicked;

  switch (k) {
    case "p":
      paused = !paused;
      break;
    case "m":
      minimap.shown = !minimap.shown;
      break;
    case "escape":
      player = player2 = null;
      cam.follow(null);
      break;
    case "h":
      showHovMenu = !showHovMenu;
      break;
    case "enter":
      if (hovSegment && typeof hovSegment.rope.control === "function") hovSegment.rope.control();
      else if (hovShape) hovShape.control();
      break;
    case "f":
      cam.follow(hov);
      break;
    case " ":
      if (!player && !contextMenu.hasHov) contextMenu.show();

      break;
    case "backspace":
    case "x":
      if (hovSegment && hovSegment.isAnchor) hovSegment.setAnchor(null);
      else if (hovSegment) hovSegment.rope.remove();
      else if (hovShape) hovShape.remove();
      else if (hovAirPusher) hovAirPusher.remove();
      else if (hovDirPusher) hovDirPusher.remove();
      break;
  }

  if (input.keys["k"]) {
    for (let i = 0; i < 10; i++) {
      var b = Ball.instantiate(v2(mouse.world.x + i * 10, mouse.world.y), 4);
      //   b.dragFactor = 0;
      //   b.bounceFactor = 0;
    }
  }
  if (input.keys["z"]) shakeAll();
  if (input.keys["r"]) clearAll();
}
function updateSegSelection() {
  if (!selAirPusher && !selDirPusher && !selShape && !selSegment) {
    var hovs = colGrid.getAtPos(mouse.world.x, mouse.world.y);
    for (const h of hovs) {
      if (h.rope) {
        var dist = magnitude_v2(mouse.world, h.pos);
        if (dist > Math.max(h.rope.segSpace, h.thick)) continue;
        if (!hovSegment || dist < magnitude_v2(mouse.world, hovSegment.pos)) {
          hovSegment = h;
        }
      } else if (h.type === "CIRCLE" && pointInCircle(mouse.world, h.pos, h.size.x)) {
        hovShape = h;
        break;
      } else if (h.type === "SQUARE" && pointInRect(mouse.world, h.pos, h.size, h.angle)) {
        hovShape = h;
        break;
      }
    }
  }

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
  if (selSegment) {
    selSegment.place(mouse.world);
    selSegment.prevPos = mouse.world;
    if (input.keyClicked === "shift") {
      selSegment.setAnchor();
    }
  }

  if (!selShape && hovShape && mouse.clicked) {
    selShape = hovShape;
    selShape.vel = v2(0, 0);
    if (input.keys["alt"]) selShape.duplicate();
  }

  if (selShape) {
    if (mouse.pressed) selShape.pos = v2(mouse.world.x - selShape.size.x / 2, mouse.world.y - selShape.size.y / 2);
    else {
      selShape.vel = v2(-mouse.delta.x * 40, -mouse.delta.y * 40);
      selShape = null;
    }
  }
  if (colGrid.active) colGrid.update();
}

function update() {
  hovSegment = null;
  hovAirPusher = null;
  hovShape = null;
  hovDirPusher = null;

  if (!contextMenu.active || !contextMenu.hovPath) {
    updateSegSelection();
  }
  updateInputs();
  if (mouse.wheel.x || mouse.wheel.y) {
    cam.move(-mouse.wheel.x, -mouse.wheel.y);
    mouse.setPos();
  } else cam.update();

  if (cinematics.active) {
    cinematics.play();
  }

  if (ropeShaker && frame % 2 === 0) shakeAll(ropeShaker);

  for (const s of shapes) s.update();

  for (const r of ropes) r.update();
  for (const e of entities) e.update();
  for (const p of polygons) p.update();

  if (colGrid.active) colGrid.update();
  render();
  if (snakeBasketball.active) snakeBasketball.update();
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
