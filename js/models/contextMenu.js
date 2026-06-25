class ContextMenu {
  constructor() {
    this.pos = v2(0, 0);
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
    this.color = "rgba(120, 157, 176, 1)";
    this.selSlider = null;
    this.fontColor = ["rgba(255, 255, 255, 0.76)", "rgba(16, 23, 68, 1)"];
    this.init();
  }

  init() {
    this.segOptions = {
      Physics: [
        { label: "Collisions", t: "switch", get: () => this.target.collisionsEnabled, set: (v) => (this.target.collisionsEnabled = v) },
        { label: "Spacing", t: "slider", get: () => this.target.segSpace, set: (v) => (this.target.segSpace = v), min: 1, max: 50, step: 1 },
        { label: "Damping", t: "slider", get: () => this.target.damp, set: (v) => (this.target.damp = v), min: 0.1, max: 1, step: 0.01 },
        { label: "Gravity", t: "vector", get: () => this.target?.gravity, set: (v) => (this.target.gravity = v), factor: 100 },
        { label: "Rigid", t: "slider", get: () => this.target.stiffness, set: (v) => (this.target.stiffness = v), min: 0, max: 0.9, step: 0.1 },
        { label: "Break-point", t: "slider", get: () => this.target?.breakPoint, set: (v) => (this.target.breakPoint = v), min: 0, max: 5, step: 0.1 },
      ],
      Style: [
        { label: "Segments Amount", t: "slider", get: () => this.target.segAmount, set: (v) => this.target.setNewSegAmount(v), min: 3, max: 200, step: 1 },
        { label: "Rope Thickness", t: "slider", get: () => this.target.thick, set: (v) => this.target.setRopeThickness(v), min: 1, max: 40, step: 1 },
        { label: "Rope Pointiness", t: "slider", get: () => this.target.pointiness, set: (v) => this.target.setPointy(v), min: -0.95, max: 0.95, step: 0.1 },
        { label: "Chain", t: "switch", get: () => this.target.isChain, set: (v) => (this.target.isChain = v) },
        { label: "Square", t: "switch", get: () => this.target.isSquare, set: (v) => (this.target.isSquare = v) },

        {
          label: "Spines",
          section: [
            {
              label: "Spines Amount",
              t: "slider",
              get: () => (this.target.spineOccurence === 0 ? 0 : Math.floor(this.target.segAmount / this.target.spineOccurence)),
              set: (v) => (this.target.spineOccurence = v === 0 ? 0 : Math.floor(this.target.segAmount / v)),
              min: 0,
              max: function () {
                return Math.round((this.target.segAmount - 1) / 2);
              },
              step: 1,
            },
            { label: "Both Sides", t: "switch", get: () => this.target.spineOnBothSides, set: (v) => (this.target.spineOnBothSides = v) },
            {
              label: "Spine Size",
              t: "vector",
              get: () => this.target.spineSize,
              set: (v) => (this.target.spineSize = v),
              factor: 100,
              type: "abs",
            },
            { label: "SpineColor", t: "color", get: () => this.target.spineColor, set: (v) => (this.target.spineColor = v) },
            { label: "SpineAngle", t: "slider", get: () => this.target.spineAngle, set: (v) => (this.target.spineAngle = v), min: -1, max: 0, step: 0.001 },
          ],
        },
        { label: "Body Color_1", t: "color", get: () => this.target.color, set: (v) => (this.target.color = v) },
        { label: "Body Color_2", t: "color", get: () => this.target.color2, set: (v) => (this.target.color2 = v) },
        { label: "Rainbow Color", t: "switch", get: () => this.target.isRainbow, set: (v) => (this.target.isRainbow = v) },
        {
          label: "Stripes Amount",
          t: "slider",
          get: () => (this.target.stripesOccurence === 0 ? 0 : Math.floor(this.target.segAmount / this.target.stripesOccurence)),
          set: (v) => (this.target.stripesOccurence = v === 0 ? 0 : Math.floor(this.target.segAmount / v)),
          min: 0,
          max: function () {
            return Math.round((this.target.segments.length - 1) / 2);
          },
          step: 1,
        },
        { label: "Stripes Color", t: "color", get: () => this.target.stripesColor, set: (v) => (this.target.stripesColor = v) },
        { label: "Segment Thickness", t: "slider", get: () => this.segment.thickFactor, set: (v) => this.segment.setSegThickFactor(v), min: 0.1, max: 2, step: 0.1 },
        {
          label: "Randomize Thickness",
          t: "function",
          f: () => {
            this.target.randomizeThickness(0.3);
          },
        },
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
      Focus: {
        label: "Cam Focus",
        t: "button",
        f: () => cam.follow(this.segment),
      },
    };

    this.shapeOptions = {
      Physics: [
        { label: "Collisions", t: "switch", get: () => this.target.collisionsEnabled, set: (v) => (this.target.collisionsEnabled = v) },
        { label: "movable", t: "switch", get: () => this.target.movable, set: (v) => (this.target.movable = v) },
        { label: "static", t: "switch", get: () => this.target.static, set: (v) => (this.target.static = v) },
        { label: "mass", t: "slider", get: () => this.target?.mass, set: (v) => (this.target.mass = v), min: 0.1, max: 10000, step: 1 },
        { label: "Gravity", t: "vector", get: () => this.target?.gravity, set: (v) => (this.target.gravity = v), factor: 100 },
        { label: "bounce", t: "slider", get: () => this.target?.bounceFactor, set: (v) => (this.target.bounceFactor = v), min: 0, max: 1, step: 0.1 },
        { label: "allow Rotation", t: "switch", get: () => this.target?.rotationEnabled, set: (v) => (this.target.rotationEnabled = v) },
        { label: "angle", t: "slider", get: () => this.target?.angle, set: (v) => (this.target.angle = v), min: -Math.PI, max: Math.PI, step: 0.01 },
        { label: "drag", t: "slider", get: () => this.target?.dragFactor, set: (v) => (this.target.dragFactor = v), min: 0, max: 1, step: 0.01 },
      ],
      Style: [
        { label: "Fill Color", t: "color", get: () => this.target.fillColor, set: (v) => (this.target.fillColor = v) },
        { label: "Border Color", t: "color", get: () => this.target.borderColor, set: (v) => (this.target.borderColor = v) },
        { label: "size", t: "vector", get: () => this.target.size, set: (v) => this.target.resize(v), factor: window.innerWidth / 4, type: "abs" },
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
      Focus: {
        label: "Cam Focus",
        t: "button",
        f: () => cam.follow(this.shape),
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
      Focus: {
        label: "Cam Focus",
        t: "button",
        f: () => cam.follow(this.airPusher),
      },
    };
    this.menuOptions = {
      Create: [
        {
          label: "Rope",
          section: [
            { label: "Fixed", t: "function", f: () => Rope.instantiate(v2(mouse.world.x, mouse.world.y)) },
            { label: "Free", t: "function", f: () => Rope.instantiate(v2(mouse.world.x, mouse.world.y), null, false) },
            { label: "Bridge", t: "function", f: () => ropes.push(new Rope(mouse.world, v2(mouse.world.x + segAmount * segSpace, mouse.world.y))) },
          ],
        },
        {
          label: "Shape",
          section: [
            { label: "Ball", t: "function", f: () => Ball.instantiate() },
            { label: "Rectangle", t: "function", f: () => Rectangle.instantiate() },
            {
              label: "Static Rectangle",
              t: "function",
              f: () => {
                var s = Rectangle.instantiate();
                s.static = true;
                s.movable = false;
              },
            },
            { label: "Mine", t: "function", f: () => shapes.push(new Mine(mouse.world, v2(85, 85))) },
          ],
        },
        {
          label: "Entity",
          section: [
            { label: "Snake", t: "function", f: () => Snake.instantiate(v2(mouse.world.x, mouse.world.y)) },
            { label: "LugWorm", t: "function", f: () => RopeEntity.instantiate(Lugworm, v2(mouse.world.x, mouse.world.y)) },
            { label: "Spider", t: "function", f: () => RopeEntity.instantiate(Spider, v2(mouse.world.x, mouse.world.y)) },
            { label: "RobotArm", t: "function", f: () => RopeEntity.instantiate(RobotArm, v2(mouse.world.x, mouse.world.y)) },
          ],
        },
        { label: "Wind", t: "function", f: () => AirPusher.instantiate(v2(mouse.world.x, mouse.world.y)) },
      ],
      Actions: [
        { label: "Shake", t: "function", f: () => shakeAll() },
        { label: "Clear", t: "function", f: () => clearAll() },
        { label: "Unanchor", t: "function", f: () => unanchorAll() },
      ],
      Presets: [
        { label: "PlatformGame", t: "function", f: () => setPreset(platformGame) },
        { label: "Animated World", t: "function", f: () => setPreset(animatedWorld) },
        { label: "Bubbles", t: "function", f: () => setPreset(bubbles) },
        { label: "Hanging Snakes", t: "function", f: () => setPreset(hangingSnakes) },
        { label: "Snakes in space", t: "function", f: () => setPreset(snakesInSpace) },
        { label: "Upside Down world", t: "function", f: () => setPreset(forrest) },
        { label: "Weird World", t: "function", f: () => setPreset(weirdWorld) },
        { label: "Hair World", t: "function", f: () => setPreset(hairWorld) },
        { label: "Border Grass", t: "function", f: () => setPreset(borderGrass) },
        { label: "SnakeBasketball", t: "function", f: () => setPreset(() => snakeBasketball.init()) },
      ],
      Parameters: [
        {
          label: "Shapes [GLOBAL]",
          section: [{ label: "size", t: "vector", get: () => shapeSize, set: (v) => Shape.resize(v), factor: window.innerWidth / 4, type: "abs" }],
        },
        {
          label: "Ropes [GLOBAL]",
          section: [
            { label: "Rope res", t: "slider", get: () => numOfConstraintsRuns, set: (v) => (numOfConstraintsRuns = v), min: 10, max: 200, step: 1 },
            { label: "Show Segments", t: "switch", get: () => showDots, set: (v) => (showDots = v) },
            { label: "Show Anchors", t: "switch", get: () => showAnchors, set: (v) => (showAnchors = v) },
            { label: "Show Angles", t: "switch", get: () => showArrows, set: (v) => (showArrows = v) },
            { label: "Set Thickness", t: "slider", get: () => segThickness, set: (v) => Rope.globalModifier(v), min: 1, max: 60, step: 1 },
            { label: "Segments' amount", t: "slider", get: () => segAmount, set: (v) => Rope.globalModifier(null, v), min: 1, max: 100, step: 1 },
            { label: "SegSpace", t: "slider", get: () => segSpace, set: (v) => Rope.globalModifier(null, null, v), min: 0.01, max: 100, step: 0.001 },
            { label: "Border Drag", t: "slider", get: () => ropeGroundFriction, set: (v) => (ropeGroundFriction = v), min: 0.01, max: 1, step: 0.001 },
          ],
        },
        {
          label: "Gravity [GLOBAL]",
          section: [
            { label: "Gravity", t: "vector", get: () => gravity, set: (v) => setNewGravity(v), factor: 100 },
            { label: "Shaker", t: "slider", get: () => ropeShaker, set: (v) => (ropeShaker = v), min: 0, max: 10, step: 0.001 },
          ],
        },
        {
          label: "Collision",
          section: [
            { label: "Active", t: "switch", get: () => colGrid.active, set: (v) => (colGrid.active = v) },
            { label: "Show Grid", t: "switch", get: () => colGrid.shown, set: (v) => (colGrid.shown = v) },
            { label: "Show Col Amount", t: "switch", get: () => showColAmount, set: (v) => (showColAmount = v) },
            { label: "Grid Size", t: "slider", get: () => colGrid.cellSize.x, set: (v) => colGrid.init(v), min: 10, max: window.innerWidth / 4, step: 1 },
            { label: "overlap factor", t: "slider", get: () => overlapFactor, set: (v) => (overlapFactor = v), min: 0.01, max: 2, step: 0.001 },
            { label: "Seg. Occurence", t: "slider", get: () => collisionSegmentInteval, set: (v) => (collisionSegmentInteval = v), min: 1, max: 100, step: 1 },
            { label: "Seg. Occurence (Self)", t: "slider", get: () => SelfCollisionsInterval, set: (v) => (SelfCollisionsInterval = v), min: 0, max: 20, step: 1 },
          ],
        },
        { label: "Map Size", t: "vector", get: () => mapSize, set: (v) => setMapSize(v), factor: 10000, type: "abs" },
        { label: "Background Color 1", t: "color", get: () => backgroundColor1, set: (v) => (backgroundColor1 = v) },
        { label: "Background Color 2", t: "color", get: () => backgroundColor2, set: (v) => (backgroundColor2 = v) },
      ],
    };
  }

  show(pos = mouse.pos) {
    menuCtx.clearRect(0, 0, menuCanvas.width, menuCanvas.height);
    pos = v2(clamp(pos.x, 0, window.innerWidth - this.w), clamp(pos.y, 0, window.innerHeight - this.h));
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
      if (mouse.clicked || input.keyClicked === " ") {
        if (typeof option.f === "function") {
          option.f();
          //   this.hide();
          //   return;
        } else console.warn("No function found for option " + option.label);
      }
    } else if (type === "switch" && mouse.clicked) newValue = !value;
    else if (type === "slider" && mouse.pressed) {
      this.selSlider = option;
      const minVal = typeof option.min === "function" ? option.min.call(this) : option.min;
      const maxVal = typeof option.max === "function" ? option.max.call(this) : option.max;
      let mx = Math.max(sliderX, Math.min(mouse.pos.x, sliderX + sliderW));
      let t = (mx - sliderX) / sliderW;
      newValue = minVal + t * (maxVal - minVal);
      if (option.step === 1) newValue = Math.floor(newValue);
      else if (option.step) newValue = Math.round(newValue / option.step) * option.step;
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

  getFullWidthOfSection(section) {
    return this.getWidthOfSection(section) + 20 + this.getSliderW(section);
  }

  addHovPath(endOfPath) {
    var levels = this.hovPath ? this.hovPath.split(" > ").filter((l) => l) : [];
    levels = levels.slice(0, this.MenuDepth);
    levels[this.MenuDepth] = endOfPath;
    this.hovPath = levels.join(" > ");
  }

  getSliderW(section) {
    for (const o of section) {
      if (o.t === "color") return 60;
      if (o.t === "vector") return 60;
      if (o.t === "slider") return 40;
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
    let sliderX = pos.x + w - sliderW - 10;

    if (this.scrollDir === "left" || pos.x + w > window.innerWidth) {
      this.scrollDir = "left";
      pos.x -= w;
    }
    pos.y = Math.min(pos.y, window.innerHeight - h);
    var bgrClr = setAlpha(this.color, 0.1);

    for (let i = 0; i < section.length; i++) {
      var opt = section[i];
      var isHov = pointInRect(mouse.pos, v2(pos.x, pos.y), v2(w + 4, spacing - 1));
      var btnClr = setAlpha(bgrClr, isHov ? 0.9 : 0.8);
      var clr = this.fontColor[isHov ? 1 : 0];

      drawRect(pos.x, pos.y, w, spacing, btnClr, "rgba(0, 0, 0, 0.15)", menuCtx);
      if (isHov) this.hasHov = true;
      var type = opt.t;
      var value = typeof opt.get === "function" ? opt.get() : null;
      const currentPath = parentPath ? `${parentPath} > ${opt.label}` : opt.label;

      if (opt.section && Array.isArray(opt.section)) {
        if (isHov) this.hovPath = currentPath;
        drawText(ctx, pos.x + 5, pos.y - 4 + spQ, opt.label, clr, null, 14, false);
        drawText(ctx, pos.x + w - 12, pos.y - 3 + spQ, "▶", clr, null, 8, false);
        if (isHov || (this.hovPath && this.hovPath.includes(opt.label))) {
          var p = v2(pos.x, pos.y);
          if (this.scrollDir === "left") p[0] -= w;
          else p.x += w;
          this.showSection(p, opt.section, currentPath);
        }
      } else {
        if (isHov && (!this.selSlider || this.selSlider === opt)) {
          this.handleHov(opt, value, sliderX, sliderW);
          this.hovPath = currentPath;
        }
        drawText(ctx, pos.x + 5, pos.y - 4 + spQ, opt.label, clr, null, 14, false);
        if (type === "switch") drawCircle2(ctx, pos.x + w - 20, pos.y + 10 + spQ, 5, value ? "green" : "red", "white", 1);
        else if (type === "slider") {
          const minVal = typeof opt.min === "function" ? opt.min.call(this) : opt.min;
          const maxVal = typeof opt.max === "function" ? opt.max.call(this) : opt.max;
          drawSlider(ctx, v2(sliderX, pos.y + 8 + spQ), v2(sliderW, 10), value, minVal, maxVal, setAlpha("white", this.selSlider === opt ? 1 : 0.8), "red");
        } else if (type === "color") {
          var curClr = opt.get();
          var newClr = drawColorPicker(ctx, v2(sliderX, pos.y + spQ), v2(sliderW, spacing * 0.5), curClr);
          if (mouse.pressed && newClr && newClr !== curClr) {
            opt.set(newClr);
          }
        } else if (type === "vector") {
          const fieldPos = v2(sliderX, pos.y + spQ);
          const size = v2(40, 20);
          var cur = v2(opt.get().x, opt.get().y);
          var curV = v2(cur.x, cur.y);

          if (opt.type === "abs") {
            curV.x = (Math.abs(cur.x) / opt.factor) * size.x;
            curV.y = (Math.abs(cur.y) / opt.factor) * size.y;
          } else {
            curV.x /= (opt.factor / size.x) * 2;
            curV.y /= (opt.factor / size.y) * 2;
            curV.x += size.x / 2;
            curV.y += size.y / 2;
          }
          const v = drawVectorField(ctx, fieldPos, size, curV, v2(Number(cur.x).toFixed(1), Number(cur.y).toFixed(1)));
          if (v && mouse.pressed) {
            let scaledV;
            if (opt.type === "abs") {
              scaledV = v2(((v.x + 1) / 2) * opt.factor, ((v.y + 1) / 2) * opt.factor);
            } else scaledV = scale_v2(v, opt.factor);

            opt.set(scaledV);
          }
        }
      }
      pos.y += spacing;
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

    var pos = new Vec2(this.pos.x, this.pos.y);
    // drawRect(pos.x, pos.y, this.w, this.h, "rgba(0,0,0,0)", "white", menuCtx);

    let i = -1;
    for (const section in sections) {
      i++;
      if (pointInRect(mouse.pos, v2(pos.x, pos.y), v2(this.w, spacing - 1))) {
        this.hovPath = section;
        this.hasHov = true;
      }
      var sectionValue = sections[section];
      if (sectionValue.label === "Control" && typeof this.target.control !== "function") continue;

      var btnClr = setAlpha(this.color, this.hovPath === section ? 0.9 : 0.6);
      var clr = this.fontColor[this.hovPath === section ? 1 : 0];
      drawRect(pos.x, pos.y, this.w, spacing, btnClr, "rgba(0, 0, 0, 0.15)", menuCtx);
      drawText(menuCtx, pos.x + 5, pos.y - 6 + spacing * 0.25, section, clr, null, 14, false);
      var hasSubMenu = Array.isArray(sectionValue);
      if (hasSubMenu) drawText(menuCtx, pos.x + this.w - 20, pos.y - 5 + spacing * 0.25, "▶", clr, null, 8, false);
      if (this.hovPath.includes(section)) {
        if (hasSubMenu) {
          var p = v2(pos.x + this.w, pos.y);
          this.showSection(p, sectionValue, section);
        } else {
          var opt = sectionValue;

          var value = typeof opt.get === "function" ? opt.get() : null;
          if (!this.selSlider || this.selSlider === opt) this.handleHov(opt, value, 40, 40, menuCtx);
        }
      }
      pos.y += spacing;
    }
    if (mouse.clicked && this.hovPath.length === 0) this.hide();
    if (!this.hasHov && !mouse.pressed) {
      setTimeout(() => {
        if (!this.hasHov) this.hovPath = "";
      }, 0);
    }
    // drawText(menuCtx, 100, 100, this.hovPath, "red", null, 20, false);
  }
}

var contextMenu = new ContextMenu();
window.addEventListener("contextmenu", (e) => {
  e.preventDefault();
  contextMenu.show(v2(e.clientX, e.clientY));
});
