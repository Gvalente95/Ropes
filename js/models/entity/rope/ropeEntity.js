class RopeEntity extends Rope {
  constructor(start, end = null, color = getRandomColor(), thick = 20, _segAmount = segAmount, _segSpace = segSpace, damp = dampingFactor) {
    super(start, end, color, thick, _segAmount, _segSpace, damp);
    this.vel = v2(r_range(-5, 5), r_range(-5, 5));
    this.segments[0].isAnchor = false;
    this.maxVel = v2(8, 5);
    this.steerFactor = v2(0.1, 0.02);
    this.steerSpeed = mult_v2(this.maxVel, this.steerFactor);
    this.steerTarget = null;
    this.onReachTarget = null;
    this.steerChance = 100;
    this.groundFriction = 0.94;
    this.jumpForce = 6;
    this.eyeColor = "white";
    this.pupilColor = "black";
    this.isRunning = false;

    this.alive = true;
    this.jumpChance = 0.005;
    this.grounded = false;
    this.setPointy(r_range(-0.3, 0.3));
  }

  jump(force = this.jumpForce) {
    if (this.vel.y <= 0) this.vel.y = 0;
    this.vel.y -= this.maxVel.y * force * (this.gravity.y / 100);
  }

  dash() {
    let p0 = this.segments[0].pos;
    let p1 = this.segments[1].pos;
    let angle = Math.atan2(p0.y - p1.y, p0.x - p1.x);
    let dir = v2(Math.cos(angle), Math.sin(angle));
    this.vel = v2(dir.x * this.maxVel.x * 10, dir.y * this.maxVel.y * 10);
  }

  follow(target, onReachTarget = null) {
    this.steerTarget = target;
    this.onReachTarget = onReachTarget;
  }

  getTargetPos(target) {
    if (!target) return null;

    if (target.pos && target.size) {
      return v2(target.pos.x + target.size.x / 2, target.pos.y + target.size.y / 2);
    }

    if (target.pos) return target.pos;

    return target;
  }

  steerAgent(headPos = this.segments[0].pos) {
    const targetPos = this.getTargetPos(this.steerTarget);
    if (targetPos) {
      const dx = targetPos.x - headPos.x;
      const dy = targetPos.y - headPos.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      if (dist < this.thick * 2) {
        this.steerTarget = null;
        if (this.onReachTarget) {
          this.onReachTarget();
          this.onReachTarget = null;
        }
        return add_v2(headPos, this.vel);
      }
      this.vel.x = clamp(this.vel.x + (dx / dist) * this.steerSpeed.x, -this.maxVel.x, this.maxVel.x);
      this.vel.y = clamp(this.vel.y + (dy / dist) * this.steerSpeed.y, -this.maxVel.y, this.maxVel.y);
      return add_v2(headPos, this.vel);
    }
    if (headPos.x <= this.thick * 4 - mapSize.x) this.vel.x += this.steerSpeed.x;
    else if (headPos.x >= mapSize.x - this.thick * 4) this.vel.x -= this.steerSpeed.x;
    else if (r_range_int(0, 100) <= this.steerChance) this.vel.x = clamp(this.vel.x + (Math.random() * 2 - 1) * this.steerSpeed.x, -this.maxVel.x, this.maxVel.x);

    var lim = this.segAmount * 0.2 * this.segSpace;
    if (!this.grounded) {
      if (this.vel.y < 0) this.vel.y += this.gravity.y * 0.1;
    } else if (headPos.y <= lim) this.vel.y += this.steerSpeed.y;
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
      cam.follow(this.segments[0]);
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
