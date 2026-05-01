class CollisionGrid {
  constructor(cellSize = colCellSize) {
    this.shown = false;
    this.active = true;
    this.init(cellSize, false);
  }

  init(cellSize, show = true) {
    this.active = true;
    this.cellW = Math.round(window.innerWidth / cellSize);
    this.cellH = Math.round(window.innerHeight / cellSize);
    this.cellSize = v2(window.innerWidth / this.cellW, window.innerHeight / this.cellH);
    this.cellMap = new Map();
    if (show && !this.shown) {
      this.shown = true;
      setTimeout(() => (this.shown = false), 2000);
    }
  }

  update() {
    if (!this.active) return;
    this.cellMap = new Map();
    for (const r of ropes) {
      for (let i = 0; i < r.segments.length; i += 1) {
        var s = r.segments[i];
        this.addToMap(s, v2(s.pos.x, s.pos.y));
      }
    }
    for (const s of shapes) {

      // Calculate shape bounds
      let minX, minY, maxX, maxY;
      if (s.type === "CIRCLE") {
        minX = s.pos.x - s.size.x;
        maxX = s.pos.x + s.size.x;
        minY = s.pos.y - s.size.x;
        maxY = s.pos.y + s.size.x;
      } else {
        minX = s.pos.x;
        maxX = s.pos.x + s.size.x;
        minY = s.pos.y;
        maxY = s.pos.y + s.size.y;
      }

      // Add to all cells the shape overlaps
      const minCellX = Math.floor(minX / this.cellSize.x);
      const maxCellX = Math.floor(maxX / this.cellSize.x);
      const minCellY = Math.floor(minY / this.cellSize.y);
      const maxCellY = Math.floor(maxY / this.cellSize.y);

      for (let cx = minCellX; cx <= maxCellX; cx++) {
        for (let cy = minCellY; cy <= maxCellY; cy++) {
          const key = `${cx},${cy}`;
          if (!this.cellMap.has(key)) this.cellMap.set(key, []);
          this.cellMap.get(key).push(s);
        }
      }
    }
    for (const e of entities) {
      if (e.segments && Array.isArray(e.segments)) {
        for (const seg of e.segments) this.addToMap(seg, v2(seg.pos.x, seg.pos.y));
      } else if (e.pos) {
        this.addToMap(e, v2(e.pos.x, e.pos.y));
      }
    }
  }

  show() {
    this.shown = true;
  }
  hide() {
    this.shown = false;
  }

  addToMap(obj, pos) {
    const key = this._getCellKey(pos.x, pos.y);
    if (!this.cellMap.has(key)) this.cellMap.set(key, []);
    this.cellMap.get(key).push(obj);
  }

  getAtPos(x, y) {
    return this.cellMap.get(this._getCellKey(x, y)) || [];
  }
  getAroundPos(x, y, d = 2) {
    const cx = Math.floor(x / this.cellSize.x);
    const cy = Math.floor(y / this.cellSize.y);
    let result = [];
    for (let dx = -d; dx <= d; dx++) {
      for (let dy = -d; dy <= d; dy++) {
        const key = `${cx + dx},${cy + dy}`;
        const arr = this.cellMap.get(key);
        if (arr) result = result.concat(arr);
      }
    }
    return result;
  }

  _getCellKey(x, y) {
    const cx = Math.floor(x / this.cellSize.x);
    const cy = Math.floor(y / this.cellSize.y);
    return `${cx},${cy}`;
  }

  show(color = "rgba(255,255,0,0.2)") {
    ctx.save();
    ctx.lineWidth = 2;
    ctx.strokeStyle = color;
    // Draw vertical grid lines, clamped to window width
    for (let x = 0; x <= window.innerWidth; x += this.cellSize.x) {
      var px = sx(x) % window.innerWidth;
      if (px < 0) px += window.innerWidth;
      drawLine(ctx, v2(px, 0), v2(px, window.innerHeight), color, 2);
    }
    // Draw horizontal grid lines, clamped to window height
    for (let y = 0; y <= window.innerHeight; y += this.cellSize.y) {
      var py = sy(y) % window.innerHeight;
      if (py < 0) py += window.innerHeight;
      drawLine(ctx, v2(0, py), v2(window.innerWidth, py), color, 2);
    }

    // Draw world position labels at top-left of each cell
    // Calculate which cells are currently visible based on camera scroll
    const minWorldX = wx(0);
    const maxWorldX = wx(window.innerWidth);
    const minWorldY = wy(0);
    const maxWorldY = wy(window.innerHeight);

    const minCellX = Math.floor(minWorldX / this.cellSize.x);
    const maxCellX = Math.ceil(maxWorldX / this.cellSize.x);
    const minCellY = Math.floor(minWorldY / this.cellSize.y);
    const maxCellY = Math.ceil(maxWorldY / this.cellSize.y);

    for (let cx = minCellX; cx <= maxCellX; cx++) {
      for (let cy = minCellY; cy <= maxCellY; cy++) {
        const worldX = Math.round(cx * this.cellSize.x);
        const worldY = Math.round(cy * this.cellSize.y);
        const screenX = sx(worldX);
        const screenY = sy(worldY);

        const label = `X ${worldX}\nY${worldY}`;
        drawText(ctx, screenX + 5, screenY, label, "rgba(255,255,255,0.6)", null, 10, false);
      }
    }

    ctx.fillStyle = "white";
    ctx.font = "12px monospace";
    // Only draw cell overlays if inside window bounds
    for (let [key, arr] of this.cellMap.entries()) {
      const [cx, cy] = key.split(",").map(Number);
      const tx = sx(cx * this.cellSize.x + this.cellSize.x / 2);
      const ty = sy(cy * this.cellSize.y + this.cellSize.y / 2);
      const count = arr.length;
      drawText(ctx, tx, ty, count.toString(), "white", null, 12, true);
    }
    ctx.restore();
  }
}

function unanchorAll() {
  for (const r of ropes) {
    for (const s of r.segments) s.setAnchor(null);
  }
}
function setNewGravity(newGrav) {
  if (newGrav === gravity) return;
  gravity = newGrav;
  for (const r of ropes) r.gravity = v2(newGrav.x, newGrav.y);
  for (const s of shapes) s.gravity = v2(newGrav.x, newGrav.y);
}

function shakeAll(amount = 10) {
  for (const r of ropes) {
    for (const s of r.segments) {
      if (s.isAnchor) continue;
      s.pos = v2(s.pos.x + r_range(-amount * 2, amount * 2), s.pos.y + r_range(-amount, amount));
    }
  }
}

function clearAll() {
  gravity = v2(0, 100);
  colGrid.init(window.innerWidth / 8);
  colGrid.hide();
  SelfCollisionsInterval = 1;
  numOfConstraintsRuns = 50;
  showAnchors = false;
  showDots = false;
  ropes = [];
  shapes = [];
  entities = [];
  airPushers = [];
  hovAirPusher = selAirPusher = hovDirPusher = selDirPusher = hovSegment = selSegment = hovShape = selShape = null;
  player = null;
  cam.setTarget(null);
}

function ensureElementRemoval(element) {
  if (contextMenu.target === element) contextMenu.hide();
  if (hovSegment === element) hovSegment = null;
  if (hovSegment === element.rope) hovSegment = null;
  if (selSegment === element) selSegment = null;
  if (hovAirPusher === element) hovAirPusher = null;
  if (hovDirPusher === element) hovDirPusher = null;
  if (hovShape === element) hovShape = null;
  if (selShape === element) selShape = null;
  if (selAirPusher === element) selAirPusher = null;
  if (selDirPusher === element) selDirPusher = null;
  if (player === element) player = null;
  if (player2 === element) player2 = null;
  if (cam.target === element) cam.target = null;

  var idx = entities.indexOf(element);
  if (idx !== -1) {
    entities.splice(idx, 1);
    return;
  }
  idx = shapes.indexOf(element);
  if (idx !== -1) {
    shapes.splice(idx, 1);
    return;
  }
  idx = ropes.indexOf(element);
  if (idx !== -1) {
    ropes.splice(idx, 1);
    return;
  }
  if (element.rope) element.rope.separate(element.idx);
}
