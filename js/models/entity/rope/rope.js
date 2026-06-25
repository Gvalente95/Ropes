class RopeSegment {
  constructor(pos, rope, idx) {
    this.pos = pos;
    this.prevPos = pos;
    this.rope = rope;
    this.idx = idx;
    this.thick = rope.thick;
    this.thickFactor = 1;
    this.grounded = false;
    this.isAnchor = false;
    this.anchorPos = null;
    this.anchorObject = null;
    this.anchorOffset = v2(0, 0);
    this.inScreen = false;
    this.angle = 0;
  }

  setSegThickFactor(factor = this.thickFactor) {
    while (this.rope.thick * factor < 1) factor += 0.05;
    this.thickFactor = factor;
    this.thick = this.rope.thick * factor;
  }

  getAnchorOffset(anchorObject) {
    if (!anchorObject) return null;
    var angle = Math.atan2(this.pos.y - anchorObject.pos.y, this.pos.x - anchorObject.pos.x);
    var dir = v2(Math.cos(angle), Math.sin(angle));
    if (anchorObject.type === "CIRCLE") {
      return scale_v2(dir, anchorObject.size.x);
    } else if (anchorObject.type === "SQUARE") {
      const hw = anchorObject.size.x / 2;
      const hh = anchorObject.size.y / 2;
      if (Math.abs(dir.x) > Math.abs(dir.y)) {
        return v2(dir.x > 0 ? hw : -hw, dir.y * hh);
      } else {
        return v2(dir.x * hw, dir.y > 0 ? hh : -hh);
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

  setAnchor(pos = v2(this.pos), _anchorObject = null) {
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

  pullShape(shape) {
    const neighbors = this.rope.segments;
    const myIndex = neighbors.indexOf(this);
    let totalPull = v2(0, 0);

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
    this.pos = this.anchorPos;
  }

  applyAnchorPullForces() {
    var shape = this.anchorObject;
    if (!shape) return;

    const anchoredPos = add_v2(shape.pos, this.anchorOffset);
    this.anchorPos = rotate_v2(anchoredPos, shape.center, shape.angle);

    this.pos = this.anchorPos;
    // this.pullShape(shape);
  }

  onCollision() {
    this.rope.frameCollisionsAmount++;
    if (this.rope.gravity.y >= 0) this.rope.grounded = true;
  }

  isAtBorder() {
    return this.pos.x < 0 || this.pos.y <= 0 || this.pos.x + this.thick / 2 >= mapSize.x || this.pos.y + this.thick / 2 >= mapSize.y;
  }

  update() {
    if (this.isAnchor || this === selSegment) return;

    if (this.anchorObject) {
      this.applyAnchorPullForces();
      return;
    }

    if (this.idx < this.rope.segments.length - 1) {
      this.angle = getAngle(this.pos, this.rope.segments[this.idx + 1].pos);
    }

    var rope = this.rope;
    var movement = sub_v2(this.pos, this.prevPos);
    var vel = scale_v2(movement, rope.damp * r_range(0.8, 1.2));
    if (this.rope.wave) {
      var angle = this.angle + Math.PI / 2;
      var len = this.rope.segments.length;
      var phaseNorm = (frame / 4 + this.idx) / len;
      var length = Math.sin(phaseNorm * Math.PI * 2) * this.rope.wave;
      var dir = v2(Math.cos(angle + Math.PI / 2) * length, Math.sin(angle) * length);
      vel = add_v2(vel, dir);
    }

    this.prevPos = v2(this.pos.x, this.pos.y);
    var newPos = add_v2(this.pos, vel);
    var grav = rope.gravity || v2(0, 0);
    newPos.x += (grav.x || 0) * dt;
    newPos.y += (grav.y || 0) * dt;
    for (const a of airPushers) newPos = a.getWindForceAtPos(newPos, this.thick / 100);

    const leftBorder = this.thick / 2;
    const rightBorder = mapSize.x - this.thick / 2;
    if (newPos.x <= leftBorder) {
      this.onCollision();
      if (rope.groundFriction) newPos.y = this.pos.y + (newPos.y - this.prevPos.y) * rope.groundFriction;
      newPos.x = leftBorder;
    }
    if (newPos.x >= rightBorder) {
      this.onCollision();
      if (rope.groundFriction) newPos.y = this.pos.y + (newPos.y - this.prevPos.y) * rope.groundFriction;
      newPos.x = rightBorder;
    }
    const floorY = groundLevel - this.thick / 2;
    if (newPos.y >= floorY) {
      this.onCollision();
      if (rope.groundFriction) newPos.x = this.pos.x + (newPos.x - this.prevPos.x) * rope.groundFriction;
      newPos.y = floorY;
    }
    const ceilingY = this.thick / 2;
    if (newPos.y <= ceilingY) {
      this.onCollision();
      if (rope.groundFriction) newPos.x = this.pos.x + (newPos.x - this.prevPos.x) * rope.groundFriction;
      newPos.y = ceilingY;
    }
    this.pos = newPos;
  }

  remove() {
    if (this.anchorObject) {
      var idx = this.anchorObject.attachedSegments.indexOf(this);
      if (idx !== -1) this.anchorObject.attachedSegments.splice(idx, 1);
    }
    if (cam.target === this) cam.target = null;
  }
}

class Rope {
  constructor(start, end = null, color = getRandomColor(), thick = r_range(1, 20), _segAmount = 50, _segSpace = segSpace, _damp = dampingFactor) {
    this.color = color;
    this.color2 = getRandomColor();
    this.thick = thick;
    this.segAmount = _segAmount;
    this.segSpace = _segSpace;
    this.damp = _damp;
    this.breakPoint = 0;
    this.gravity = v2(gravity.x, gravity.y);
    this.groundFriction = ropeGroundFriction;
    this.frameCollisionsAmount = 0;
    this.stiffness = 0;
    this.pointiness = 0;
    this.isSquare = roll(20);
    this.stripesOccurence = 0;
    this.stripesColor = getRandomColor();
    this.collisionsEnabled = true;
    this.isChain = false;
    this.isRainbow = false;
    this.wave = 0;

    this.setSpines(0);
    this.init(start, end);
  }

  init(start, end) {
    if (end && end.x > mapSize.x - this.thick) {
      end.x = start.x - this.segAmount * this.segSpace;
    }
    start.x = clamp(start.x, 0, mapSize.x - this.thick);
    start.y = clamp(start.y, 0, mapSize.y - this.thick);

    this.segments = [];
    var step = 1 / this.segAmount;
    var t = 0;
    var lastPos = end ? end : v2(start.x + this.segSpace * this.segAmount, start.y);
    for (let i = 0; i < this.segAmount; i++) {
      var pos = v2(lerp(start.x, lastPos.x, t), lerp(start.y, lastPos.y, t));
      var newSegment = new RopeSegment(pos, this, i);
      this.segments.push(newSegment);
      t += step;
    }
    if (end && start) {
      this.setAnchor([0, this.segAmount - 1]);
    } else if (start && !end) {
      this.setAnchor([0]);
    }
  }

  setChain(stiffness) {
    this.stiffness = stiffness;
    this.isChain = stiffness > 0;
  }

  setSpines(
    occurence = r_range_int(4, 12),
    color = getRandomColor(),
    angle = r_range(0, 0.3),
    curve = r_range(-Math.PI / 2, Math.PI / 2),
    size = v2(r_range_int(this.thick / 16, this.thick), r_range_int(this.thick / 2, this.thick * 2)),
  ) {
    this.spineOccurence = occurence;
    this.spineOnBothSides = false;
    this.spineColor = color;
    this.spineAngle = angle;
    this.spineCurvature = curve;
    this.spineSize = size;
    this.spineTappering = r_range_int(0, 8) !== 0;
  }

  setPointy(factor = this.pointiness) {
    this.pointiness = factor;
    var isNeg = factor < 0;
    if (isNeg) {
      factor *= -1;
    }
    for (let i = 0; i < this.segments.length; i++) {
      if (factor === 0) this.segments[i].setSegThickFactor(1);
      else {
        var id = isNeg ? this.segments.length - i : i;
        this.segments[i].setSegThickFactor(id / (this.segments.length * (1 - factor)));
      }
    }
  }

  separate(index) {
    var tail = this.segments.slice(index);
    var rope = Rope.instantiate(v2(0, 0));
    rope.segments = [];
    for (let i = 0; i < tail.length; i++) {
      rope.segments.push(tail[i]);
    }
    rope.segAmount = rope.segments.length;
    this.segAmount = index;
    this.segments.splice(index);
  }

  duplicate() {
    var dist = this.thick * 2;
    var start = v2(this.segments[0].pos.x + dist, this.segments[0].pos.y + dist);
    var last = this.segments[this.segments.length - 1];
    var end = last.isAnchor ? null : v2(last.pos.x + 5, last.pos.y + 5);
    var newRope = new Rope(start, end, this.color, this.thick, this.segAmount, this.segSpace, this.damp);

    newRope.color2 = this.color2;
    newRope.breakPoint = this.breakPoint;
    newRope.gravity = v2(this.gravity.x, this.gravity.y);
    newRope.groundFriction = this.groundFriction;
    newRope.stiffness = this.stiffness;
    newRope.setPointy(this.pointiness);
    newRope.stripesOccurence = this.stripesOccurence;
    newRope.stripesColor = this.stripesColor;
    newRope.collisionsEnabled = this.collisionsEnabled;
    newRope.isChain = this.isChain;
    newRope.isRainbow = this.isRainbow;
    newRope.setSpines(this.spineOccurence, this.spineColor, this.spineAngle, this.spineCurvature, this.spineSize);

    if (!last.isAnchor) newRope.segments[newRope.segAmount - 1].setAnchor(null);
    ropes.push(newRope);
    return newRope;
  }
  setAnchor(indices) {
    for (const index of indices) {
      this.segments[index].setAnchor();
    }
  }
  remove() {
    Rope.remove(this);
  }

  setRopeThickness(newThick) {
    this.thick = newThick;
    for (const s of this.segments) {
      s.setSegThickFactor();
    }
  }

  setNewSegAmount(newSegAmount) {
    if (newSegAmount === this.segAmount) return;
    var prevSegAmount = this.segAmount;
    var head = this.segments[0];
    var headIsAnchor = head.isAnchor;
    var startP = head.pos;

    var tail = this.segments[this.segments.length - 1];
    var endP = v2(tail.pos.x, tail.pos.y);
    var tailIsAnchor = tail.isAnchor;

    this.segAmount = newSegAmount;
    this.init(startP, endP);
    for (let i = prevSegAmount; i < this.segments.length; i++) this.segments[i].pos = this.segments[0].pos;

    if (headIsAnchor) this.segments[0].setAnchor();
    if (tailIsAnchor) this.segments[this.segments.length - 1].setAnchor();
    else this.segments[this.segments.length - 1].setAnchor(null);

    this.setPointy();
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

  isAtBorder() {
    for (const s of this.segments) if (s.isAtBorder()) return true;
    return false;
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
        // if (shape.rotationEnabled && seg.idx < this.segments.length - 1) {
        //   var next = this.segments[seg.idx + 1];
        //   var segAngle = Math.atan2(seg.pos.x - next.pos.x, seg.pos.y - next.pos.y);
        //   var segSize = v2(seg.pos.x - next.pos.x, seg.pos.y - next.pos.y);
        //   var hasCol = rectInRect(seg.pos, segSize, segAngle, shape.pos, shape.size, shape.angle);
        //   if (hasCol) {
        //     seg.vel = v2(seg.pos.x - seg.prevPos.x, seg.pos.y - seg.prevPos.y);
        //     if (shape.movable) shape.vel = add_v2(shape.vel, scale_v2(seg.vel, 2));
        //     seg.pos.x -= Math.sign(seg.vel.x) * 1.1;
        //     seg.pos.y -= Math.sign(seg.vel.y) * 1.1;
        //     seg.vel.x *= -0.9;
        //     seg.vel.y *= -0.9;
        //   }
        //   return;
        // }

        const closestX = Math.max(shape.pos.x, Math.min(seg.pos.x, shape.pos.x + shape.size.x));
        const closestY = Math.max(shape.pos.y, Math.min(seg.pos.y, shape.pos.y + shape.size.y));

        const dx = seg.pos.x - closestX;
        const dy = seg.pos.y - closestY;
        const distSq = dx * dx + dy * dy;
        const radiusSq = (seg.thick / 2) * (seg.thick / 2);

        if (distSq >= radiusSq) return false;

        this.frameCollisionsAmount++;
        const dist = Math.sqrt(distSq) || 0.0001;
        const overlap = seg.thick / 2 - dist;

        const nx = dx / dist;
        const ny = dy / dist;

        seg.pos.x = closestX + nx * (seg.thick / 2);
        seg.pos.y = closestY + ny * (seg.thick / 2);

        if (seg.prevPos) {
          const segVelX = seg.pos.x - seg.prevPos.x;
          const segVelY = seg.pos.y - seg.prevPos.y;

          // Tangential component (perpendicular to normal)
          const tx = -ny; // tangent direction
          const ty = nx;
          const segVt = segVelX * tx + segVelY * ty;

          // Apply friction (high damping on tangential velocity)
          const frictionFactor = 0.05;
          seg.prevPos.x = seg.pos.x - (segVelX - segVt * tx * frictionFactor) * frictionFactor;
          seg.prevPos.y = seg.pos.y - (segVelY - segVt * ty * frictionFactor) * frictionFactor;
        }
        // if (seg.thick <= 2 && shape.size.x > 5) return;

        if (shape !== selShape && shape.movable) {
          const estimatedMass = shape.mass;
          const hardness = clamp(seg.thick / (seg.thick + 1 * estimatedMass), 0.05, 1);
          const pushShape = clamp(overlap * 0.5 * hardness, 0, 5);

          shape.pos.x -= nx * pushShape;
          shape.pos.y -= ny * pushShape;

          const segVelX = seg.prevPos ? seg.pos.x - seg.prevPos.x : 0;
          const segVelY = seg.prevPos ? seg.pos.y - seg.prevPos.y : 0;
          const segVn = segVelX * nx + segVelY * ny;
          const segMass = seg.thick;
          const momentumTransfer = segMass / (segMass + estimatedMass * 0.01);

          const vn = shape.vel.x * nx + shape.vel.y * ny; // normal component
          const restitution = 0.3 + 0.6 * hardness; // match circle bounces

          shape.vel.x -= (1 + restitution) * vn * nx;
          shape.vel.y -= (1 + restitution) * vn * ny;

          shape.vel.x += segVn * nx * momentumTransfer * hardness;
          shape.vel.y += segVn * ny * momentumTransfer * hardness;

          const bounceBoost = overlap * 0.1 * hardness;
          shape.vel.x += nx * bounceBoost;
          shape.vel.y += ny * bounceBoost;
        }
        break;
      }
      case "CIRCLE": {
        var discCenter = v2(shape.pos.x, shape.pos.y);
        var discRad = shape.size.x + seg.thick / 2;
        var dx = seg.pos.x - discCenter.x;
        var dy = seg.pos.y - discCenter.y;
        var distSq = dx * dx + dy * dy;
        var radSq = discRad * discRad;
        if (distSq >= radSq) return false;

        this.frameCollisionsAmount++;
        var dist = Math.sqrt(distSq) || 0.0001;
        var pushDist = discRad;
        seg.pos.x = discCenter.x + (dx / dist) * pushDist;
        seg.pos.y = discCenter.y + (dy / dist) * pushDist;
        if (shape !== selShape && shape.movable) {
          if (seg.thick <= 2 && shape.size.x > 5) return;
          const nx = dx / dist;
          const ny = dy / dist;
          const overlap = discRad - dist;
          const hardness = clamp(seg.thick / (seg.thick + 1 * shape.mass), 0.05, 1);
          const pushShape = clamp(overlap * 0.5 * hardness, 0, 5);
          var curP = v2(shape.pos.x - nx * pushShape, shape.pos.y);
          if (shape.pos.y + shape.size.y < groundLevel - 10) curP.y -= ny * pushShape;
          var diff = sub_v2(shape.pos, curP);
          shape.vel = add_v2(shape.vel, scale_v2(diff, -10));
          shape.pos = curP;
          shape.vel.x *= 0.9999;
          shape.vel.y *= 0.9999;
        }
        break;
      }
    }
    return true;
  }

  handleSegCollision(a, b, minDist = a.thick * 0.75) {
    let dx = a.pos.x - b.pos.x;
    let dy = a.pos.y - b.pos.y;
    let dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < minDist && dist > 0.01) {
      if (b.rope !== a.rope) {
        a.rope.frameCollisionsAmount++;
        if (b.rope.grounded) this.grounded = true;
      }
      let overlap = minDist - dist;
      let nx = dx / dist;
      let ny = dy / dist;
      let factor = a.rope === b.rope ? 0.3 : overlapFactor;
      let correction = overlap * 0.5 * factor;
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
        if (!s.collisionsEnabled) continue;
        if (this.handleShapeCollision(a, s, i) && input.keys["shift"] && s === selShape && !s.attachedSegments.length) {
          a.attachToShape(s);
        }
      }
      if (n % SelfCollisionsInterval === 0) {
        var closeSegments = colGrid.getAtPos(a.pos.x, a.pos.y);
        for (const b of closeSegments) {
          if (b.rope === undefined || b.isAnchor || !b.rope.collisionsEnabled) continue;
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

      if (i > 6 && i < this.segAmount - 6 && this.breakPoint > 0 && this.getSegmentOverstretchAmount(seg, seg.pos.x, seg.pos.y) > this.segSpace * this.breakPoint) {
        this.separate(i);
        break;
      }

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

  randomizeThickness(factor = 0.3) {
    for (const s of this.segments) {
      var end = clamp(s.thickFactor + r_range(-factor, factor), 0, 1);
      s.setSegThickFactor(end);
    }
  }

  update() {
    if (!this.inScreen && !this.type === "SNAKE") return;
    this.frameCollisionsAmount = 0;
    var checkCollisions = this.collisionsEnabled && colGrid.active;
    this.grounded = false;
    if (!paused) for (var i = 0; i < this.segments.length; i++) this.segments[i].update();
    for (let n = 0; n < numOfConstraintsRuns; n++) {
      this.applyConstraits();
      if (checkCollisions && n % collisionSegmentInteval === 0) this.handleCollisions(n);
    }
    if (this.stiffness) this.rigidifySegments();
  }

  renderSpine(_ctx, seg, i, isInv = false) {
    const normal = this.getSegmentNormal(seg);
    let spineAngle = Math.atan2(normal.y, normal.x);

    var lim = Math.PI / 4;
    if (!this.spineOnBothSides && Math.abs(normal.y) > lim && spineAngle > lim && spineAngle < Math.PI - lim) {
      spineAngle += Math.PI;
    }

    const angleOffset = this.spineAngle;
    if (isInv) spineAngle += Math.PI - angleOffset;
    else spineAngle += angleOffset;

    const offset = seg.thick / 2;
    const spineStart = v2(seg.pos.x + Math.cos(spineAngle) * offset, seg.pos.y + Math.sin(spineAngle) * offset);
    const baseWidth = this.spineSize.x;
    var height = this.spineSize.y;
    if (this.spineTappering) {
      const spineIndex = Math.min(Math.floor(i / this.spineOccurence), this.spineOccurence - 1);
      height = (this.spineSize.y / this.spineOccurence) * (this.spineOccurence - spineIndex);
    }
    const perpAngle = spineAngle + Math.PI / 2;
    const halfWidth = baseWidth / 2;

    // Triangle points: base at rope surface, tip extends outward
    const p0 = toScrn(spineStart.x - Math.cos(perpAngle) * halfWidth, spineStart.y - Math.sin(perpAngle) * halfWidth);
    const p1 = toScrn(spineStart.x + Math.cos(perpAngle) * halfWidth, spineStart.y + Math.sin(perpAngle) * halfWidth);
    const p2 = toScrn(spineStart.x + Math.cos(spineAngle) * height, spineStart.y + Math.sin(spineAngle) * height);

    drawTriangle(_ctx, p0, p1, p2, this.spineColor || "white", 1);
    if (!isInv && this.spineOnBothSides) this.renderSpine(_ctx, seg, i, true);
  }

  drawSnakeSegment(ctx, x, y, r, color, borderColor, slw, angle = 0) {
    drawCircle2(ctx, x, y, r, color, borderColor, slw);

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI);
    ctx.fillStyle = darkenColor(color, 0.75);
    ctx.fill();

    ctx.restore();
  }

  render(_ctx = ctx) {
    if (frame % 2 === 0) {
      this.inScreen = false;
      for (const s of this.segments) {
        s.inScreen = circleInRect(s.pos, s.thick * 2, cam.scroll, winSize);
        if (s.inScreen) this.inScreen = true;
      }
      if (!this.inScreen) return;
    }
    var transparent = "rgba(0,0,0,0)";
    var isHighlight = false;

    if (input.keys["shift"]) {
      isHighlight = (selSegment && selSegment.rope === this) || (hovSegment && hovSegment.rope === this);
      if (isHighlight) transparent = "rgba(255, 255, 255, 1)";
    }
    var circles = [];
    var shadows = [];
    var slw = 2;

    var lineClr = this.color;
    for (let i = 0; i < this.segAmount; i++) {
      var seg = this.segments[i];
      if (!seg.inScreen) continue;
      var lineWidth = seg.thick;
      var p = toScrn(seg.pos.x, seg.pos.y);
      var lw = Math.max(lineWidth / 2 - 1, 0.1);

      if (this.spineOccurence && (i + 1) % this.spineOccurence === 0) this.renderSpine(_ctx, seg, i + 1);

      var borderColor = transparent;
      if (isHighlight && seg.isAnchor) borderColor = "red";
      var curClr = this.isRainbow ? getRainbowColor(frame + i, 0.1) : lineClr;
      if (seg.anchorObject) curClr = seg.anchorObject.color;
      else if (this.color2 && !this.isRainbow && getAlpha(this.color2) > 0) {
        curClr = addColor(this.color, this.color2, i / this.segAmount);
      }
      const isStripped = this.stripesOccurence && i % this.stripesOccurence === 0;
      if (isStripped) curClr = this.stripesColor;
      if (i < this.segments.length - 1) {
        var nextSeg = this.segments[i + 1];
        var end = toScrn(nextSeg.pos.x, nextSeg.pos.y);
        drawLine(_ctx, p, end, curClr, lineWidth);
        if (!this.isSquare) this.drawSnakeSegment(_ctx, p.x, p.y, lw, curClr, borderColor, slw, seg.angle);
      } else {
        if (this.isChain) drawCircle2(_ctx, p.x, p.y, lw, borderColor, curClr, slw);
        else drawCircle2(_ctx, p.x, p.y, lw, curClr, borderColor, slw);
      }
      if ((seg.isAnchor && showAnchors) || seg == selSegment) circles.push([toScrn(seg.pos.x, seg.pos.y), 4, curClr, "black", 1]);
    }

    if (!this.isSquare) for (const c of circles) drawCircle2(_ctx, c[0].x, c[0].y, c[1], c[2], c[3], c[4]);
    for (const s of shadows) drawLine(_ctx, s[0], s[1], s[2], s[3]);

    if (showDots) for (const seg of this.segments) drawRect(sx(seg.pos.x - 4), sy(seg.pos.y - 4), 8, 8, "rgba(0,0,0,0)", "yellow", _ctx);
    if (showArrows || isHighlight)
      for (let i = 0; i < this.segments.length - 2; i++) {
        var seg = this.segments[i];
        drawArrowFromAngle(v2ToScrn(seg.pos), seg.angle, this.segSpace, "white", _ctx);
      }
    if (showColAmount) drawText(ctx, this.segments[0].pos.x, this.segments[0].pos.y - this.thick * 3, `frameCol:${this.frameCollisionsAmount} grounded:${this.grounded}`);
    _ctx.lineWidth = 2;
  }

  static globalModifier(_newThick = null, _segAmount = null, _segSpace = null) {
    for (const r of ropes) {
      if (_newThick) r.setRopeThickness(_newThick);
      if (_segAmount) r.setNewSegAmount(_segAmount);
      if (_segSpace) r.segSpace = _segSpace;
    }
    for (const r of entities) {
      if (r.type !== "SNAKE") continue;
      if (_newThick) r.setRopeThickness(_newThick);
      if (_segAmount) r.setNewSegAmount(_segAmount);
      if (_segSpace) r.segSpace = _segSpace;
    }
    if (_newThick) segThickness = _newThick;
    if (_segAmount) segAmount = _segAmount;
    if (_segSpace) segSpace = _segSpace;
  }

  static remove(rope) {
    if (rope.rope !== undefined) rope = rope.rope;
    for (const s of rope.segments) s.remove();
    ensureElementRemoval(rope);
  }

  static instantiate(start, end, isAnchored = true) {
    var rope = new Rope(v2(start.x, start.y), end ? v2(end.x, end.y) : null);
    ropes.push(rope);
    if (!isAnchored) rope.segments[0].setAnchor(null);
    return rope;
  }
}
