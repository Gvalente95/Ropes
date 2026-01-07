class RopeSegment {
  constructor(pos, rope) {
    this.pos = pos;
    this.prevPos = pos;
    this.rope = rope;
    this.isAnchor = false;
    this.anchorPos = null;
    this.anchorObject = null;
    this.anchorOffset = new Vec2(0, 0);
  }

  getAnchorOffset(anchorObject) {
    if (!anchorObject) return null;
    var angle = Math.atan2(this.pos.y - anchorObject.pos.y, this.pos.x - anchorObject.pos.x);
    var dir = new Vec2(Math.cos(angle), Math.sin(angle));
    if (anchorObject.type === "CIRCLE") {
      return scale_v2(dir, anchorObject.size.x);
    } else if (anchorObject.type === "SQUARE") {
      const hw = anchorObject.size.x / 2;
      const hh = anchorObject.size.y / 2;
      if (Math.abs(dir.x) > Math.abs(dir.y)) {
        return new Vec2(dir.x > 0 ? hw : -hw, dir.y * hh);
      } else {
        return new Vec2(dir.x * hw, dir.y > 0 ? hh : -hh);
      }
    }
    return null;
  }

  attachToShape(anchorObject = null, anchorOffset = this.getAnchorOffset(anchorObject)) {
    this.anchorObject = anchorObject;
    this.anchorObject.attachedSegments.push(this);
    if (this.anchorObject) this.isAnchor = false;
    if (anchorOffset) this.anchorOffset = anchorOffset;
  }

  setAnchor(pos = new Vec2(this.pos), _anchorObject = null) {
    if (_anchorObject) {
      this.anchorObject = _anchorObject;
      this.isAnchor = true;
    } else if (!pos) {
      this.isAnchor = false;
      this.anchorPos = null;
    } else {
      this.isAnchor = true;
      this.anchorPos = pos;
    }
  }

  place(newPos) {
    this.pos = newPos;
    this.anchorPos = newPos;
  }

  applyAnchorPullForces() {
    var shape = this.anchorObject;
    if (!shape) return;

    // Calculate where segment should be attached to anchor
    const anchoredPos = add_v2(shape.pos, this.anchorOffset);
    this.anchorPos = rotate_v2(anchoredPos, shape.center, shape.angle);

    this.pos = this.anchorPos;
    return;
    const neighbors = this.rope.segments;
    const myIndex = neighbors.indexOf(this);
    let totalPull = new Vec2(0, 0);

    if (myIndex > 0) {
      const prev = neighbors[myIndex - 1];
      const dx = prev.pos.x - this.anchorPos.x;
      const dy = prev.pos.y - this.anchorPos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const overstretch = Math.max(0, dist - this.rope.segSpace);
      if (overstretch > 0) {
        totalPull.x += (dx / dist) * overstretch;
        totalPull.y += (dy / dist) * overstretch;
      }
    }

    if (myIndex < neighbors.length - 1) {
      const next = neighbors[myIndex + 1];
      const dx = next.pos.x - this.anchorPos.x;
      const dy = next.pos.y - this.anchorPos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const overstretch = Math.max(0, dist - this.rope.segSpace);
      if (overstretch > 0) {
        totalPull.x += (dx / dist) * overstretch;
        totalPull.y += (dy / dist) * overstretch;
      }
    }

    const pullMagnitude = Math.sqrt(totalPull.x * totalPull.x + totalPull.y * totalPull.y);
    if (pullMagnitude > 0) {
      const stiffness = 0.5;
      shape.pos.x += totalPull.x * stiffness;
      shape.pos.y += totalPull.y * stiffness;

      this.anchorPos = add_v2(shape.pos, this.anchorOffset);
    }

    // Segment follows final anchor position
    this.pos = this.anchorPos;
  }

  update() {
    if (this.isAnchor || this === selSegment) return;

    if (this.anchorObject) {
      this.applyAnchorPullForces();
      return;
    }

    var rope = this.rope;
    var movement = sub_v2(this.pos, this.prevPos);
    var vel = scale_v2(movement, rope.damp * r_range(0.8, 1.2));
    this.prevPos = new Vec2(this.pos.x, this.pos.y);
    var newPos = add_v2(this.pos, vel);
    var grav = rope.gravity || new Vec2(0, 0);
    newPos.x += (grav.x || 0) * dt;
    newPos.y += (grav.y || 0) * dt;
    for (const a of airPushers) newPos = a.getWindForceAtPos(newPos, rope.thick / 100);

    const floorY = window.innerHeight - rope.thick / 2;
    if (newPos.y >= floorY) {
      const velX = newPos.x - this.prevPos.x;
      if (rope.groundFriction) newPos.x = this.pos.x + velX * rope.groundFriction;
      newPos.y = floorY;
      if (rope.gravity.y >= 0) rope.grounded = true;
    }
    const ceilingY = rope.thick / 2;
    if (newPos.y <= ceilingY) {
      const velX = newPos.x - this.prevPos.x;
      newPos.x = this.pos.x + velX * rope.groundFriction;
      newPos.y = ceilingY;
      if (rope.gravity.y <= 0) rope.grounded = true;
    }
    if (newPos.x <= rope.thick / 2 && rope.gravity.x <= 0) rope.grounded = true;
    else if (newPos.x >= window.innerWidth - rope.thick / 2 && rope.gravity.x >= 0) rope.grounded = true;

    newPos.x = clamp(newPos.x, rope.thick, window.innerWidth - rope.thick);
    this.pos = newPos;
  }

  remove() {
    console.warn("REMOVING SEG ");
    if (this.anchorObject) {
      var idx = this.anchorObject.attachedSegments.indexOf(this);
      if (idx !== -1) this.anchorObject.attachedSegments.splice(idx, 1);
    }
  }
}

class Rope {
  constructor(start, end = null, color = getRandomColor(), thick = r_range(1, 20), _segAmount = 50, _segSpace = segSpace, _damp = dampingFactor) {
    this.segAmount = _segAmount;
    this.segSpace = _segSpace;
    this.damp = _damp;
    this.gravity = new Vec2(gravity.x, gravity.y);
    this.color = color;
    this.collisionsEnabled = true;
    this.groundFriction = ropeGroundFriction;
    this.color2 = getRandomColor();
    this.thick = thick;
    this.isChain = false;
    this.stiffness = 0;
    this.stripesOccurence = r_range_int(0, 50);
    this.setSpines(0);
    this.init(start, end);
  }

  setChain(stiffness) {
    this.stiffness = stiffness;
    this.isChain = stiffness > 0;
  }

  setSpines(occurence = r_range_int(4, 12), color = getRandomColor(), angle = r_range(0, 0.3), curve = r_range(-Math.PI / 2, Math.PI / 2), size = new Vec2(r_range_int(this.thick / 16, this.thick), r_range_int(this.thick / 2, this.thick * 2))) {
    this.spineOccurence = occurence;
    this.spineColor = color;
    this.spineAngle = angle;
    this.spineCurvature = curve;
    this.spineSize = size;
    this.spineTappering = r_range_int(0, 8) !== 0;
  }

  duplicate() {
    var dist = this.thick * 2;
    var start = new Vec2(this.segments[0].pos.x + dist, this.segments[0].pos.y + dist);
    var last = this.segments[this.segments.length - 1];
    var end = last.isAnchor ? null : new Vec2(last.pos.x + 5, last.pos.y + 5);
    var newRope = new Rope(start, end, this.color, this.thick, this.segAmount, this.segSpace, this.damp);
    newRope.stiffness = this.stiffness;
    newRope.collisionsEnabled = this.collisionsEnabled;
    newRope.isChain = this.isChain;
    newRope.stripesOccurence = this.stripesOccurence;
    newRope.color2 = this.color2;
    newRope.gravity = new Vec2(this.gravity.x, this.gravity.y);
    newRope.groundFriction = this.groundFriction;
    if (!last.isAnchor) newRope.segments[newRope.segAmount - 1].setAnchor(null);
    ropes.push(newRope);
  }
  setAnchor(indices) {
    for (const index of indices) {
      this.segments[index].setAnchor();
    }
  }
  remove() {
    Rope.remove(this);
  }

  setNewSegAmount(newSegAmount) {
    if (newSegAmount === this.segAmount) return;
    var start = this.segments[0].pos;
    var end = null;
    var last = this.segments[this.segments.length - 1];
    if (last.isAnchor) end = new Vec2(last.pos.x + this.thick / 2, last.pos.y);
    var prevAmount = this.segAmount;
    var oldPositions = [];
    for (let i = 0; i < prevAmount; i++) {
      let p = this.segments[i].pos;
      oldPositions.push([p[0], p[1]]);
    }

    this.segAmount = newSegAmount;
    this.init(start, end);
    if (oldPositions.length === 0) return;
    return;
    var min = Math.min(oldPositions.length, newSegAmount);
    for (let i = 0; i < min; i++) this.segments[i].pos = new Vec2(oldPositions[i].x, oldPositions[i].y);
    for (let i = 0; i >= min && i < newSegAmount; i++) this.segments[i].pos = new Vec2(oldPositions[min].x, oldPositions[min].y);
  }

  getSegmentOverstretchAmount(seg, x, y, tolerance = 0.1) {
    var maxStretch = this.segSpace * (1 + tolerance);
    var idx = this.segments.indexOf(seg);
    var maxOverstretch = 0;
    if (idx > 0) {
      var prev = this.segments[idx - 1];
      if (!prev.isAnchor) {
        var dPrev = Math.hypot(x - prev.pos.x, y - prev.pos.y);
        if (dPrev > maxStretch) maxOverstretch = Math.max(maxOverstretch, dPrev - maxStretch);
      }
    }
    if (idx < this.segments.length - 1) {
      var next = this.segments[idx + 1];
      if (!next.isAnchor) {
        var dNext = Math.hypot(x - next.pos.x, y - next.pos.y);
        if (dNext > maxStretch) maxOverstretch = Math.max(maxOverstretch, dNext - maxStretch);
      }
    }
    return maxOverstretch;
  }

  // Returns the normal vector (as {x, y}) of a segment, perpendicular to the direction between its neighbors
  getSegmentNormal(seg) {
    const idx = this.segments.indexOf(seg);
    let dir = null;
    if (idx > 0 && idx < this.segments.length - 1) {
      const prev = this.segments[idx - 1].pos;
      const next = this.segments[idx + 1].pos;
      dir = { x: next.x - prev.x, y: next.y - prev.y };
    } else if (idx < this.segments.length - 1) {
      const next = this.segments[idx + 1].pos;
      dir = { x: next.x - seg.pos.x, y: next.y - seg.pos.y };
    } else if (idx > 0) {
      const prev = this.segments[idx - 1].pos;
      dir = { x: seg.pos.x - prev.x, y: seg.pos.y - prev.y };
    } else {
      dir = { x: 0, y: -1 };
    }
    const mag = Math.sqrt(dir.x * dir.x + dir.y * dir.y) || 1;
    return { x: -dir.y / mag, y: dir.x / mag };
  }

  init(start, end) {
    if (end && end.x > window.innerWidth - this.thick) {
      end.x = start.x - this.segAmount * this.segSpace;
    }
    start.x = clamp(start.x, this.thick, window.innerWidth - this.thick);
    start.y = clamp(start.y, this.thick, window.innerHeight - this.thick);

    this.segments = [];
    var step = 1 / this.segAmount;
    var t = 0;
    var lastPos = end ? end : new Vec2(start.x + this.segSpace * this.segAmount, start.y);
    for (let i = 0; i < this.segAmount; i++) {
      var pos = new Vec2(lerp(start.x, lastPos.x, t), lerp(start.y, lastPos.y, t));
      var newSegment = new RopeSegment(pos, this);
      this.segments.push(newSegment);
      t += step;
    }
    if (end && start) {
      this.setAnchor([0, this.segAmount - 1]);
    } else if (start && !end) {
      this.setAnchor([0]);
    }
  }

  rigidifySegments() {
    const stiffness = this.stiffness; // Lower value = smoother, more flexible
    for (let i = 0; i < this.segments.length - 1; i++) {
      const seg = this.segments[i];
      const nextSeg = this.segments[i + 1];
      if (nextSeg.isAnchor) continue;
      const distance = magnitude_v2(seg.pos, nextSeg.pos) || 0.0001;
      const diff = distance - this.segSpace;
      if (Math.abs(diff) > 0.001) {
        const angle = Math.atan2(nextSeg.pos.y - seg.pos.y, nextSeg.pos.x - seg.pos.x);
        const targetX = seg.pos.x + Math.cos(angle) * this.segSpace;
        const targetY = seg.pos.y + Math.sin(angle) * this.segSpace;
        nextSeg.pos.x = lerp(nextSeg.pos.x, targetX, stiffness);
        nextSeg.pos.y = lerp(nextSeg.pos.y, targetY, stiffness);
      }
    }
  }

  handleShapeCollision(seg, shape = null) {
    if (seg.anchorObject === shape) return;
    switch (shape.type) {
      case "SQUARE": {
        // Find closest point on rectangle to segment (like CIRCLE collision)
        const closestX = Math.max(shape.pos.x, Math.min(seg.pos.x, shape.pos.x + shape.size.x));
        const closestY = Math.max(shape.pos.y, Math.min(seg.pos.y, shape.pos.y + shape.size.y));

        // Calculate distance from segment to closest point
        const dx = seg.pos.x - closestX;
        const dy = seg.pos.y - closestY;
        const distSq = dx * dx + dy * dy;
        const radiusSq = (this.thick / 2) * (this.thick / 2);

        if (distSq >= radiusSq) return false;

        const dist = Math.sqrt(distSq) || 0.0001;
        const overlap = this.thick / 2 - dist;

        // Collision normal points from closest point to segment
        const nx = dx / dist;
        const ny = dy / dist;

        // Push segment out along normal
        seg.pos.x = closestX + nx * (this.thick / 2);
        seg.pos.y = closestY + ny * (this.thick / 2);

        if (shape !== selShape && shape.movable) {
          const estimatedMass = shape.mass ?? shape.size.x * shape.size.y;
          const hardness = clamp(this.thick / (this.thick + 0.01 * estimatedMass), 0.05, 1);
          const pushShape = clamp(overlap * 0.5 * hardness, 0, 5);

          // Push shape away along normal
          shape.pos.x -= nx * pushShape;
          shape.pos.y -= ny * pushShape;

          // Calculate segment velocity and transfer momentum (with null check)
          const segVelX = seg.prevPos ? seg.pos.x - seg.prevPos.x : 0;
          const segVelY = seg.prevPos ? seg.pos.y - seg.prevPos.y : 0;
          const segVn = segVelX * nx + segVelY * ny;
          const segMass = this.thick * 0.1;
          const momentumTransfer = segMass / (segMass + estimatedMass * 0.01);

          const vn = shape.vel.x * nx + shape.vel.y * ny; // normal component
          const restitution = 0.3 + 0.6 * hardness; // match circle bounces

          // Reflect normal component
          shape.vel.x -= (1 + restitution) * vn * nx;
          shape.vel.y -= (1 + restitution) * vn * ny;

          // Transfer segment momentum
          shape.vel.x += segVn * nx * momentumTransfer * hardness;
          shape.vel.y += segVn * ny * momentumTransfer * hardness;

          // Add bounce impulse based on penetration
          const bounceBoost = overlap * 0.1 * hardness;
          shape.vel.x += nx * bounceBoost;
          shape.vel.y += ny * bounceBoost;
        }
        break;
      }
      case "CIRCLE": {
        var discCenter = new Vec2(shape.pos.x, shape.pos.y);
        var discRad = shape.size.x + this.thick / 2;
        var dx = seg.pos.x - discCenter.x;
        var dy = seg.pos.y - discCenter.y;
        var distSq = dx * dx + dy * dy;
        var radSq = discRad * discRad;
        if (distSq >= radSq) return false;

        var dist = Math.sqrt(distSq) || 0.0001;
        var pushDist = discRad;
        seg.pos.x = discCenter.x + (dx / dist) * pushDist;
        seg.pos.y = discCenter.y + (dy / dist) * pushDist;
        if (shape !== selShape && shape.movable) {
          if (seg.rope.thick <= 2 && shape.size.x > 5) return;
          const nx = dx / dist;
          const ny = dy / dist;
          const overlap = discRad - dist;
          const hardness = clamp(this.thick / (this.thick + 0.01 * shape.mass), 0.05, 1);
          const pushShape = clamp(overlap * 0.5 * hardness, 0, 5); // stronger push
          shape.pos.x -= nx * pushShape;
          shape.pos.y -= ny * pushShape;

          if (seg.rope.type === "SNAKE") return;

          const vn = shape.vel.x * nx + shape.vel.y * ny; // normal component
          const restitution = 0.3 + 0.6 * hardness; // strong bounces
          shape.vel.x -= (1 + restitution) * vn * nx;
          shape.vel.y -= (1 + restitution) * vn * ny;

          //   const bounceBoost = overlap * 0.1 * hardness;
          //   shape.vel.x += nx * bounceBoost;
          //   shape.vel.y += ny * bounceBoost;
        }

        break;
      }
      case "TRIANGLE":
        break;
    }
    return true;
  }

  handleSegCollision(a, b, minDist = this.thick * 0.75) {
    let dx = a.pos.x - b.pos.x;
    let dy = a.pos.y - b.pos.y;
    let dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < minDist && dist > 0.01) {
      let overlap = minDist - dist;
      let nx = dx / dist;
      let ny = dy / dist;
      let correction = overlap * 0.5 * overlapFactor;
      a.pos.x += nx * correction;
      a.pos.y += ny * correction;
      b.pos.x -= nx * correction;
      b.pos.y -= ny * correction;
    }
  }

  handleCollisions(n) {
    for (let i = 0; i < this.segments.length; i++) {
      let a = this.segments[i];
      if (a.isAnchor) continue;
      for (const s of shapes) {
        if (this.handleShapeCollision(a, s) && input.keys["shift"] && s === selShape && !s.attachedSegments.length) {
          a.attachToShape(s);
        }
      }
      if (n % SelfCollisionsInterval === 0) {
        var closeSegments = colGrid.getAtPos(a.pos.x, a.pos.y);
        for (const b of closeSegments) {
          if (b.rope === undefined) continue;
          if (b.isAnchor) continue;
          if (Math.abs(this.segments.indexOf(a) - this.segments.indexOf(b)) > 2) {
            this.handleSegCollision(a, b);
          }
        }
      }
    }
  }

  applyConstraits() {
    for (let i = 0; i < this.segAmount - 1; i++) {
      var seg = this.segments[i];
      var nextSegment = this.segments[i + 1];
      var segIsAnchor = seg.isAnchor || seg.anchorObject;
      var nextIsAnchor = nextSegment.isAnchor || nextSegment.anchorObject;
      var delta = sub_v2(seg.pos, nextSegment.pos);
      var dist = Math.sqrt(delta.x * delta.x + delta.y * delta.y);
      var diff = dist - this.segSpace;
      var changeDir = sub_v2(seg.pos, nextSegment.pos);
      var normalizedChangeDir = normalize_v2(changeDir);
      var changeVector = scale_v2(normalizedChangeDir, diff);

      const isSnake = this.type === "SNAKE";
      const headBias = isSnake && i === 0 ? 0.2 : 0.5;
      const tailBias = isSnake && i === 0 ? 0.8 : 0.5;

      if (!segIsAnchor && !nextIsAnchor) {
        if (seg !== selSegment) seg.pos = sub_v2(seg.pos, scale_v2(changeVector, headBias));
        nextSegment.pos = add_v2(nextSegment.pos, scale_v2(changeVector, tailBias));
      } else if (!segIsAnchor && nextIsAnchor) {
        if (seg !== selSegment) seg.pos = sub_v2(seg.pos, changeVector);
      } else if (segIsAnchor && !nextIsAnchor) {
        nextSegment.pos = add_v2(nextSegment.pos, changeVector);
      }
    }
  }

  update() {
    var checkCollisions = this.collisionsEnabled && colGrid.active;
    this.grounded = false;
    for (var i = 0; i < this.segments.length; i++) this.segments[i].update();
    for (let n = 0; n < numOfConstraintsRuns; n++) {
      this.applyConstraits();
      if (checkCollisions && n % collisionSegmentInteval === 0) this.handleCollisions(n);
    }
    if (this.stiffness) this.rigidifySegments();
  }

  renderSpine(_ctx, seg, i) {
    const normal = this.getSegmentNormal(seg);
    let spineAngle = Math.atan2(normal.y, normal.x);

    const angleOffset = spineAngle > 0 && spineAngle < Math.PI ? -this.spineAngle : this.spineAngle;
    spineAngle += angleOffset;

    var lim = 0.05;
    if (Math.abs(normal.y) > lim && spineAngle > lim && spineAngle < Math.PI - lim) {
      spineAngle += Math.PI;
    }

    const offset = this.thick / 2;
    const spineStart = new Vec2(seg.pos.x + Math.cos(spineAngle) * offset, seg.pos.y + Math.sin(spineAngle) * offset);
    const baseWidth = this.spineSize.x;
    var height = this.spineSize.y;
    if (this.spineTappering) {
      const spineIndex = Math.min(Math.floor(i / this.spineOccurence), this.spineOccurence - 1);
      height = (this.spineSize.y / this.spineOccurence) * (this.spineOccurence - spineIndex);
    }
    const perpAngle = spineAngle + Math.PI / 2;
    const halfWidth = baseWidth / 2;

    // Triangle points: base at rope surface, tip extends outward
    const p0 = [spineStart.x - Math.cos(perpAngle) * halfWidth, spineStart.y - Math.sin(perpAngle) * halfWidth];
    const p1 = [spineStart.x + Math.cos(perpAngle) * halfWidth, spineStart.y + Math.sin(perpAngle) * halfWidth];
    const p2 = [spineStart.x + Math.cos(spineAngle) * height, spineStart.y + Math.sin(spineAngle) * height];

    drawTriangle(_ctx, p0, p1, p2, this.spineColor || "white", 1);
  }

  render(_ctx = ctx) {
    var isHighlight = (selSegment && selSegment.rope === this) || (prevHov && prevHov.rope === this);
    var lineWidth = this.thick;
    var lw = lineWidth / 2;
    var transparent = "rgba(0,0,0,0)";
    var circles = [];

    var lineClr = isHighlight ? setAlpha(this.color, 0.8) : this.color;
    for (let i = 0; i < this.segAmount; i++) {
      var seg = this.segments[i];
      if (this.spineOccurence && (i + 1) % this.spineOccurence === 0) this.renderSpine(_ctx, seg, i + 1);

      var curClr = lineClr;
      if (seg.anchorObject) curClr = seg.anchorObject.color;
      else if (this.color2) curClr = addColor(lineClr, this.color2, i / this.segAmount);
      if (this.stripesOccurence && i % this.stripesOccurence === 0) curClr = addColor(curClr, "black", 0.2);

      var isColliding = false;
      var colWidth = Math.max(lineWidth, 8);
      if (!selAirPusher && !selDirPusher && !selShape && pointInRect(mouse.pos, new Vec2(seg.pos.x - colWidth, seg.pos.y - colWidth), new Vec2(colWidth * 2, colWidth * 2))) {
        if (hovSegment) isColliding = magnitude_v2(mouse.pos, seg.pos) < magnitude_v2(mouse.pos, hovSegment.pos);
        else isColliding = true;
      }
      if (isColliding) hovSegment = seg;
      if (i < this.segments.length - 1) {
        var nextSeg = this.segments[i + 1];
        var end = nextSeg.pos;
        if (this.isChain) {
          drawCircle2(_ctx, [seg.pos.x, seg.pos.y], lw, transparent, curClr, 2);
        } else {
          drawLine(_ctx, [seg.pos.x, seg.pos.y], [end.x, end.y], curClr, lineWidth, 0);
          drawCircle2(_ctx, [seg.pos.x, seg.pos.y], lw, curClr, transparent, 0);
        }
      } else {
        if (this.isChain) drawCircle2(_ctx, [seg.pos.x, seg.pos.y], lw, transparent, curClr, 2);
        else drawCircle2(_ctx, [seg.pos.x, seg.pos.y], lw, curClr, transparent, 0);
      }
      if (seg.isAnchor && showAnchors) circles.push([seg.pos, 4, curClr, "black", 1]);
    }
    for (const c of circles) drawCircle2(_ctx, [c[0].x, c[0].y], c[1], c[2], c[3], c[4]);
    if (showDots) for (const seg of this.segments) drawRect(seg.pos.x - 4, seg.pos.y - 4, 8, 8, "rgba(0,0,0,0)", "yellow", _ctx);
  }

  static globalModifier(_newThick = null, _segAmount = null, _segSpace = null) {
    for (const r of ropes) {
      if (_newThick) r.thick = _newThick;
      if (_segAmount) r.setNewSegAmount(_segAmount);
      if (_segSpace) r.segSpace = _segSpace;
    }
    if (_newThick) segThickness = _newThick;
    if (_segAmount) segAmount = _segAmount;
    if (_segSpace) segSpace = _segSpace;
  }

  static remove(rope) {
    if (rope.rope !== undefined) {
      rope = rope.rope;
      for (const s of rope.segments) s.remove();
    }
    ensureElementRemoval(rope);
  }

  static instantiate(start, end, isAnchored = true) {
    var rope = new Rope(new Vec2(start.x, start.y), end ? new Vec2(end.x, end.y) : null);
    ropes.push(rope);
    if (!isAnchored) rope.segments[0].setAnchor(null);
    return rope;
  }
}
