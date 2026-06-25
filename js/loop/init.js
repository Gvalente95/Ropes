function initRopeSimulation() {
  initCanvas();

  colGrid = new CollisionGrid();
  cam = new Camera();
  cinematics = new CinematicManager();
  input = new Input();
  mouse = new Mouse();
  snakeBasketball = new SnakeBasketball();
  minimap = new Minimap(v2(winSize.x * 0.8, 0), v2(winSize.x * 0.2, winSize.y * 0.1));
  setPreset(firstPreset);
  loop();
}

function initGrass() {
  grass = [];

  var density = 0.2;
  var baseHeight = 120;
  var stripWidth = winSize.x + 300;
  var am = Math.ceil(stripWidth * density);
  var spacing = stripWidth / am;

  for (let i = 0; i < am; i++) {
    var startAngle = Math.PI / 2;
    var x = i * spacing;

    grass.push({
      localX: x,
      z: r_range(0, 2),
      startAngle,
      angle: startAngle + i * 0.001,
      angDir: Math.random() < 0.5 ? -1 : 1,
      length: baseHeight * r_range(0.8, 1.2),
      color: randomizeColor("rgb(130, 129, 33)"),
    });
  }
}

function initBackElements() {
  backgroundElements = [];
  let base = groundLevel;
  let clr = getMountainColor();
  initBackground(base - 300, 30, 800, 1200, 10, 50, 100, clr);
  clr = addColor(clr, "rgb(0,0,0)", 0.2);
  initBackground(base - 150, 20, 400, 800, 10, 50, 100, clr);
  clr = addColor(clr, "rgb(0,0,0)", 0.2);
  initBackground(base, 7, 800, 1200, 10, 50, 100, clr);
}

function initBackground(y = 4500, z = 20, minSpacingX = 400, maxSpacingX = 800, wobAmount = 10, minSpacingY = 50, maxSpacingY = 100, color = "") {
  let v = [];
  let borderWidth = mapSize.x * 10;
  for (let x = 0; x < borderWidth; x += r_range(minSpacingX, maxSpacingX)) {
    v.push(v2(x, y + r_range(-minSpacingY, maxSpacingY)));
  }
  v.push(v2(borderWidth, y + 800));
  v.push(v2(0, y + 800));
  const shape = Polygon.instantiate(v, color, true, wobAmount, "sine", z);
}
