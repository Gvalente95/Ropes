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
  ctx.moveTo(start[0], start[1]);
  ctx.lineTo(end[0], end[1]);
  ctx.stroke();
  if (handleSize > 0) drawCircle2(ctx, end, handleSize * _scale);
}

function drawStripedLine(p0, p1, color1, color2 = "rgba(0, 0, 0, 0)") {
  const dx = p1[0] - p0[0];
  const dy = p1[1] - p0[1];
  const len = Math.hypot(dx, dy);
  if (!len) return;
  const stripe = 10;
  const speed = 3;
  const ux = dx / len;
  const uy = dy / len;
  let offset = (FRAME * speed) % (stripe * 2);
  if (len <= stripe) offset = 0;
  let curX = p0[0] + ux * offset;
  let curY = p0[1] + uy * offset;
  let remaining = len - offset;
  if (remaining <= 0) {
    curX = p0[0];
    curY = p0[1];
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

function drawCircle2(ctx, pos, radius = 2, color = "white", strokeColor = "black", lineWidth = 4) {
  ctx.beginPath();
  ctx.arc(pos[0], pos[1], radius, 0, 2 * Math.PI);
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = lineWidth;
  if (color) {
    ctx.fillStyle = color;
    ctx.fill();
  }
  ctx.stroke();
  ctx.closePath();
}

function drawBezierLine(start, end, ctrl, color = "white", width = 8) {
  const step = 0.001;
  ctx.fillStyle = color;

  for (let t = 0; t <= 1; t += step) {
    const mt = 1 - t;

    const x = mt * mt * start[0] + 2 * mt * t * ctrl[0] + t * t * end[0];
    const y = mt * mt * start[1] + 2 * mt * t * ctrl[1] + t * t * end[1];

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
  displayCanvas.style.left = pos[0];
  displayCanvas.style.top = pos[1];
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

function drawText(ctx, pos, text, color = "white", backgroundColor = null, size = 25, centered = true) {
  if (!size) size = 25;
  size *= 1;
  ctx.font = size + "px MyPixelFont";
  const metrics = ctx.measureText(text);
  const w = metrics.width + 12;
  const h = size + 8;

  let x = pos[0],
    y = pos[1];
  if (centered) {
    x -= w / 2;
    y -= h / 2;
  }

  if (backgroundColor) {
    ctx.fillStyle = backgroundColor;
    if (!centered) ctx.fillRect(x - 5, y - h / 2, w, h);
    else ctx.fillRect(x, y, w, h);
  }
  ctx.fillStyle = color;
  ctx.textAlign = centered ? "center" : "left";
  ctx.textBaseline = "middle";
  ctx.fillText(text, pos[0], pos[1] + 15);
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

function drawTriangle(ctx, p0, p1, p2, color = "white", width = 2) {
  ctx.beginPath();
  ctx.moveTo(p0[0], p0[1]);
  ctx.lineTo(p1[0], p1[1]);
  ctx.lineTo(p2[0], p2[1]);
  ctx.closePath();

  ctx.fillStyle = color;
  ctx.fill();

  ctx.lineWidth = width;
  ctx.strokeStyle = color;
  ctx.stroke();
}

function drawTriangleBorder(ctx, p0, p1, p2, color = "white", width = 2) {
  drawLine(ctx, p0, p1, color, width);
  drawLine(ctx, p1, p2, color, width);
  drawLine(ctx, p2, p0, color, width);
}

function drawRect(x, y, width, height, color, strokeColor, _ctx) {
  if (!_ctx) _ctx = ctx; // Use main ctx if not provided
  var prev = _ctx.lineWidth;
  _ctx.lineWidth = strokeColor ? (typeof strokeColor === "number" ? strokeColor : 1) : 1;

  if (color) {
    _ctx.fillStyle = color;
    _ctx.fillRect(x, y, width, height);
    if (strokeColor && typeof strokeColor === "string") {
      _ctx.strokeStyle = strokeColor;
      _ctx.strokeRect(x, y, width, height);
    }
  } else if (strokeColor && typeof strokeColor === "string") {
    _ctx.strokeStyle = strokeColor;
    _ctx.strokeRect(x, y, width, height);
  }
  _ctx.lineWidth = prev;
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
  drawRect(pos[0], pos[1], size[0], size[1], backgroundColor);

  var normalizedValue = (value - min) / (max - min);
  var x = size[0] * normalizedValue;
  drawRect(pos[0], pos[1], x, size[1], fillColor, null, ctx);
  var fixedValue = value;
  if (value !== Math.floor(value)) {
    fixedValue = Number(value).toFixed(2);
    if (fixedValue !== value) fixedValue += "...";
  }
  drawText(ctx, [pos[0] - 20, pos[1] - 12], fixedValue, "white", null, 10, true);
}

function drawColorPicker(ctx, pos, size, selColor = null) {
  var hovColorRgb = null;

  for (let y = 0; y < size[1]; y++) {
    for (let x = 0; x < size[0]; x++) {
      const hueParam = x / size[0];
      const satParam = y / size[1];
      const hue = hueParam * 360; // 0° to 360° (horizontal)
      const saturation = satParam * 100; // 0% to 100% (vertical)
      const colorRgb = hslToRgb(hue, saturation, 50);
      const colorString = `rgb(${colorRgb[0]},${colorRgb[1]},${colorRgb[2]})`;
      var p = new Vec2(pos[0] + x, pos[1] + y);

      drawRect(p.x, p.y, 1, 1, colorString, null, ctx);

      if (selColor === colorString) {
        drawCircle2(ctx, [p.x, p.y], 2, "white", "black", 1);
      }

      if (!hovColorRgb && pointInRect(mouse.pos, p, new Vec2(2, 2))) {
        hovColorRgb = colorString;
      }
    }
  }

  if (hovColorRgb) {
    drawRect(mouse.pos.x - 5 - hovColorRgb.length * 3, mouse.pos.y - 35, hovColorRgb.length * 7, 20, "rgba(0, 0, 0, 0.5)", null, ctx);
    drawText(ctx, [mouse.pos.x, mouse.pos.y - 40], hovColorRgb, "white", null, 14, true);
  }
  return hovColorRgb;
}


function drawVectorField(ctx, pos, size, selVec = null) {
	
}