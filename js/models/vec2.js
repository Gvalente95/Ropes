class Vec2 {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
  debugOnCanvas(ctx, pos = v2(50, 50), color = "red") {
    drawText(ctx, pos, `x${this.x} y${this.y}`, color);
  }

  debug(label = null) {
    if (label) console.warn(`${label} x${this.x} y${this.y}`);
    else console.warn(`x${this.x} y${this.y}`);
  }
}

const v2 = (x = 0, y = 0) => new Vec2(x, y);

const magnitude_v2 = (a, b) => Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));

const sub_v2 = (a, b) => v2(a.x - b.x, a.y - b.y);

function normalize_v2(v) {
  var mag = Math.sqrt(v.x * v.x + v.y * v.y);
  if (mag === 0) return v2(0, 0);
  return v2(v.x / mag, v.y / mag);
}
const mult_v2 = (a, b) => v2(a.x * b.x, a.y * b.y);

const add_v2 = (a, b) => v2(a.x + b.x, a.y + b.y);

const scale_v2 = (v, scalar) => v2(v.x * scalar, v.y * scalar);
const clamp_v2 = (v, limits) => v2(clamp(v.x, -limits.x, limits.x), clamp(v.y, -limits.y, limits.y));
const clamp = (val, min, max) => (val < min ? min : val > max ? max : val);
const max_v2 = (a, b) => v2(Math.max(a.x, b.x), Math.max(a.y, b.y));
const or_v2 = (a, b) => v2(a.x || b.x, a.y || b.y);
const min_v2 = (a, b) => v2(Math.min(a.x, b.x), Math.min(a.y, b.y));

function rand_v2(min = v2(0, 0), max = v2(window.innerWidth, window.innerHeight)) {
  return v2(r_range(min.x, max.x), r_range(min.y, max.y));
}

const compare_v2 = (a, b, scalar) => magnitude_v2(a, b) < scalar;

function rotate_v2(pos, center, angle) {
  const x = pos.x - center.x;
  const y = pos.y - center.y;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const newX = x * cos - y * sin;
  const newY = x * sin + y * cos;
  return v2(newX + center.x, newY + center.y);
}

function div_v2(a, b) {
  return v2(a.x / b.x, a.y / b.y);
}
