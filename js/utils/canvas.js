let showStripes = false;

var _canvas = null;
var ctx = null;
var displayCanvas = null;
var displayCtx = null;
var gameCanvas = null;
var gameCtx = null;
var menuCanvas = null;
var menuCtx = null;

function hslToRgb(h, s, l) {
  h = h / 360;
  s = s / 100;
  l = l / 100;
  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

function drawLine(ctx, start, end, color = "white", width = 2, handleSize = 0) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.stroke();
  if (handleSize > 0) drawCircle2(ctx, end.x, end.y, handleSize * _scale);
}

function drawLineBottomShade(ctx, p, end, color, lineWidth) {
  const dx = end.x - p.x;
  const dy = end.y - p.y;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  let nx = -dy / len;
  let ny = dx / len;
  if (ny < 0) {
    nx = -nx;
    ny = -ny;
  }
  const shadeSize = lineWidth;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(p.x, p.y);
  ctx.lineTo(end.x, end.y);
  ctx.lineTo(end.x + nx * shadeSize, end.y + ny * shadeSize);
  ctx.lineTo(p.x + nx * shadeSize, p.y + ny * shadeSize);
  ctx.closePath();
  ctx.clip();
  drawLine(ctx, p, end, darkenColor(color, 0.75), lineWidth);
  ctx.restore();
}

function drawStripedLine(p0, p1, color1, color2 = "rgba(0, 0, 0, 0)") {
  const dx = p1.x - p0.x;
  const dy = p1.y - p0.y;
  const len = Math.hypot(dx, dy);
  if (!len) return;
  const stripe = 10;
  const speed = 3;
  const ux = dx / len;
  const uy = dy / len;
  let offset = (FRAME * speed) % (stripe * 2);
  if (len <= stripe) offset = 0;
  let curX = p0.x + ux * offset;
  let curY = p0.y + uy * offset;
  let remaining = len - offset;
  if (remaining <= 0) {
    curX = p0.x;
    curY = p0.y;
    remaining = len;
    offset = 0;
  }
  ctx.lineWidth = 5;
  const steps = Math.ceil(remaining / stripe);
  for (let s = 0; s < steps; s++) {
    const segLen = Math.min(stripe, remaining - s * stripe);
    const nextX = curX + ux * segLen;
    const nextY = curY + uy * segLen;
    ctx.beginPath();
    ctx.moveTo(curX, curY);
    ctx.lineTo(nextX, nextY);
    ctx.strokeStyle = s % 2 === 0 ? color1 : color2;
    ctx.stroke();
    curX = nextX;
    curY = nextY;
  }
}

function drawCircle2(ctx, x, y, radius = 2, color = "white", strokeColor = "black", lineWidth = 4) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, 2 * Math.PI);
  var prevStroke = ctx.strokeStyle;
  var prevLw = ctx.lineWidth;
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = lineWidth;
  if (color) {
    ctx.fillStyle = color;
    ctx.fill();
  }
  ctx.stroke();
  ctx.closePath();
  ctx.lineWidth = prevLw;
  ctx.strokeStyle = prevStroke;
}

function drawCircleBottomShade(ctx, x, y, r, angle = 0, alpha = 0.16) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI);
  ctx.fillStyle = `rgba(0,0,0,${alpha})`;
  ctx.fill();

  ctx.restore();
}

function drawBezierLine(start, end, ctrl, color = "white", color2 = null, width = 16) {
  const dist1 = Math.hypot(ctrl.x - start.x, ctrl.y - start.y);
  const dist2 = Math.hypot(end.x - ctrl.x, end.y - ctrl.y);
  const approxLength = dist1 + dist2;
  const step = Math.max(0.01, width / approxLength);
  ctx.fillStyle = color;
  for (let t = 0; t <= 1; t += step) {
    const mt = 1 - t;
    const x = mt * mt * start.x + 2 * mt * t * ctrl.x + t * t * end.x;
    const y = mt * mt * start.y + 2 * mt * t * ctrl.y + t * t * end.y;
    if (color2) ctx.fillStyle = lerpColor(color, color2, t);
    ctx.fillRect(x, y, width, width);
  }
}

function initCanvas(size = [window.innerWidth, window.innerHeight], pos = [0, 0]) {
  // Create visible display canvas
  displayCanvas = document.createElement("canvas");
  displayCanvas.style.backgroundColor = "black";
  displayCtx = displayCanvas.getContext("2d");
  displayCanvas.width = size[0];
  displayCanvas.height = size[1];
  displayCanvas.style.left = pos.x;
  displayCanvas.style.top = pos.y;
  document.body.appendChild(displayCanvas);

  // Create off-screen game canvas
  gameCanvas = document.createElement("canvas");
  gameCtx = gameCanvas.getContext("2d");
  gameCanvas.width = size[0];
  gameCanvas.height = size[1];

  // Create off-screen menu canvas
  menuCanvas = document.createElement("canvas");
  menuCtx = menuCanvas.getContext("2d");
  menuCanvas.width = size[0];
  menuCanvas.height = size[1];

  // Set ctx to gameCtx (all drawing happens here by default)
  ctx = gameCtx;
  _canvas = gameCanvas;
}

function drawText(ctx, x, y, text, color = "white", backgroundColor = null, size = 25, centered = true) {
  if (!size) size = 25;
  size *= 1;
  ctx.font = size + "px MyPixelFont";
  const metrics = ctx.measureText(text);
  const w = metrics.width + 12;
  const h = size + 8;

  let cx = x,
    cy = y;
  if (centered) {
    cx -= w / 2;
    cy -= h / 2;
  }

  if (backgroundColor) {
    ctx.fillStyle = backgroundColor;
    if (!centered) ctx.fillRect(cx - 5, cy - h / 2, w, h);
    else ctx.fillRect(cx, cy, w, h);
  }
  ctx.fillStyle = color;
  ctx.textAlign = centered ? "center" : "left";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x, y + 15);
  return w;
}

function sameSide(px, py, ax, ay, bx, by, cx, cy) {
  const cross1 = (bx - ax) * (py - ay) - (by - ay) * (px - ax);
  const cross2 = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
  return cross1 * cross2 >= 0;
}

function pointInTriangle(px, py, ax, ay, bx, by, cx, cy) {
  return sameSide(px, py, ax, ay, bx, by, cx, cy) && sameSide(px, py, bx, by, cx, cy, ax, ay) && sameSide(px, py, cx, cy, ax, ay, bx, by);
}

function drawTriangle(ctx, p0, p1, p2, color = "white", width = 2, strokeColor = color) {
  ctx.beginPath();
  ctx.moveTo(p0.x, p0.y);
  ctx.lineTo(p1.x, p1.y);
  ctx.lineTo(p2.x, p2.y);
  ctx.closePath();

  ctx.fillStyle = color;
  ctx.fill();

  ctx.lineWidth = width;
  ctx.strokeStyle = strokeColor;
  ctx.stroke();
}

function drawTriangleBorder(ctx, p0, p1, p2, color = "white", width = 2) {
  drawLine(ctx, p0, p1, color, width);
  drawLine(ctx, p1, p2, color, width);
  drawLine(ctx, p2, p0, color, width);
}

function drawRect(x, y, width, height, color, strokeColor, _ctx, angle = 0, gradient = null) {
  if (angle) {
    _ctx.save();
    _ctx.translate(x + width / 2, y + height / 2);
    _ctx.rotate(angle);
    drawRect(-width / 2, -height / 2, width, height, color, strokeColor, _ctx, 0, gradient);
    _ctx.restore();
    return;
  }
  if (!_ctx) _ctx = ctx;

  if (color || gradient) {
    if (gradient && gradient.color1 && gradient.color2) {
      let grad;
      if (gradient.direction === "vertical") {
        grad = _ctx.createLinearGradient(x, y, x, y + height);
      } else if (gradient.direction === "diagonal") {
        grad = _ctx.createLinearGradient(x, y, x + width, y + height);
      } else if (gradient.direction === "radial") {
        const centerX = x + width / 2;
        const centerY = y + height / 2;
        const radius = Math.max(width, height) / 2;
        grad = _ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
      } else {
        // horizontal by default
        grad = _ctx.createLinearGradient(x, y, x + width, y);
      }
      grad.addColorStop(0, gradient.color1);
      grad.addColorStop(1, gradient.color2);
      _ctx.fillStyle = grad;
    } else {
      _ctx.fillStyle = color;
    }
    _ctx.fillRect(x, y, width, height);
    if (strokeColor) {
      _ctx.strokeStyle = strokeColor;
      _ctx.strokeRect(x, y, width, height);
    }
  } else if (strokeColor) {
    _ctx.strokeStyle = strokeColor;
    _ctx.strokeRect(x, y, width, height);
  }
}

function drawSpine(pos, angle, curvature, width, height) {
  // Clamp curvature to [-π, π] range where ±π = full circle rotation
  curvature = clamp(curvature, -Math.PI, Math.PI);

  const steps = Math.max(1, Math.ceil(height / 2)); // segment spacing, minimum 1
  const segmentLength = height / steps; // length of each segment

  // Total rotation distributed across all segments
  const totalRotation = curvature * 2; // ±π represents full 2π circle
  const angleStep = totalRotation / steps;

  let currentX = pos.x;
  let currentY = pos.y;
  let currentAngle = angle;

  for (let i = 0; i < steps; i++) {
    const progress = i / steps; // 0 to 1
    const taperFactor = 1 - progress; // Width decreases toward end
    const segmentWidth = width * taperFactor;
    const halfWidth = segmentWidth / 2;

    // Define rectangle corners in local space
    const corners = [
      [-halfWidth, 0],
      [halfWidth, 0],
      [halfWidth, segmentLength],
      [-halfWidth, segmentLength],
    ];

    // Rotate corners around current angle
    const rotatedCorners = corners.map((corner) => {
      const rotX = corner[0] * Math.cos(currentAngle) - corner[1] * Math.sin(currentAngle);
      const rotY = corner[0] * Math.sin(currentAngle) + corner[1] * Math.cos(currentAngle);
      return [currentX + rotX, currentY + rotY];
    });

    // Draw this segment
    ctx.beginPath();
    ctx.moveTo(rotatedCorners[0][0], rotatedCorners[0][1]);
    for (let j = 1; j < rotatedCorners.length; j++) {
      ctx.lineTo(rotatedCorners[j][0], rotatedCorners[j][1]);
    }
    ctx.closePath();
    ctx.fillStyle = `rgba(255, 255, 255, ${0.6 * taperFactor})`;
    ctx.fill();

    // Move to next segment position along current direction
    currentX += Math.cos(currentAngle) * segmentLength;
    currentY += Math.sin(currentAngle) * segmentLength;

    // Update angle for next segment
    currentAngle += angleStep;
  }
}

function drawSlider(ctx, pos, size, value, min, max, fillColor = "rgba(255, 255, 255, 1)", backgroundColor = "rgba(255, 255, 255, 0.23)") {
  drawRect(pos.x, pos.y, size.x, size.y, backgroundColor);

  var normalizedValue = (value - min) / (max - min);
  var x = size.x * normalizedValue;
  drawRect(pos.x, pos.y, x, size.y, fillColor, null, ctx);
  var fixedValue = value;
  if (value !== Math.floor(value)) {
    fixedValue = Number(value).toFixed(2);
    if (fixedValue !== value) fixedValue += "...";
  }
  drawText(ctx, pos.x - 20, pos.y - 12, fixedValue, "white", null, 10, true);
}

function drawColorPicker(ctx, pos, size, selColor = null) {
  var selAlpha = getAlpha(selColor);
  var rgbSel = selColor.includes("rgba") ? rgbaToRgb(selColor) : selColor;
  var hovColorRgb = null;

  for (let y = 0; y < size.y; y++) {
    for (let x = 0; x < size.x; x++) {
      var colorString;
      if (y <= 4) {
        const xParam = (x / size.x) * 255;
        const gray = Math.round(xParam);
        colorString = `rgb(${gray},${gray},${gray})`;
      } else {
        const hueParam = x / size.x;
        const satParam = y / size.y;
        const hue = hueParam * 360; // 0° to 360° (horizontal)
        const saturation = satParam * 100; // 0% to 100% (vertical)
        const colorRgb = hslToRgb(hue, saturation, 50);
        colorString = `rgb(${colorRgb[0]},${colorRgb[1]},${colorRgb[2]})`;
      }
      var p = v2(pos.x + x, pos.y + y);
      drawRect(p.x, p.y, 1, 1, colorString, null, ctx);
      if (rgbSel === colorString) drawCircle2(ctx, p.x, p.y, 2, "white", "black", 1);
      if (!hovColorRgb && pointInRect(mouse.pos, p, v2(2, 2))) {
        hovColorRgb = colorString;
      }
    }
  }

  if (hovColorRgb) {
    hovColorRgb = setAlpha(hovColorRgb, selAlpha);
    drawRect(mouse.pos.x - 5 - hovColorRgb.length * 3, mouse.pos.y - 35, hovColorRgb.length * 7, 20, "rgba(0, 0, 0, 0.5)", null, ctx);
    drawText(ctx, mouse.pos.x, mouse.pos.y - 40, hovColorRgb, "white", null, 14, true);
  }

  var rad = 5;
  var sx = pos.x - rad * 4;
  var sy = pos.y + rad * 1.6;

  var isTransparent = selAlpha <= 0;
  var clr = isTransparent ? "red" : "green";
  if (mouse.clicked && !hovColorRgb && pointInCircle(mouse.pos, v2(sx, sy), rad)) {
    clr = "orange";
    hovColorRgb = setAlpha(selColor, isTransparent ? 255 : 0);
  }
  drawCircle2(ctx, sx, sy, rad, clr, "white", 1);
  return hovColorRgb;
}

function drawVectorField(ctx, pos, size, selVec = null, value = null) {
  drawRect(pos.x, pos.y, size.x, size.y, "black", null, ctx);
  drawRect(pos.x + size.x / 2 - 0.5, pos.y, 1, size.y, "white", null, ctx);
  drawRect(pos.x, pos.y + size.y / 2 - 0.5, size.x, 1, "white", null, ctx);
  if (selVec) {
    var p = v2(pos.x + selVec.x, pos.y + selVec.y);
    if (value) {
      drawText(ctx, pos.x - 30, pos.y - 10, `x ${value.x}`, "white", null, 10, true);
      drawText(ctx, pos.x - 30, pos.y, `y ${value.y}`, "white", null, 10, true);
    }
    drawCircle2(ctx, p.x, p.y, 2, "rgba(255, 255, 255, 1)", "rgba(255, 255, 255, 0.5)", 1);
  }
  if (pointInRect(mouse.pos, pos, size)) return v2(((mouse.pos.x - pos.x - size.x / 2) / size.x) * 2, ((mouse.pos.y - pos.y - size.y / 2) / size.y) * 2);
  return null;
}

function getAngle(a, b) {
  return Math.atan2(a.y - b.y, a.x - b.x);
}

function drawArrowFromAngle(start, angle, length = 10, color = "white", _ctx = ctx) {
  var end = v2(start.x - Math.cos(angle) * length, start.y - Math.sin(angle) * length);
  drawLine(_ctx, start, end, color);
  var ang1 = angle - Math.PI / 4;
  var ang2 = angle + Math.PI / 4;
  var pLength = clamp(length / 2, -20, 20);
  var point1 = v2(end.x + Math.cos(ang1) * pLength, end.y + Math.sin(ang1) * pLength);
  var point2 = v2(end.x + Math.cos(ang2) * pLength, end.y + Math.sin(ang2) * pLength);
  drawLine(_ctx, end, point1, color);
  drawLine(_ctx, end, point2, color);
}

function drawArrowFromPos(start, end, color = "white", _ctx = ctx) {
  var angle = getAngle(start, end);
  var dist = magnitude_v2(start, end);
  drawArrowFromAngle(start, angle, dist, color, _ctx);
}

function drawCross(ctx, pos, size = v2(10, 10), angle, thickFactor = 0.2, color = "white", centerColor = "grey") {
  var w = size.x * thickFactor;
  var h = size.y * thickFactor;
  drawRect(pos.x + size.x / 2 - w / 2, pos.y, w, size.y, color, null, ctx, angle);
  drawRect(pos.x, pos.y + size.y / 2 - h / 2, size.x, h, color, null, ctx, angle);
  if (centerColor) {
    w = size.x * thickFactor * 2;
    h = size.y * thickFactor * 2;
    drawRect(pos.x + size.x / 2 - w / 2, pos.y + size.y / 2 - h / 2, w, h, centerColor, null, ctx, angle);
  }
}

function drawStar(ctx, pos, sidesAmount = 8, angle = 0, length = 8, thick = 64, color1 = "black", color2 = "white") {
  var stepSize = (Math.PI * 2) / sidesAmount;
  var ang = angle;
  var center = pos;
  for (let i = 0; i < sidesAmount; i++) {
    var len = length * 20;
    var thk = thick;
    if (i % 2 === 0) {
      thk *= 0.8;
    }
    var endDir = v2(Math.cos(ang), Math.sin(ang));
    var horDir = v2(Math.cos(ang + Math.PI / 2) * thk, Math.sin(ang + Math.PI / 2) * thk);

    var p = rotate_v2(add_v2(center, horDir), center, ang);
    var p1 = rotate_v2(sub_v2(center, horDir), center, ang);
    var p2 = rotate_v2(add_v2(center, v2(endDir.x * len, endDir.y * len)), center, ang);

    var clr = color2 ? addColor(color1, color2, i / sidesAmount) : color1;
    drawTriangle(ctx, p, p1, p2, clr);

    ang += stepSize;
  }
}
