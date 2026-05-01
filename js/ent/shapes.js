class Shape {
  constructor(pos, size, type = "SQUARE", color = getRandomColor(), angle = 0, _gravity = gravity) {
    this.pos = pos;
    this.newPos = pos;
    this.size = size;
    this.type = type;
    this.color = color;
    this.fillColor = color;
    this.borderColor = setAlpha(color, 0);
    this.angle = angle;
    this.angVel = 0;
    this.gravity = _gravity;
    this.bounceFactor = 0.8;
    this.dragFactor = 0.99;
    this.vel = v2(0, 0);
    this.attachedSegments = [];
    this.frameCollisionsAmount = 0;
    this.collisionsEnabled = true;
    this.rotationEnabled = true;
    this.movable = true;
    this.static = false;
    this.center = v2(0, 0);
    this.jumpForce = 1000;
    this.updateMass();
    this.inScreen = false;
  }

  remove() {
    Shape.remove(this);
  }

  place(pos) {
    this.pos = pos;
  }

  rotate(deltaAngle) {
    if (!this.rotationEnabled) return;
    this.angVel = deltaAngle;
    this.angle += deltaAngle;
    while (this.angle <= -Math.PI) this.angle += Math.PI * 2;
    while (this.angle > Math.PI) this.angle -= Math.PI * 2;
  }

  resize(newSize) {
    this.size = v2(Math.max(10, newSize.x), Math.max(newSize.y, 10));
    this.updateMass();
  }

  resolveCircleCollision(dotB) {
    let newP = this.newPos;
    let dotA = this;
    let radA = dotA.size.x;
    let radB = dotB.size.x;
    var massA = dotA.mass;
    var massB = dotB.mass;
    var posA = dotA.pos;
    var posB = dotB.pos;
    let dx = newP.x - posB.x;
    let dy = newP.y - posB.y;
    let distSq = dx * dx + dy * dy;
    let minDist = radA + radB + 0.1;
    if (distSq >= minDist * minDist) return false;
    let xDist = posB.x - posA.x;
    let yDist = posB.y - posA.y;
    let dist = Math.sqrt(xDist * xDist + yDist * yDist);

    const overlap = minDist - dist;
    const totalMass = massA + massB;
    let pushA = (massB / totalMass) * overlap;
    let pushB = (massA / totalMass) * overlap;
    newP.x -= xDist * (pushA / dist);
    newP.y -= yDist * (pushA / dist);
    if (dotB.movable) {
      dotB.pos.x += xDist * (pushB / dist);
      dotB.pos.y += yDist * (pushB / dist);
    }

    const xVelocityDiff = dotA.vel.x - dotB.vel.x;
    const yVelocityDiff = dotA.vel.y - dotB.vel.y;
    if (xVelocityDiff * xDist + yVelocityDiff * yDist >= 0) {
      const angle = -Math.atan2(yDist, xDist);
      const u1 = rotate({ x: dotA.vel.x, y: dotA.vel.y }, angle);
      const u2 = rotate({ x: dotB.vel.x, y: dotB.vel.y }, angle);
      const m1 = massA;
      const m2 = massB;
      const v1 = { x: (u1.x * (m1 - m2) + 2 * m2 * u2.x) / (m1 + m2), y: u1.y };
      const v2 = { x: (u2.x * (m2 - m1) + 2 * m1 * u1.x) / (m1 + m2), y: u2.y };
      const vFinal1 = rotate(v1, -angle);
      const vFinal2 = rotate(v2, -angle);
      dotA.vel.x = vFinal1.x;
      dotA.vel.y = vFinal1.y;
      dotB.vel.x = vFinal2.x;
      dotB.vel.y = vFinal2.y;
    }
    this.newPos = newP;
    return true;
  }

  resolveBoxCollision(boxB) {
    if (rectInRect(this.newPos, this.size, this.angle, boxB.pos, boxB.size, boxB.angle)) {
      var bounceXFactor = 0.5;
      boxB.vel = add_v2(boxB.vel, scale_v2(this.vel, 2));

      this.vel.x *= -bounceXFactor;
      this.vel.y *= -this.bounceFactor;
      var push = v2(Math.sign(this.vel.x) * 0.1, Math.sign(this.vel.y) * 0.1);
      this.newPos = add_v2(this.pos, push);
    }
    return;
    let newP = this.newPos;
    let boxA = this;
    const aRight = newP.x + boxA.size.x;
    const aBottom = newP.y + boxA.size.y;
    const bRight = boxB.pos.x + boxB.size.x;
    const bBottom = boxB.pos.y + boxB.size.y;
    if (newP.x >= bRight || aRight <= boxB.pos.x || newP.y >= bBottom || aBottom <= boxB.pos.y) {
      return false;
    }
    const overlapLeft = aRight - boxB.pos.x;
    const overlapRight = bRight - newP.x;
    const overlapTop = aBottom - boxB.pos.y;
    const overlapBottom = bBottom - newP.y;
    // Find minimum penetration axis
    const minOverlapX = Math.min(overlapLeft, overlapRight);
    const minOverlapY = Math.min(overlapTop, overlapBottom);
    // Mass-based separation
    const massA = boxA.size.x * boxA.size.y;
    const massB = boxB.size.x * boxB.size.y;
    const totalMass = massA + massB;
    const pushRatioA = massB / totalMass;
    const pushRatioB = massA / totalMass;

    // Separate along axis of minimum penetration
    if (minOverlapX < minOverlapY) {
      // Horizontal collision
      if (overlapLeft < overlapRight) {
        // Hit from left
        newP.x -= minOverlapX * pushRatioA;
        if (!boxB.isAtBorder(boxB.pos, "right")) boxB.pos.x += minOverlapX * pushRatioB;
      } else {
        // Hit from right
        newP.x += minOverlapX * pushRatioA;
        if (!boxB.isAtBorder(boxB.pos, "left")) boxB.pos.x -= minOverlapX * pushRatioB;
      }

      // Apply elastic collision on X axis
      const relVelX = boxA.vel.x - boxB.vel.x;
      if ((overlapLeft < overlapRight && relVelX > 0) || (overlapLeft >= overlapRight && relVelX < 0)) {
        const m1 = massA;
        const m2 = massB;
        const v1 = boxA.vel.x;
        const v2 = boxB.vel.x;
        boxA.vel.x = ((m1 - m2) * v1 + 2 * m2 * v2) / (m1 + m2);
        boxB.vel.x = ((m2 - m1) * v2 + 2 * m1 * v1) / (m1 + m2);
      }
    } else {
      // Vertical collision
      if (overlapTop < overlapBottom) {
        // Hit from top
        newP.y -= minOverlapY * pushRatioA;
        if (!boxB.isAtBorder(boxB.pos, "down")) boxB.pos.y += minOverlapY * pushRatioB;
        boxA.vel.x *= this.dragFactor;
      } else {
        // Hit from bottom
        newP.y += minOverlapY * pushRatioA;
        if (!boxB.isAtBorder(boxB.pos, "up")) boxB.pos.y -= minOverlapY * pushRatioB;
      }
      const relVelY = boxA.vel.y - boxB.vel.y;
      if ((overlapTop < overlapBottom && relVelY > 0) || (overlapTop >= overlapBottom && relVelY < 0)) {
        const m1 = massA;
        const m2 = massB;
        const v1 = boxA.vel.y;
        const v2 = boxB.vel.y;
        boxA.vel.y = ((m1 - m2) * v1 + 2 * m2 * v2) / (m1 + m2);
        boxB.vel.y = ((m2 - m1) * v2 + 2 * m1 * v1) / (m1 + m2);
      }
    }
    this.newPos = newP;
    return true;
  }

  resolveCircleBoxCollision(b) {
    let newP = this.newPos;
    var a = this;
    var circle = a.type === "CIRCLE" ? a : b.type === "CIRCLE" ? b : null;
    var box = a.type === "SQUARE" ? a : b.type === "SQUARE" ? b : null;
    if (!circle || !box) return false;

    // For rope segments (circles with small mass), use AABB collision with box
    // Get box corners with rotation
    const boxCorners = [rotate_v2(v2(box.pos.x, box.pos.y), box.center, box.angle), rotate_v2(v2(box.pos.x + box.size.x, box.pos.y), box.center, box.angle), rotate_v2(v2(box.pos.x, box.pos.y + box.size.y), box.center, box.angle), rotate_v2(v2(box.pos.x + box.size.x, box.pos.y + box.size.y), box.center, box.angle)];

    // Find AABB bounds of rotated box
    const boxLeft = Math.min(...boxCorners.map((c) => c.x));
    const boxRight = Math.max(...boxCorners.map((c) => c.x));
    const boxTop = Math.min(...boxCorners.map((c) => c.y));
    const boxBottom = Math.max(...boxCorners.map((c) => c.y));

    // Find closest point on rotated box to circle
    const closestX = Math.max(boxLeft, Math.min(circle.pos.x, boxRight));
    const closestY = Math.max(boxTop, Math.min(circle.pos.y, boxBottom));

    // Calculate separation vector
    const dx = circle.pos.x - closestX;
    const dy = circle.pos.y - closestY;
    const distSq = dx * dx + dy * dy;
    const radius = circle.size.x;
    const radSq = radius * radius;

    // No collision if outside sphere
    if (distSq >= radSq) return false;

    const dist = Math.sqrt(distSq) || 0.0001;
    const overlap = radius - dist;

    // Normalize separation vector
    const nx = dist > 0 ? dx / dist : 0;
    const ny = dist > 0 ? dy / dist : 0;

    const totalMass = circle.mass + box.mass;
    const pushRatioCircle = box.mass / totalMass;
    const pushRatioBox = circle.mass / totalMass;

    // Push bodies apart
    if (circle === a) {
      // Ball is self (a), box is b
      newP.x += nx * overlap * pushRatioCircle;
      newP.y += ny * overlap * pushRatioCircle;
      if (box.movable) {
        box.pos.x -= nx * overlap * pushRatioBox;
        box.pos.y -= ny * overlap * pushRatioBox;
      }
    } else {
      // Box is self (a), circle is b
      if (circle.movable) {
        circle.pos.x += nx * overlap * pushRatioCircle;
        circle.pos.y += ny * overlap * pushRatioCircle;
      }
      newP.x -= nx * overlap * pushRatioBox;
      newP.y -= ny * overlap * pushRatioBox;
    }

    // Apply elastic collision response
    const relVelX = circle.vel.x - box.vel.x;
    const relVelY = circle.vel.y - box.vel.y;
    const velAlongNormal = relVelX * nx + relVelY * ny;

    if (velAlongNormal < 0) {
      // Moving towards each other
      const m1 = circle.mass;
      const m2 = box.mass;
      const restitution = 0.6;
      const impulse = (-(1 + restitution) * velAlongNormal) / (m1 + m2);

      circle.vel.x += impulse * m2 * nx;
      circle.vel.y += impulse * m2 * ny;
      box.vel.x -= impulse * m1 * nx;
      box.vel.y -= impulse * m1 * ny;
    }

    this.newPos = newP;
    return true;
  }

  handleCollisions() {
    var cs = colGrid.getAtPos(this.center.x, this.center.y, 1);
    for (const s of cs) {
      if (s === this) continue;
      if (!s.collisionsEnabled) continue;
      var collided;
      if (s.rope) continue;
      if (this.type === "CIRCLE" && s.type === "CIRCLE") collided = this.resolveCircleCollision(s);
      else if (this.type === "SQUARE" && s.type === "SQUARE") collided = this.resolveBoxCollision(s);
      else collided = this.resolveCircleBoxCollision(s);
      this.frameCollisionsAmount += collided;
    }
  }

  updateBorderCollisions() {
    var pos = this.newPos;
    var size = this.size;
    const bounceMult = Math.max(0.3, this.bounceFactor * (1 - this.mass / 10000));

    if (this.type === "CIRCLE") {
      var minX = this.size.x;
      var maxX = mapSize.x - this.size.x;

      var minY = this.size.x;
      var maxY = groundLevel - this.size.x;

      if (pos.x < minX) {
        if (this.vel.x < 0) this.vel.x *= -bounceMult;
        pos.x = minX + 1;
        this.frameCollisionsAmount++;
      } else if (pos.x > maxX) {
        if (this.vel.x > 0) this.vel.x *= -bounceMult;
        pos.x = maxX;
        this.frameCollisionsAmount++;
        this.vel.x *= this.dragFactor;
      }
      if (pos.y < minY) {
        if (this.vel.y < 0) this.vel.y *= -bounceMult;
        pos.y = minY + 1;
        this.frameCollisionsAmount++;
      } else if (pos.y > maxY) {
        if (this.vel.y > 0) this.vel.y *= -bounceMult;
        pos.y = maxY;
        this.frameCollisionsAmount++;
        this.vel.x *= this.dragFactor;
      }
    } else if (this.type === "SQUARE") {
      const corners = [v2(pos.x, pos.y), v2(pos.x + size.x, pos.y), v2(pos.x, pos.y + size.y), v2(pos.x + size.x, pos.y + size.y)];
      const rotatedCorners = corners.map((c) => rotate_v2(c, this.center, this.angle));
      const maxX = Math.max(...rotatedCorners.map((c) => c.x));
      const minX = Math.min(...rotatedCorners.map((c) => c.x));
      const maxY = Math.max(...rotatedCorners.map((c) => c.y));
      const minY = Math.min(...rotatedCorners.map((c) => c.y));

      var borderMinX = 0;
      var borderMaxX = mapSize.x - this.size.x;

      var borderMinY = 0;
      var borderMaxY = groundLevel;

      if (minX < borderMinX) {
        pos.x += Math.abs(minX);
      } else if (maxX > borderMaxX) {
        pos.x -= maxX - borderMaxX;
      }
      if (minY < borderMinY) {
        pos.y += Math.abs(minY);
      } else if (maxY > borderMaxY) {
        pos.y -= maxY - borderMaxY;
      }

      const finalCenter = v2(pos.x + size.x / 2, pos.y + size.y / 2);
      const finalCorners = corners.map((c) => rotate_v2(c, finalCenter, this.angle));
      const finalMaxX = Math.max(...finalCorners.map((c) => c.x));
      const finalMinX = Math.min(...finalCorners.map((c) => c.x));
      const finalMaxY = Math.max(...finalCorners.map((c) => c.y));
      const finalMinY = Math.min(...finalCorners.map((c) => c.y));

      const touchingLeft = finalMinX < borderMinY;
      const touchingRight = finalMaxX > borderMaxX;
      const touchingTop = finalMinY < borderMinY;
      const touchingBottom = finalMaxY > borderMaxY;

      if ((touchingLeft && this.vel.x < 0) || (touchingRight && this.vel.x > 0)) {
        if (Math.sign(this.vel.x) < 0.1) this.grounded = true;
        this.vel.x *= -bounceMult;
        this.frameCollisionsAmount++;
        this.vel = scale_v2(this.vel, this.dragFactor);
      }
      if ((touchingTop && this.vel.y < 0) || (touchingBottom && this.vel.y > 0)) {
        if (Math.sign(this.vel.y) <= 0.1) {
          this.grounded = true;
          this.vel.y = 0;
          this.frameCollisionsAmount++;
        } else this.vel.y *= -bounceMult;
        this.vel = scale_v2(this.vel, this.dragFactor);
      }
    }
  }

  isAtBorder(pos, direction = null) {
    if (this.type === "CIRCLE") {
      const minX = this.size.x;
      const maxX = mapSize.x - this.size.x;
      const minY = this.size.x;
      const maxY = mapSize.y - this.size.x;
      if (direction === "left") return pos.x <= minX;
      if (direction === "right") return pos.x >= maxX;
      if (direction === "up") return pos.y <= minY;
      if (direction === "down") return pos.y >= maxY;
      return pos.x <= minX || pos.x >= maxX || pos.y <= minY || pos.y >= maxY;
    }
    if (this.type === "SQUARE") {
      const corners = [v2(pos.x, pos.y), v2(pos.x + this.size.x, pos.y), v2(pos.x, pos.y + this.size.y), v2(pos.x + this.size.x, pos.y + this.size.y)];
      const rotatedCorners = corners.map((c) => rotate_v2(c, this.center, this.angle));
      const maxX = Math.max(...rotatedCorners.map((c) => c.x));
      const minX = Math.min(...rotatedCorners.map((c) => c.x));
      const maxY = Math.max(...rotatedCorners.map((c) => c.y));
      const minY = Math.min(...rotatedCorners.map((c) => c.y));
      return minX < 0 || maxX > mapSize.x || minY < 0 || maxY > mapSize.y;
    }
  }

  control() {
    if (!player) {
      player = this;
      this.rotationEnabled = true;
      cam.setTarget(this);
    } else if (player === this) player = null;
    else this.control2();
  }
  control2() {
    if (!player2) {
      this.rotationEnabled = true;
      player2 = this;
    } else if (player2 === this) player2 = null;
  }

  updateMass() {
    this.mass = this.type === "CIRCLE" ? this.size.x * this.size.x : this.size.x * this.size.y;
  }

  updateVelocity() {
    if (this.static) {
      this.vel.x = this.vel.y = 0;
      return;
    }

    if (!this.grounded) {
      this.vel.x += this.gravity.x * dt * 10;
      this.vel.y += this.gravity.y * dt * 10;
    }

    for (const a of airPushers) {
      var oldPos = v2(this.pos.x, this.pos.y);
      var pushedPos = a.getWindForceAtPos(oldPos, this.mass / 100);
      var windPush = sub_v2(pushedPos, oldPos);
      this.vel.x += windPush.x / dt;
      this.vel.y += windPush.y / dt;
    }
    this.newPos = add_v2(this.newPos, scale_v2(this.vel, dt));
  }

  updateAngle() {
    if (!this.rotationEnabled) return;
    if (this.type === "CIRCLE") {
      this.rotate((this.vel.x * dt) / this.size.x);
    } else {
      var atBorder = this.isAtBorder(this.newPos);
      if (atBorder) {
        var stableAngles = [0, Math.PI / 2, Math.PI, -Math.PI / 2, -Math.PI];
        var closest = 100;
        for (let i = 0; i < stableAngles.length; i++) {
          let stableAngle = stableAngles[i];
          var diff = Math.abs(this.angle - stableAngle);
          if (diff <= 0.05) {
            var newAngle = stableAngle;
            // if (Math.sign(newAngle) != this.angle) newAngle *= -1;
            this.angle = newAngle;
            return;
          }
          if (diff < closest) closest = diff;
        }
        this.rotate(this.angVel + this.angVel > 0 ? 0.05 : -0.05);
      } else {
        // var curDelta = (this.vel.x * dt) / this.size.x;
        // var newDelta = Math.abs(curDelta) > Math.abs(this.angVel) ? 1 : -1;
        this.rotate((this.vel.x * dt) / this.size.x);
      }
    }
  }

  updateCenter() {
    if (this.type === "CIRCLE") {
      this.center.x = this.pos.x;
      this.center.y = this.pos.y;
    } else if (this.type === "SQUARE") {
      this.center.x = this.pos.x + this.size.x / 2;
      this.center.y = this.pos.y + this.size.y / 2;
    }
  }

  update() {
    var isPlr = player === this || player2 === this;
    if (isPlr) {
      var inp = player === this ? input.wasd : input.arrows;
      this.vel.x += inp.x * 20;
      if (Math.abs(this.gravity.y) < 1) this.vel.y += inp.y * 20;
    }
    this.frameCollisionsAmount = 0;
    this.grounded = false;
    this.newPos = v2(this.pos.x, this.pos.y);
    if (selShape !== this && !paused) {
      this.updateVelocity();
      this.updateAngle();
    }
    this.updateBorderCollisions();
    if (this.collisionsEnabled) this.handleCollisions();

    if (isPlr && input.keyClicked === " " && (this.grounded || this.frameCollisionsAmount)) this.vel.y -= this.jumpForce;

    if (!this.static || this === selShape) this.pos = this.newPos;
    this.updateCenter();
    this.inScreen = CircleInScreen(this);
  }

  render(_ctx = ctx) {
    if (this.frameCollisionsAmount && showColAmount) drawText(ctx, p.x, p.y - 200, this.frameCollisionsAmount);
  }

  static resize(g_size) {
    for (var s of shapes) s.resize(g_size);
    shapeSize = v2(g_size.x, g_size.y);
  }
  static removeAll() {
    for (const s of shapes) s.remove();
  }
  static remove(shape) {
    var idx = shapes.indexOf(shape);
    if (idx === -1) return;
    if (shapes[idx].attach) {
      shapes[idx].attach.attachToShape(null);
      shapes[idx].isAnchor = false;
    }
    if (selShape === shape) selShape = null;
    shapes.splice(idx, 1);
  }
  static setGlobalGravity(newGravity) {
    for (const s of shapes) s.gravity = newGravity;
  }
  static instantiate(constructor = Ball, pos = mouse.world, size = v2(r_range(20, 80), r_range(20, 80))) {
    var shape = new constructor(v2(pos.x, pos.y), v2(size.x, size.y), type);
    shapes.push(shape);
    return shape;
  }
}

class Ball extends Shape {
  constructor(pos, size, color = getRandomColor()) {
    super(pos, size, "CIRCLE", color);
    this.bounceFactor = 0.8;
    this.dragFactor = 0.99;
  }

  duplicate() {
    var ball = new Ball(v2(this.pos.x + 5, this.pos.y + 5), v2(this.size.x, this.size.y), this.color);
    ball.movable = this.movable;
    ball.static = this.static;
    ball.angle = this.angle;
    ball.gravity = v2(this.gravity.x, this.gravity.y);
    ball.rotationEnabled = this.rotationEnabled;
    ball.angVel = this.angVel;
    ball.bounceFactor = this.bounceFactor;
    ball.dragFactor = this.dragFactor;
    shapes.push(ball);
  }

  updateHover() {
    if (pointInCircle(mouse.pos, v2(this.pos.x, this.pos.y), this.size.x)) hovShape = this;
  }

  render(_ctx = ctx) {
    var isSel = contextMenu.shape === this || hovShape === this || selShape === this;
    var curClr = isSel ? this.fillColor : addColor(this.fillColor, "black", 0.3);
    var p = toScrn(this.pos.x, this.pos.y);
    drawCircle2(_ctx, p.x, p.y, this.size.x, curClr, this.borderColor, 2);
    var color = addColor(curClr, "black", 0.4);
    for (let i = 0; i < 2; i++) {
      const angle = this.angle + (i * Math.PI) / 2;
      const dir = v2(Math.cos(angle), Math.sin(angle));
      const start = add_v2(p, scale_v2(dir, this.size.x));
      const end = add_v2(p, scale_v2(dir, -this.size.x));
      drawLine(_ctx, [start.x, start.y], [end.x, end.y], color, 4);
    }
    drawCross(_ctx, v2(p.x - this.size.x, p.y - this.size.x), v2(this.size.x * 2, this.size.x * 2), this.angle, 0.1, color, addColor(color, "white", 0.2));
    super.render();
  }

  static instantiate(pos = mouse.world, size = v2(r_range(20, 80), r_range(20, 80))) {
    var ball = new Ball(v2(pos.x, pos.y), v2(size.x, size.y));
    shapes.push(ball);
    return ball;
  }
}

class Rectangle extends Shape {
  constructor(pos, size, color = getRandomColor(), allowRotation = false) {
    super(pos, size, "SQUARE", color);
    this.allowRotation = allowRotation;
    this.bounceFactor = 0.5;
    this.dragFactor = 0.8;
    this.setBrokenGeometry(10);
  }

  duplicate() {
    var rect = new Rectangle(v2(this.pos.x + 5, this.pos.y + 5), v2(this.size.x, this.size.y), this.color);
    rect.movable = this.movable;
    rect.static = this.static;
    rect.angle = this.angle;
    rect.gravity = v2(this.gravity.x, this.gravity.y);
    rect.rotationEnabled = this.rotationEnabled;
    rect.angVel = this.angVel;
    rect.bounceFactor = this.bounceFactor;
    rect.dragFactor = this.dragFactor;
    shapes.push(rect);
  }

  setBrokenGeometry(amount) {
    this.brkP = [];
    this.brkP.push(v2(0, 0));
    this.brkP.push(v2(1, 0));
    this.brkP.push(v2(0, 1));
    this.brkP.push(v2(1, 1));
    for (let i = 0; i < amount; i++) this.brkP.push(v2(r_range(0, 1), r_range(0, 1)));
  }

  updateHover() {
    if (pointInRect(mouse.pos, this.pos, this.size)) hovShape = this;
  }

  render(_ctx = ctx) {
    var isSel = contextMenu.shape === this || hovShape === this || selShape === this;
    var frameColor = isSel ? this.fillColor : addColor(this.fillColor, "black", 0.3);
    var p = toScrn(this.pos.x, this.pos.y);
    drawRect(p.x, p.y, this.size.x, this.size.y, frameColor, this.borderColor, _ctx, this.angle);
  }

  static instantiate(pos = mouse.world, size = v2(r_range(20, 80), r_range(20, 80))) {
    var square = new Rectangle(v2(pos.x, pos.y), v2(size.x, size.y));
    shapes.push(square);
    return square;
  }
}

class Mine extends Shape {
  constructor(pos, size, sidesAmount = 16) {
    super(pos, size, "CIRCLE", "grey", 0);
    this.rotationEnabled = true;
    this.length = 4;
    this.thick = 20;
    this.animSpeed = 0.1;
    this.sidesAmount = sidesAmount;
    this.color1 = "white";
    this.color2 = "rgba(199, 199, 199, 1)";
  }

  duplicate() {
    var mine = new Mine(v2(this.pos.x + 5, this.pos.y + 5), v2(this.size.x, this.size.y), this.sidesAmount);
    mine.movable = this.movable;
    mine.static = this.static;
    mine.color1 = this.color1;
    mine.color2 = this.color2;
    mine.angle = this.angle;
    mine.gravity = v2(this.gravity.x, this.gravity.y);
    mine.rotationEnabled = this.rotationEnabled;
    mine.angVel = this.angVel;
    mine.bounceFactor = this.bounceFactor;
    mine.dragFactor = this.dragFactor;
    shapes.push(mine);
  }

  render() {
    var th = this.thick;
    if (this.animSpeed) th = this.thick * Math.abs((((frame / 2) * this.animSpeed) % 5) - 2.5);
    drawStar(ctx, v2(sx(this.pos.x), sy(this.pos.y)), this.sidesAmount, this.angle, this.length, th, this.color1, this.color2);
  }
  updateHover() {
    if (pointInCircle(mouse.pos, v2(this.pos.x, this.pos.y), this.size.x)) hovShape = this;
  }

  static instantiate(pos = mouse.world, size = v2(r_range(20, 80), r_range(20, 80))) {
    var mine = new Mine(v2(pos.x, pos.y), v2(size.x, size.y));
    mine.push(mine);
    return mine;
  }
}
