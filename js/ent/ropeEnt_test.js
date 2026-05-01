class RopeEntity extends Rope {
  constructor(start, end = null, color = getRandomColor(), thick = 20, _segAmount = segAmount, _segSpace = segSpace, damp = dampingFactor) {
    super(start, end, color, thick, _segAmount, _segSpace, damp);
    this.vel = v2(r_range(-5, 5), r_range(-5, 5));
    this.segments[0].isAnchor = false;
    this.maxVel = v2(8, 5);
    this.steerFactor = v2(0.1, 0.02);
    this.steerSpeed = mult_v2(this.maxVel, this.steerFactor);
    this.steerChance = 100;
    this.groundFriction = 0.94;
    this.jumpForce = 50;
    this.eyeColor = "white";
    this.pupilColor = "black";
    this.jumping = false;
    this.alive = true;
    this.jumpChance = 0.005;
    this.grounded = false;
    this.setPointy(r_range(-0.3, 0.3));
  }

  jump(force = this.jumpForce) {
    if (this.vel.y <= 0) this.vel.y = 0;
    this.vel.y -= this.maxVel.y * force;
    this.jumping = true;
    setTimeout(() => (this.jumping = false), 10);

    // setTimeout(() => (this.vel.y = 0), 200);
  }

  dash() {
    let p0 = this.segments[0].pos;
    let p1 = this.segments[1].pos;
    let angle = Math.atan2(p0.y - p1.y, p0.x - p1.x);
    let dir = v2(Math.cos(angle), Math.sin(angle));
    this.vel = v2(dir.x * this.maxVel.x * 10, dir.y * this.maxVel.y * 10);
  }

  steerAgent(headPos = this.segments[0].pos) {
    if (headPos.x <= this.thick * 4 - mapSize.x) this.vel.x += this.steerSpeed.x;
    else if (headPos.x >= mapSize.x - this.thick * 4) this.vel.x -= this.steerSpeed.x;
    else if (r_range_int(0, 100) <= this.steerChance) this.vel.x = clamp(this.vel.x + (Math.random() * 2 - 1) * this.steerSpeed.x, -this.maxVel.x, this.maxVel.x);

    var lim = this.segAmount * 0.2 * this.segSpace;
    if (!this.grounded && headPos.y <= lim) this.vel.y += this.steerSpeed.y;
    else if (headPos.y >= window.innerHeight - lim) this.vel.y -= this.steerSpeed.y;
    else if (r_range_int(0, 100) <= this.steerChance) this.vel.y = clamp(this.vel.y + (Math.random() * 2 - 1) * this.steerSpeed.y, -this.maxVel.y, this.maxVel.y);
    if (this.grounded && r_range(0, 1) < this.jumpChance) this.jump();
    return add_v2(headPos, this.vel);
  }

  update() {
    super.update();
  }

  remove() {
    ensureElementRemoval(this);
  }

  static duplicate() {
    var rp = RopeEntity.instantiate(this.constructor, v2(this.pos.x, this.pos.y));
    return rp;
  }

  control() {
    if (!player) {
      player = this;
      cam.setTarget(this.segments[0]);
    } else if (player === this) player = null;
    else this.control2();
  }

  control2() {
    if (!player2) player2 = this;
    else if (player2 === this) player2 = null;
  }

  render(_ctx = ctx) {
    super.render(_ctx);
    if (player === this) drawText(_ctx, sx(this.segments[0].pos.x), sy(this.segments[0].pos.y - 50), "PLAYER 1", "white", null, 12);
    else if (player2 === this) drawText(_ctx, sx(this.segments[0].pos.x), sy(this.segments[0].pos.y - 50), "PLAYER 2", "white", null, 12);
  }

  static instantiate(constructor, pos) {
    try {
      const entity = new constructor(pos);
      entities.push(entity);
      return entity;
    } catch (e) {
      console.warn("Error instantiating entity: " + e.message);
      return null;
    }
  }
}

class Snake extends RopeEntity {
  constructor(start, end = null, color = getRandomColor(), thick = 20, _segAmount = segAmount, _segSpace = segSpace, damp = dampingFactor) {
    super(start, end, color, thick, _segAmount, _segSpace, damp);
    this.stiffness = 0.5;
    this.stripesOccurence = r_range_int(0, 10);
    this.type = "SNAKE";
    this.setSpines();
  }

  handleEntityCollisions() {
    for (let i = 0; i < this.segments.length; i++) {
      var a = this.segments[i];
      var p = a.pos;
      var closeSegments = colGrid.getAtPos(p.x, p.y);
      for (const b of closeSegments) {
        if (!b.movable) continue;
        if (b.type === "CIRCLE" && circleOverlap(a.pos, a.thick, b.pos, b.size.x)) {
          this.frameCollisionsAmount++;
          if (1) {
            b.vel.y += this.vel.y * 10;
            b.vel.x += this.vel.x * 10;

            b.vel.x = clamp(b.vel.x, -1000, 1000);
            b.vel.y = clamp(b.vel.y, -1000, 1000);
          }

          if (this !== player) this.jump();

          //   b.vel = add_v2(b.vel, scale_v2(this.vel, 10));

          var dx = b.pos.x - a.pos.x;
          var dy = b.pos.y - a.pos.y;
          var dist = Math.sqrt(dx * dx + dy * dy) || 0.0001;
          var pushDist = (a.thick + b.size.x) / 2 - dist;
          if (pushDist > 0) {
            b.pos.x += (dx / dist) * pushDist * 0.5;
            b.pos.y += (dy / dist) * pushDist * 0.5;
          }
        } else if (b.type === "SQUARE" && circleInRect(a.pos, a.thick, b.pos, b.size)) {
          if (!b.movable || b.static || b.grounded) this.grounded = true;
          this.frameCollisionsAmount++;
          return;
          b.vel = add_v2(b.vel, scale_v2(this.vel, 2));
          var closestX = Math.max(b.pos.x, Math.min(a.pos.x, b.pos.x + b.size.x));
          var closestY = Math.max(b.pos.y, Math.min(a.pos.y, b.pos.y + b.size.y));
          var dx = a.pos.x - closestX;
          var dy = a.pos.y - closestY;
          var dist = Math.sqrt(dx * dx + dy * dy) || 0.0001;
          var pushDist = a.thick / 2 - dist;
          if (pushDist > 0) {
            b.pos.x += (dx / dist) * pushDist * 0.5;
            b.pos.y += (dy / dist) * pushDist * 0.5;
          }
        } else if (Math.abs(this.segments.indexOf(a) - this.segments.indexOf(b)) > 2) this.handleSegCollision(a, b, 0.2);
      }
    }
  }

  controlSnake(headPos = this.segments[0].pos) {
    var noGrav = Math.abs(this.gravity.y) <= 10;
    var grounded = this.grounded || this.frameCollisionsAmount;

    var jumpKey = this === player2 ? "enter" : " ";
    var movKeys = this === player2 ? input.arrows : input.wasd;
    if (input.keyClicked === jumpKey && (grounded || noGrav)) {
      if (noGrav) this.dash();
      else this.jump();
      return headPos;
    }
    // if (!grounded) this.vel.y = 0;
    // if (this.vel.y < -this.maxVel.y) this.vel.y += 0.01;
    var inputVec = movKeys;
    var max = mult_v2(this.maxVel, v2(2, 2));
    var steerSpeed = 1;
    if (!inputVec.x) this.vel.x *= 0.8;
    else this.vel.x = clamp(this.vel.x + inputVec.x * steerSpeed, -max.x, max.x);
    if (inputVec.y && (grounded || noGrav)) this.vel.y = clamp(this.vel.y + inputVec.y * steerSpeed, -max.y, max.y);
    return add_v2(headPos, this.vel);
  }

  getHeadMovement(head = this.segments[0]) {
    if (selSegment && selSegment.rope === this) return head.pos;
    if (!this.alive || head.isAnchor) return head.pos;
    if (this === player || this === player2) return this.controlSnake();
    else return this.steerAgent();
  }

  update() {
    var newP = this.getHeadMovement();
    if (!this.grounded || this.jumping) this.vel.y += this.gravity.y * 0.1;
    if (this.jumping && this.vel.y < 0) this.vel.y *= 0.8;
    if (this.collisionsEnabled) this.handleEntityCollisions();
    var head = this.segments[0];
    // newP.x = clamp(newP.x, head.thick / 2, window.innerWidth - head.thick / 2);
    // newP.y = clamp(newP.y, head.thick / 2, window.innerHeight - head.thick / 2);
    head.pos = newP;
    super.update();
  }

  render(_ctx = ctx) {
    super.render(_ctx);

    var lastSegP = this.segments[0].pos;
    var w = Math.max(8, this.segments[0].thick / 4);
    var cVel = clamp_v2(this.vel, v2(3, 3));
    var eye1P = toScrn(lastSegP.x - w / 2 + cVel.x, lastSegP.y - w / 2 + cVel.y);
    var eye2P = toScrn(lastSegP.x - w / 2 + cVel.x * 0.7, lastSegP.y - w / 2 + cVel.y * 0.7);

    drawCircle2(_ctx, eye1P.x, eye1P.y, w, "white", this.pupilColor, 2);
    drawCircle2(_ctx, eye2P.x, eye2P.y, w, this.eyeColor, "rgba(0, 0, 0, 1)", 2);
    drawCircle2(_ctx, eye2P.x + cVel.x * 0.25 + w / 8, eye2P.y + cVel.y * 0.25 + w / 8, w / 4, this.pupilColor, "rgba(0,0,0,0)", 0);
  }

  static instantiate(pos, _thick = r_range(8, 30), _segAmount = r_range_int(40, 80), _segSpace = r_range_int(4, 10)) {
    var snake = new Snake(pos, null, getRandomColor(), _thick, _segAmount, _segSpace);
    entities.push(snake);
    return snake;
  }
}

class Spider {
  constructor(pos, bodySize = 15, legCount = 8, legAmount = 5, legSpace = 40, legThickness = 3) {
    this.pos = v2(pos.x, pos.y);
    this.vel = v2(r_range(-5, 5), r_range(-5, 5));
    this.bodySize = bodySize;
    this.legCount = legCount;
    this.legAmount = legAmount;
    this.legSpace = legSpace;
    this.legThickness = legThickness;
    this.color = getRandomColor();
    this.maxVel = v2(8, 5);
    this.type = "SPIDER";
    this.steerFactor = v2(0.1, 0.02);
    this.steerSpeed = mult_v2(this.maxVel, this.steerFactor);
    this.grounded = false;
    this.jumpChance = 100;
    this.gravity = v2(gravity.x, gravity.y);
    this.init();
  }

  init() {
    this.body = new Shape(this.pos, v2(this.bodySize, this.bodySize), "CIRCLE", this.color);
    this.body.bounceFactor = 0;
    this.body.dragFactor = 0;
    this.body.angVel = 0;
    shapes.push(this.body);
    this.legs = [];
    let distFromCenter = this.bodySize * 1.2;
    const angleStep = (Math.PI * 2) / this.legCount;
    for (let i = 0; i < this.legCount; i++) {
      const angle = angleStep * i;
      const legStart = v2(this.pos.x + Math.cos(angle) * this.bodySize, this.pos.y + Math.sin(angle) * this.bodySize);
      const legOffset = v2(Math.cos(angle) * distFromCenter, Math.sin(angle) * distFromCenter);
      // Second segment goes upward in web-like manner
      const seg1Offset = v2(Math.cos(angle) * distFromCenter * 1, -distFromCenter * 2.5);
      // Third segment continues horizontally outward
      const seg2Offset = v2(Math.cos(angle) * distFromCenter * 3, Math.sin(angle) * distFromCenter * 0.5);
      const seg3Offset = v2(seg2Offset.x, seg2Offset.y + 20);
      const seg4Offset = v2(seg2Offset.x, seg2Offset.y + 30);

      const leg = new Rope(legStart, null, this.color, this.legThickness, this.legAmount, this.legSpace);
      leg.parent = this;
      leg.legAngle = angle;
      leg.segments[0].attachToShape(this.body, legOffset);
      leg.segments[1].attachToShape(this.body, seg1Offset);
      leg.segments[2].attachToShape(this.body, seg2Offset);
      leg.segments[3].attachToShape(this.body, seg3Offset);
      leg.segments[4].attachToShape(this.body, seg4Offset);

      this.legs.push(leg);
      ropes.push(leg);
    }
  }

  update() {
    this.legs[0].segments[1].pos.y = this.body.pos.y - 50;
    return;
    this.vel.y += this.gravity.y * 0.016; // deltaTime approximation
    this.pos.x += this.vel.x;
    this.pos.y += this.vel.y;
    this.body.pos = this.pos;
    for (const leg of this.legs) {
      const lastSegment = leg.segments[leg.segments.length - 1];
      // Try to place leg endpoint on ground or slightly above
      const targetY = Math.min(lastSegment.pos.y, window.innerHeight - 10);

      // Prevent legs from going too far from body
      const maxLegReach = this.bodySize + this.legAmount * this.legSpace;
      const dx = lastSegment.pos.x - this.pos.x;
      const dy = lastSegment.pos.y - this.pos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > maxLegReach) {
        const ratio = maxLegReach / dist;
        lastSegment.pos.x = this.pos.x + dx * ratio;
        lastSegment.pos.y = this.pos.y + dy * ratio;
      }

      // Simple ground collision for leg endpoints
      if (lastSegment.pos.y >= window.innerHeight - 5) {
        lastSegment.pos.y = window.innerHeight - 5;
      }
    }

    // Support body: push up if touching ground
    let groundContactCount = 0;
    for (const leg of this.legs) {
      const lastSegment = leg.segments[leg.segments.length - 1];
      if (lastSegment.pos.y >= window.innerHeight - 10) {
        groundContactCount++;
      }
    }

    // If legs are on ground, reduce downward velocity
    if (groundContactCount > 0) {
      this.vel.y *= 0.8;
      if (this.vel.y > 0) this.vel.y = 0;
    }
  }

  render(_ctx = ctx) {
    return;
  }

  static instantiate(pos) {
    var spider = new Spider(pos);
    entities.push(spider);
    return spider;
  }

  static remove(spider) {
    console.warn("REMOVING SPIDER ");

    for (const leg of spider.legs) {
      Rope.remove(leg);
    }
    if (player === spider) player = null;
  }
}

class Lugworm extends RopeEntity {
  constructor(pos, _segAmount = 80, _segSpace = 5) {
    super(pos, pos, getRandomColor(), 2, _segAmount, _segSpace);
    this.pos = this.segments[0].pos;
    this.vel = v2(r_range(-5, 5), r_range(-5, 5));
    this.type = "LUGWORM";
    this.maxVel = v2(8, 8);
    this.steerFactor = v2(5, 4);
    this.steerSpeed = mult_v2(this.maxVel, this.steerFactor);
    this.steerChance = 2;
    this.gravity = v2(0, -20);
  }

  update() {
    this.pos = this.segments[0].pos;
    var newP = this.steerAgent();
    this.segments[0].pos = newP;
    super.update();
  }
  static instantiate(pos) {
    var lugworm = new Lugworm(pos);
    entities.push(lugworm);
    return lugworm;
  }
}

class RobotArm extends RopeEntity {
  constructor(pos, _segAmount = 10, _segSpace = 40, color = getRandomColor(), targetObject = mouse) {
    super(pos, null, color, 2, _segAmount, _segSpace, dampingFactor);
    this.segments[0].setAnchor(pos);
    this.type = "ROBOTARM";
    this.stiffness = 1;
    this.gravity.y = -100;
    this.targetObject = targetObject;
  }

  update() {
    super.update();
    if (this.targetObject) {
      const seg = this.segments[this.segments.length - 1];
      const p = seg.pos;
      const t = this.targetObject.pos;
      const dx = t.x - p.x;
      const dy = t.y - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 0.0001;
      const step = Math.min(10000, dist);
      const angleToTarget = Math.atan2(dy, dx);
      seg.pos = v2(p.x + Math.cos(angleToTarget) * step, p.y + Math.sin(angleToTarget) * step);
    }
  }

  render(_ctx = ctx) {
    super.render(ctx);
  }

  static instantiate(pos) {
    var robotArm = new RobotArm(pos);
    entities.push(robotArm);
    return robotArm;
  }
}
