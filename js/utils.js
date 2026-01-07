class ContextMenu {
  constructor() {
    this.pos = new Vec2(0, 0);
    this.active = false;
    this.showEdit = false;
    this.segment = null;
    this.shape = null;
    this.airPusher = null;
    this.w = 100;
    this.h = 80;
    this.btnH = 32;
    this.hasHov = false;
    this.hovPath = "";
    this.color = "rgba(35, 44, 49, 1)";
    this.selSlider = null;
    this.fontColor = ["grey", "white"];
    this.init();
  }

  init() {
    this.segOptions = {
      Settings: [
        { label: "Segments", t: "slider", get: () => this.target.segAmount, set: (v) => this.target.setNewSegAmount(v), min: 3, max: 200, step: 1 },
        { label: "Spacing", t: "slider", get: () => this.target.segSpace, set: (v) => (this.target.segSpace = v), min: 1, max: 50, step: 1 },
        { label: "Damping", t: "slider", get: () => this.target.damp, set: (v) => (this.target.damp = v), min: 0.1, max: 1, step: 0.01 },
        { label: "Thickness", t: "slider", get: () => this.target.thick, set: (v) => (this.target.thick = v), min: 1, max: 40, step: 1 },
        { label: "Gravity X", t: "slider", get: () => this.target.gravity.x, set: (v) => (this.target.gravity.x = v), min: -100, max: 100, step: 1 },
        { label: "Gravity Y", t: "slider", get: () => this.target.gravity.y, set: (v) => (this.target.gravity.y = v), min: -100, max: 100, step: 1 },
        { label: "Rigid", t: "slider", get: () => this.target.stiffness, set: (v) => (this.target.stiffness = v), min: 0, max: 0.9, step: 0.1 },
        { label: "Chain", t: "switch", get: () => this.target.isChain, set: (v) => (this.target.isChain = v) },
      ],
      Color: [
        { label: "Color1", t: "color", get: () => this.target.color, set: (v) => (this.target.color = v) },
        { label: "Color2", t: "color", get: () => this.target.color2, set: (v) => (this.target.color2 = v) },
      ],
      Duplicate: {
        label: "Duplicate",
        t: "button",
        f: () => this.target.duplicate(),
      },
      Delete: {
        label: "Delete",
        t: "button",
        f: () => this.target.remove(),
      },
      Control: { label: "Control", t: "function", f: () => this.target.control() },
    };

    this.shapeOptions = {
      Settings: [
        { label: "Color", t: "color", get: () => this.target.color, set: (v) => (this.target.color = v) },
        { label: "size", t: "slider", get: () => this.target?.size.x, set: (v) => this.target.resize(v), min: 5, max: 200, step: 1 },
        { label: "mass", t: "slider", get: () => this.target?.mass, set: (v) => (this.target.mass = v), min: 0.1, max: 10000, step: 1 },
        { label: "Gravity X", t: "slider", get: () => this.target?.gravity.x, set: (v) => (this.target.gravity.x = v), min: -100, max: 100, step: 1 },
        { label: "Gravity Y", t: "slider", get: () => this.target.gravity.y, set: (v) => (this.target.gravity.y = v), min: -100, max: 100, step: 1 },
        { label: "bounce", t: "slider", get: () => this.target?.bounceFactor, set: (v) => (this.target.bounceFactor = v), min: 0, max: 1, step: 0.1 },
        { label: "angle", t: "slider", get: () => this.target?.angle, set: (v) => (this.target.angle = v), min: -Math.PI, max: Math.PI, step: 0.01 },
        { label: "drag", t: "slider", get: () => this.target?.dragFactor, set: (v) => (this.target.dragFactor = v), min: 0, max: 1, step: 0.01 },
      ],
      Duplicate: {
        label: "Duplicate",
        t: "button",
        f: () => this.target.duplicate(),
      },
      Delete: {
        label: "Delete",
        t: "button",
        f: () => this.target.remove(),
      },
    };

    this.airPusherOptions = {
      Settings: [
        { label: "force", t: "slider", get: () => this.target.baseForce, set: (v) => (this.target.baseForce = v), min: -100, max: 100, step: 1 },
        { label: "radius", t: "slider", get: () => this.target.radius, set: (v) => (this.target.radius = v), min: 20, max: 1000, step: 1 },
      ],

      Duplicate: {
        label: "Duplicate",
        t: "button",
        f: () => this.target.duplicate(),
      },
      Delete: {
        label: "Delete",
        t: "button",
        f: () => this.target.remove(),
      },
      Control: {
        label: "Control",
        t: "function",
        f: () => this.target.control(),
      },
    };
    this.menuOptions = {
      Create: [
        {
          label: "Rope",
          section: [
            { label: "Fixed", t: "function", f: () => Rope.instantiate(new Vec2(mouse.pos.x, mouse.pos.y)) },
            { label: "Free", t: "function", f: () => Rope.instantiate(new Vec2(mouse.pos.x, mouse.pos.y), null, false) },
            { label: "Bridge", t: "function", f: () => ropes.push(new Rope(mouse.pos, new Vec2(mouse.pos.x + segAmount * segSpace, mouse.pos.y))) },
          ],
        },
        {
          label: "Shape",
          section: [
            { label: "Circle", t: "function", f: () => Shape.instantiate("CIRCLE") },
            { label: "Rectangle", t: "function", f: () => Shape.instantiate("SQUARE") },
          ],
        },
        {
          label: "Entity",
          section: [
            { label: "Snake", t: "function", f: () => RopeEntity.instantiate(Snake, new Vec2(mouse.pos.x, mouse.pos.y)) },
            { label: "LugWorm", t: "function", f: () => RopeEntity.instantiate(Lugworm, new Vec2(mouse.pos.x, mouse.pos.y)) },
            { label: "Spider", t: "function", f: () => RopeEntity.instantiate(Spider, new Vec2(mouse.pos.x, mouse.pos.y)) },
            { label: "RobotArm", t: "function", f: () => RopeEntity.instantiate(RobotArm, new Vec2(mouse.pos.x, mouse.pos.y)) },
          ],
        },
        { label: "Wind", t: "function", f: () => AirPusher.instantiate(new Vec2(mouse.pos.x, mouse.pos.y)) },
      ],
      Actions: [
        { label: "Shake", t: "function", f: () => shakeAll() },
        { label: "Clear", t: "function", f: () => clearAll() },
        { label: "Unanchor", t: "function", f: () => unanchorAll() },
      ],
      Presets: [
        { label: "Animated World", t: "function", f: () => setPreset(animatedWorld) },
        { label: "Snakes in space", t: "function", f: () => setPreset(snakesInSpace) },
        { label: "Upside Down world", t: "function", f: () => setPreset(upsideDownWorld) },
        { label: "Weird World", t: "function", f: () => setPreset(weirdWorld) },
        { label: "Hair World", t: "function", f: () => setPreset(hairWorld) },
        { label: "Border Grass", t: "function", f: () => setPreset(borderGrass) },
        { label: "SnakeBasketball", t: "function", f: () => setPreset(snakeBasketball) },
      ],
      Parameters: [
        {
          label: "Gravity",
          section: [
            { label: "Gravity X", t: "slider", get: () => gravity.x, set: (v) => setNewGravity(new Vec2(v, gravity.y)), min: -100, max: 100, step: 1 },
            { label: "Gravity Y", t: "slider", get: () => gravity.y, set: (v) => setNewGravity(new Vec2(gravity.x, v)), min: -100, max: 100, step: 1 },
            { label: "Shaker", t: "slider", get: () => ropeShaker, set: (v) => (ropeShaker = v), min: 0, max: 10, step: 0.001 },
          ],
        },
        {
          label: "Collision",
          section: [
            { label: "Collisions enabled", t: "switch", get: () => colGrid.active, set: (v) => (colGrid.active = v) },
            { label: "Show Col Grid", t: "switch", get: () => colGrid.shown, set: (v) => (colGrid.shown = v) },
            { label: "Col. ovrlp Mult.", t: "slider", get: () => overlapFactor, set: (v) => (overlapFactor = v), min: 0.01, max: 0.3, step: 0.001 },
            { label: "Col. res", t: "slider", get: () => collisionSegmentInteval, set: (v) => (collisionSegmentInteval = v), min: 1, max: 100, step: 1 },
            { label: "selfCol. res", t: "slider", get: () => SelfCollisionsInterval, set: (v) => (SelfCollisionsInterval = v), min: 0, max: 20, step: 1 },
            { label: "Border Friction", t: "slider", get: () => ropeGroundFriction, set: (v) => (ropeGroundFriction = v), min: 0.01, max: 1, step: 0.001 },
            { label: "Grid Size", t: "slider", get: () => colGrid.cellSize.x, set: (v) => colGrid.init(v), min: 10, max: window.innerWidth / 4, step: 1 },
          ],
        },
        {
          label: "Shapes",
          section: [
            { label: "Set Width", t: "slider", get: () => ShapeScale, set: (v) => Shape.resize(new Vec2(v, null)), min: 1, max: 100, step: 1 },
            { label: "Set Height", t: "slider", get: () => ShapeScale, set: (v) => Shape.resize(new Vec2(null, v)), min: 1, max: 100, step: 1 },
          ],
        },
        {
          label: "Ropes",
          section: [
            { label: "Rope res", t: "slider", get: () => numOfConstraintsRuns, set: (v) => (numOfConstraintsRuns = v), min: 10, max: 200, step: 1 },
            { label: "Show Segments", t: "switch", get: () => showDots, set: (v) => (showDots = v) },
            { label: "Show Anchors", t: "switch", get: () => showAnchors, set: (v) => (showAnchors = v) },
            { label: "Set Thickness", t: "slider", get: () => segThickness, set: (v) => Rope.globalModifier(v), min: 1, max: 60, step: 1 },
            { label: "Segments' amount", t: "slider", get: () => segAmount, set: (v) => Rope.globalModifier(null, v), min: 1, max: 100, step: 1 },
            { label: "SegSpace", t: "slider", get: () => segSpace, set: (v) => Rope.globalModifier(null, null, v), min: 0.01, max: 100, step: 0.001 },
          ],
        },
      ],
    };
  }

  show(pos = mouse.pos) {
    menuCtx.clearRect(0, 0, menuCanvas.width, menuCanvas.height);
    pos = new Vec2(clamp(pos.x, 0, window.innerWidth - this.w), clamp(pos.y, 0, window.innerHeight - this.h));
    this.pos = pos;
    this.segment = hovSegment;
    this.shape = hovShape;
    this.airPusher = hovAirPusher;
    this.active = true;
  }

  hide() {
    menuCtx.clearRect(0, 0, menuCanvas.width, menuCanvas.height);
    this.active = false;
    this.segment = null;
    this.shape = null;
    this.airPusher = null;
  }

  handleHov(option, value, sliderX, sliderW) {
    var newValue = value;
    var type = option.t;

    if (type === "function" || type === "button") {
      if (mouse.clicked) {
        if (typeof option.f === "function") {
          option.f();
          //   this.hide();
          //   return;
        } else console.warn("No function found for option " + option.label);
      }
    } else if (type === "switch" && mouse.clicked) newValue = !value;
    else if (type === "slider" && mouse.pressed) {
      this.selSlider = option;
      let mx = Math.max(sliderX, Math.min(mouse.pos.x, sliderX + sliderW));
      let t = (mx - sliderX) / sliderW;
      newValue = option.min + t * (option.max - option.min);
      if (option.step === 1) newValue = Math.floor(newValue);
      else if (option.step) newValue = Math.round(newValue / option.step) * option.step;
    } else if (type === "color" && mouse.pressed) {
    }
    if (newValue != value) {
      if (typeof option.set !== "function") console.warn(`Error: ${option.label} has no setter`);
      else option.set(newValue);
      value = newValue;
    }
    if (option.label !== undefined) this.addHovPath(option.label);
  }

  getWidthOfSection(section) {
    var longest = 0;
    for (const opt of section) if (opt.label !== undefined && opt.label.length > longest) longest = opt.label.length;
    return longest * 9.5;
  }

  addHovPath(endOfPath) {
    var levels = this.hovPath ? this.hovPath.split(" > ").filter((l) => l) : [];
    levels = levels.slice(0, this.MenuDepth);
    levels[this.MenuDepth] = endOfPath;
    this.hovPath = levels.join(" > ");
  }

  getSliderW(section) {
    for (const o of section) {
      if (o.t === "color") return 50;
      if (o.t === "slider") return 30;
    }
    return 0;
  }

  showSection(pos, section, parentPath = "") {
    var ctx = menuCtx;
    this.MenuDepth++;
    var spacing = this.btnH;
    var spQ = spacing * 0.25;
    var h = spacing * section.length + 10;

    let sliderW = this.getSliderW(section);
    var w = this.getWidthOfSection(section) + 20 + sliderW;
    let sliderX = pos[0] + w - sliderW - 10;

    if (this.scrollDir === "left" || pos[0] + w > window.innerWidth) {
      this.scrollDir = "left";
      pos[0] = this.pos.x - w;
    }
    pos[1] = Math.min(pos[1], window.innerHeight - h);
    var bgrClr = setAlpha(addColor(this.color, "rgba(0, 0, 0, 1)", (this.MenuDepth + 1) * 0.1), 0.9);

    for (let i = 0; i < section.length; i++) {
      var opt = section[i];

      var isHov = pointInRect(mouse.pos, new Vec2(pos[0], pos[1]), new Vec2(w + 4, spacing - 1));

      var btnClr = setAlpha(addColor(bgrClr, "rgba(0, 0, 0, 1)", i * 0.1), isHov ? 1 : 0.81);
      drawRect(pos[0], pos[1], w + 4, spacing, btnClr, null, menuCtx);
      if (isHov) this.hasHov = true;
      var type = opt.t;
      var value = typeof opt.get === "function" ? opt.get() : null;
      const currentPath = parentPath ? `${parentPath} > ${opt.label}` : opt.label;
      if (opt.section && Array.isArray(opt.section)) {
        if (isHov) this.hovPath = currentPath;
        var clr = isHov ? "white" : "rgba(130, 130, 130, 1)";
        drawText(ctx, [pos[0] + 5, pos[1] - 4 + spQ], opt.label, clr, null, 14, false);
        drawText(ctx, [pos[0] + w - 12, pos[1] - 3 + spQ], "▶", clr, null, 8, false);
        if (isHov || (this.hovPath && this.hovPath.includes(opt.label))) {
          var p = [pos[0] + w, pos[1]];
          this.showSection(p, opt.section, currentPath);
        }
      } else {
        if (isHov && (!this.selSlider || this.selSlider === opt)) {
          this.handleHov(opt, value, sliderX, sliderW);
          this.hovPath = currentPath;
        }
        var clr = isHov ? "white" : "rgba(130, 130, 130, 1)";
        drawText(ctx, [pos[0] + 5, pos[1] - 4 + spQ], opt.label, clr, null, 14, false);
        if (type === "switch") drawCircle2(ctx, [pos[0] + w - 20, pos[1] + 10 + spQ], 5, value ? "green" : "red", "white", 1);
        else if (type === "slider") drawSlider(ctx, [sliderX, pos[1] + 8 + spQ], [sliderW, 6], value, opt.min, opt.max, this.selSlider === opt ? "white" : "grey");
        else if (type === "color") {
          var curClr = opt.get();
          var newClr = drawColorPicker(ctx, [sliderX, pos[1] + spQ], [sliderW, spacing * 0.5], curClr);
          if (mouse.pressed && newClr && newClr !== curClr) opt.set(newClr);
        }
      }
      pos[1] += spacing;
    }
  }
  render() {
    if (!this.active) return;
    menuCtx.clearRect(0, 0, menuCanvas.width, menuCanvas.height);
    if (this.target) this.target.render(menuCtx);
    if (!mouse.pressed) this.selSlider = null;
    this.scrollDir = "right";
    this.hasHov = false;
    this.MenuDepth = 0;
    this.target = this.segment?.rope || this.shape || this.airPusher;
    var sections = this.segment ? this.segOptions : this.shape ? this.shapeOptions : this.airPusher ? this.airPusherOptions : this.menuOptions;
    var spacing = this.btnH;
    this.h = Object.keys(sections).length * (spacing + 2);

    var pos = [this.pos.x, this.pos.y];
    // drawRect(pos[0], pos[1], this.w, this.h, "rgba(0,0,0,0)", "white", menuCtx);

    let i = -1;
    for (const section in sections) {
      i++;
      if (pointInRect(mouse.pos, new Vec2(pos[0], pos[1]), new Vec2(this.w, spacing - 1))) {
        this.hovPath = section;
        this.hasHov = true;
      }
      var sectionValue = sections[section];
      if (sectionValue.label === "Control" && typeof this.target.control !== "function") continue;

      var btnClr = setAlpha(this.color, this.hovPath === section ? 0.9 : 0.6);
      var clr = this.fontColor[this.hovPath === section ? 1 : 0];
      drawRect(pos[0], pos[1], this.w, spacing, btnClr, null, menuCtx);
      drawText(menuCtx, [pos[0] + 5, pos[1] - 6 + spacing * 0.25], section, clr, null, 14, false);
      var hasSubMenu = Array.isArray(sectionValue);
      if (hasSubMenu) drawText(menuCtx, [pos[0] + this.w - 20, pos[1] - 5 + spacing * 0.25], "▶", clr, null, 8, false);
      if (this.hovPath.includes(section)) {
        if (hasSubMenu) {
          var p = [pos[0] + this.w, pos[1]];
          this.showSection(p, sectionValue, section);
        } else {
          var opt = sectionValue;

          var value = typeof opt.get === "function" ? opt.get() : null;
          if (!this.selSlider || this.selSlider === opt) this.handleHov(opt, value, 40, 40, menuCtx);
        }
      }
      pos[1] += spacing;
    }
    if (mouse.clicked && this.hovPath.length === 0) this.hide();
    if (!this.hasHov && !mouse.pressed) {
      setTimeout(() => {
        if (!this.hasHov) this.hovPath = "";
      }, 0);
    }
    // drawText(menuCtx, [100, 100], this.hovPath, "red", null, 20, false);
  }
}

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
    this.cellSize = new Vec2(window.innerWidth / this.cellW, window.innerHeight / this.cellH);
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
        this.addToMap(s, new Vec2(s.pos.x, s.pos.y));
      }
    }
    for (const s of shapes) {
      var p = s.type === "CIRCLE" ? s.pos : new Vec2(s.pos.x + s.size.x / 2, s.pos.y + s.size.y / 2);
      this.addToMap(s, p);
    }
    for (const e of entities) {
      if (e.segments && Array.isArray(e.segments)) {
        for (const seg of e.segments) this.addToMap(seg, new Vec2(seg.pos.x, seg.pos.y));
      } else if (e.pos) {
        this.addToMap(e, new Vec2(e.pos.x, e.pos.y));
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
  getAroundPos(x, y, d) {
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
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, window.innerHeight);
      ctx.stroke();
    }
    // Draw horizontal grid lines, clamped to window height
    for (let y = 0; y <= window.innerHeight; y += this.cellSize.y) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(window.innerWidth, y);
      ctx.stroke();
    }
    ctx.fillStyle = "white";
    ctx.font = "12px monospace";
    // Only draw cell overlays if inside window bounds
    for (let [key, arr] of this.cellMap.entries()) {
      const [cx, cy] = key.split(",").map(Number);
      const tx = cx * this.cellSize.x + this.cellSize.x / 2;
      const ty = cy * this.cellSize.y + this.cellSize.y / 2;
      if (tx >= 0 && tx < window.innerWidth && ty >= 0 && ty < window.innerHeight) {
        const count = arr.length;
        drawText(ctx, [tx, ty], count.toString(), "white", null, 12, true);
      }
    }
    ctx.restore();
  }
}

var contextMenu = new ContextMenu();
window.addEventListener("contextmenu", (e) => {
  e.preventDefault();
  contextMenu.show(new Vec2(e.clientX - contextMenu.w * 0.5, e.clientY - 15));
});

function unanchorAll() {
  for (const r of ropes) {
    for (const s of r.segments) s.setAnchor(null);
  }
}
function setNewGravity(newGrav) {
  if (newGrav === gravity) return;
  gravity = newGrav;
  for (const r of ropes) r.gravity = new Vec2(newGrav.x, newGrav.y);
  for (const s of shapes) s.gravity = new Vec2(newGrav.x, newGrav.y);
}

function shakeAll(amount = 10) {
  for (const r of ropes) {
    for (const s of r.segments) {
      if (s.isAnchor) continue;
      s.pos = new Vec2(s.pos.x + r_range(-amount * 2, amount * 2), s.pos.y + r_range(-amount, amount));
    }
  }
}

function clearAll() {
  gravity = new Vec2(0, 100);
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
}
