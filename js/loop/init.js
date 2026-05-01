function initRopeSimulation() {
  initCanvas();
  initGrass();
  colGrid = new CollisionGrid();
  cam = new Camera();
  cam.center();
  minimap = new Minimap(v2(winSize.x * 0.8, 0), v2(winSize.x * 0.2, winSize.y * 0.1));
  startPreset();
  loop();
}

function initGrass() {
  grass = [];
  var am = 400;
  var baseHeight = 50;
  var spacing = mapSize.x / am;
  for (let i = 0; i < am; i++) {
    var ang = Math.PI / 2;
    var p = v2(i * spacing, groundLevel);
    grass.push({ startAngle: ang, angle: ang + i * 0.001, angDir: 1, length: baseHeight * r_range(0.8, 1.2), pos: p, color: "white" });
  }
}
