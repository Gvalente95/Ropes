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

function v2(x = 0, y = 0) {
  return new Vec2(x, y);
}

function magnitude_v2(a, b) {
  return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
}
function sub_v2(a, b) {
  return v2(a.x - b.x, a.y - b.y);
}
function normalize_v2(v) {
  var mag = Math.sqrt(v.x * v.x + v.y * v.y);
  if (mag === 0) return v2(0, 0);
  return v2(v.x / mag, v.y / mag);
}
function mult_v2(a, b) {
  return v2(a.x * b.x, a.y * b.y);
}
function add_v2(a, b) {
  return v2(a.x + b.x, a.y + b.y);
}

function scale_v2(v, scalar) {
  return v2(v.x * scalar, v.y * scalar);
}

function clamp_v2(v, limits) {
  return v2(clamp(v.x, -limits.x, limits.x), clamp(v.y, -limits.y, limits.y));
}

function clamp(val, min, max) {
  return val < min ? min : val > max ? max : val;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function rand_v2(min = v2(0, 0), max = v2(window.innerWidth, window.innerHeight)) {
  return v2(r_range(min.x, max.x), r_range(min.y, max.y));
}

function compare_v2(a, b, scalar) {
  return magnitude_v2(a, b) < scalar;
}

function r_range(min, max) {
  return Math.random() * (max - min) + min;
}

function r_range_int(min, max) {
  return Math.floor(Math.random() * (max - min) + min);
}

function rotate(velocity, angle) {
  return {
    x: velocity.x * Math.cos(angle) - velocity.y * Math.sin(angle),
    y: velocity.x * Math.sin(angle) + velocity.y * Math.cos(angle),
  };
}

function rotate_v2(pos, center, angle) {
  const x = pos.x - center.x;
  const y = pos.y - center.y;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const newX = x * cos - y * sin;
  const newY = x * sin + y * cos;
  return v2(newX + center.x, newY + center.y);
}

function clampAngle(dir, minA, maxA) {
  let a = Math.atan2(dir.y, dir.x);
  if (a < minA) a = minA;
  if (a > maxA) a = maxA;
  return v2(Math.cos(a), Math.sin(a));
}

function div_v2(a, b) {
  return v2(a.x / b.x, a.y / b.y);
}

function rectInRect(ap, as, angleA, bp, bs, angleB) {
  var aBrd = [ap, v2(ap.x + as.x, ap.y), v2(ap.x, ap.y + as.y), v2(ap.x + as.x, ap.y + as.y)];
  var bBrd = [bp, v2(bp.x + bs.x, bp.y), v2(bp.x, bp.y + bs.y), v2(bp.x + bs.x, bp.y + bs.y)];

  var aCenter = add_v2(ap, scale_v2(as, 0.5));
  var bCenter = add_v2(bp, scale_v2(bs, 0.5));
  for (let i = 0; i < 4; i++) {
    bBrd[i] = rotate_v2(bBrd[i], bCenter, angleB);
    drawCircle2(ctx, bBrd[i].x, bBrd[i].y, 2, "red");
  }
  for (let i = 0; i < 4; i++) {
    const a = rotate_v2(aBrd[i], aCenter, angleA);
    drawCircle2(ctx, a.x, a.y, 2, "blue");

    if (pointInTriangle(a.x, a.y, bBrd[0].x, bBrd[0].y, bBrd[1].x, bBrd[1].y, bBrd[2].x, bBrd[2].y)) {
      // var angA = Math.atan2(bBrd[0].x - a.x, bBrd[0].y - a.y);
      return true;
    }
    if (pointInTriangle(a.x, a.y, bBrd[1].x, bBrd[1].y, bBrd[2].x, bBrd[2].y, bBrd[3].x, bBrd[3].y)) {
      return true;
    }
  }
  return 0;
}

function pointInRect(point, rPos, rSize, angle = 0) {
  if (!angle) return point.x >= rPos.x && point.x <= rPos.x + rSize.x && point.y >= rPos.y && point.y <= rPos.y + rSize.y;
  const center = add_v2(rPos, scale_v2(rSize, 0.5));
  const p = rotate_v2(point, center, -angle);
  return p.x >= rPos.x && p.x <= rPos.x + rSize.x && p.y >= rPos.y && p.y <= rPos.y + rSize.y;
}

function circleInRect(pos, radius, rPos, rSize) {
  // Find closest point on rectangle to pos center
  var closestX = Math.max(rPos.x, Math.min(pos.x, rPos.x + rSize.x));
  var closestY = Math.max(rPos.y, Math.min(pos.y, rPos.y + rSize.y));
  // Calculate distance from circle center to closest point
  var dx = pos.x - closestX;
  var dy = pos.y - closestY;
  var distSq = dx * dx + dy * dy;
  return distSq < radius * radius;
}

function pointInCircle(point, circleCenter, circleRadius) {
  var dx = point.x - circleCenter.x;
  var dy = point.y - circleCenter.y;
  return dx * dx + dy * dy <= circleRadius * circleRadius;
}

function circleInCircle(innerPos, innerRadius, outerPos, outerRadius) {
  if (outerRadius < innerRadius) return false;
  var dx = innerPos.x - outerPos.x;
  var dy = innerPos.y - outerPos.y;
  var distSq = dx * dx + dy * dy;
  var allowed = (outerRadius - innerRadius) * (outerRadius - innerRadius);
  return distSq <= allowed;
}

function circleOverlap(pos1, radius1, pos2, radius2) {
  var dx = pos1.x - pos2.x;
  var dy = pos1.y - pos2.y;
  var distSq = dx * dx + dy * dy;
  var minDist = radius1 + radius2;
  return distSq < minDist * minDist;
}

function pingPong(time, max, speed = 1, smooth = 2) {
  // time: frame or time value
  // max: maximum value to reach
  // speed: controls oscillation speed (higher = faster)
  // smooth: controls smoothness at direction change (1 = sharp, 2 = sine, >2 = very smooth)
  const cycle = (time * speed) % 2; // 0 to 2
  const sineValue = Math.sin(cycle * Math.PI); // -1 to 1 to -1
  const smoothedValue = Math.pow(Math.abs(sineValue), 1 / smooth) * Math.sign(sineValue);
  return smoothedValue * max;
}
