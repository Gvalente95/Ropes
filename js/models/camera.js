class Camera {
  constructor() {
    this.scroll = v2(0, 0);
    this.scrollSpeed = 20;
    this.target = null;
    this.locked = false;
    this.init();
  }

  init() {
    let limit = v2(mapSize.x - _canvas.width, mapSize.y - _canvas.height);
    this.minX = 0;
    this.maxX = limit.x;
    this.minY = 0;
    this.maxY = limit.y;
  }

  update() {
    if (this.target) this.centerTarget(this.target, 0.5);
  }

  follow(newTarget = null) {
    if (this.locked) return;
    if (newTarget === this.target || !newTarget) this.target = null;
    else {
      if (newTarget.segments !== undefined) newTarget = newTarget.segments[0];
      this.target = newTarget;
      this.centerTarget();
    }
  }

  centerTarget(target = this.target, speed = 1) {
    if (!target) {
      this.center(v2(_canvas.width / 2, _canvas.height / 2), speed);
      return;
    }
    if (target.rope) {
      const taget_center = add_v2(target.pos, v2(target.thick / 2, target.thick / 2));
      this.center(taget_center, speed);
      return;
    }
    const taget_center = add_v2(target.pos, scale_v2(target.size, 0.5));
    this.center(taget_center, speed);
  }
  center(pos = v2(mapSize.x / 2, mapSize.y / 2), speed = 1) {
    const targetX = pos.x - _canvas.width / 2;
    const targetY = pos.y - _canvas.height / 2;
    const currentX = this.scroll.x;
    const currentY = this.scroll.y;
    this.scroll.x = clamp(currentX + (targetX - currentX) * speed, this.minX, this.maxX);
    this.scroll.y = clamp(currentY + (targetY - currentY) * speed, this.minY, this.maxY);
  }

  clearPosition() {
    this.scroll = v2();
  }

  place(pos) {
    this.scroll = pos;
  }

  move(dx, dy) {
    this.scroll.x = clamp(this.scroll.x - dx, this.minX, this.maxX);
    this.scroll.y = clamp(this.scroll.y - dy, this.minY, this.maxY);
  }
}

function setMapSize(newMapSize = winSize) {
  newMapSize.x = Math.max(newMapSize.x, winSize.x);
  newMapSize.y = Math.max(newMapSize.y, winSize.y);

  mapSize = newMapSize;
  groundLevel = mapSize.y - 50;
  cam.center();
  cam.init();
}

const CircleInScreen = (circle) => circleInRect(circle.pos, circle.size.x, cam.scroll, winSize);
const rectInScreen = (rect) => rectInRect(rect, rect.size, rect.angle, cam.scroll, winSize);

const toScrn = (x, y) => v2(sx(x), sy(y));
const toWorld = (x, y) => v2(wx(x), wy(y));

const v2ToScrn = (v) => toScrn(v.x, v.y);
const v2ToWorld = (v) => toWorld(v.x, v.y);

const sx = (x) => x - cam.scroll.x;
const sy = (y) => y - cam.scroll.y;
const px = (x, z) => (x - cam.scroll.x) / (1 + z * 0.2);
const py = (y, z) => (y - cam.scroll.y) / (1 + z * 0.2);
const wx = (x) => x + cam.scroll.x;
const wy = (y) => y + cam.scroll.y;
