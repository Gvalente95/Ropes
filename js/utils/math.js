const lerp = (a, b, t) => a + (b - a) * t;

const r_range = (min, max) => Math.random() * (max - min) + min;

const r_range_int = (min, max) => Math.floor(Math.random() * (max - min) + min);

function rotate(velocity, angle) {
  return {
    x: velocity.x * Math.cos(angle) - velocity.y * Math.sin(angle),
    y: velocity.x * Math.sin(angle) + velocity.y * Math.cos(angle),
  };
}

function clampAngle(dir, minA, maxA) {
  let a = Math.atan2(dir.y, dir.x);
  if (a < minA) a = minA;
  if (a > maxA) a = maxA;
  return v2(Math.cos(a), Math.sin(a));
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

function wrapScreenX(localX, z = 0) {
  var stripWidth = winSize.x + 300;
  var parallax = 1 / (1 + z * 0.2);
  var x = localX - cam.scroll.x * parallax;

  x = ((x % stripWidth) + stripWidth) % stripWidth;

  return x - 150;
}

function roll(chance) {
  return r_range_int(0, 100) < chance;
}
