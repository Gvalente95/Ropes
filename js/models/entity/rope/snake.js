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
        if (!b.movable || !b.collisionsEnabled) continue;
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
    var movKeys = player2 ? (this === player2 ? input.arrows : input.wasd) : or_v2(input.arrows, input.wasd);
    if (input.keyClicked === jumpKey && (grounded || noGrav)) {
      if (noGrav) this.dash();
      else this.jump();
      return headPos;
    }
    if (!noGrav && this.vel.y < 0 && !this.grounded) this.vel.y += 3;
    else if (this.vel.y < -this.maxVel.y) this.vel.y += 0.01;
    var inputVec = movKeys;
    var max = this.maxVel;
    if (input.shift) max = mult_v2(max, v2(2, 2));
    var steerSpeed = 1;
    if (!inputVec.x) this.vel.x *= 0.8;
    else this.vel.x = clamp(this.vel.x + inputVec.x * steerSpeed, -max.x, max.x);
    if (inputVec.y && (grounded || noGrav)) this.vel.y = clamp(this.vel.y + inputVec.y * steerSpeed * (noGrav ? 10 : 1), -max.y, max.y);
    this.vel.y *= 0.999;
    return add_v2(headPos, this.vel);
  }

  getHeadMovement(head = this.segments[0]) {
    if (selSegment && selSegment.rope === this) return head.pos;
    if (!this.alive || head.isAnchor) return head.pos;
    if (this === player || this === player2) return this.controlSnake();
    else return this.steerAgent();
  }

  update() {
    if (paused && (!selSegment || selSegment.rope !== this)) return;
    var newP = this.getHeadMovement();
    if (this.collisionsEnabled) this.handleEntityCollisions();
    var head = this.segments[0];
    head.pos = newP;
    super.update();
  }

  render(_ctx = ctx) {
    super.render(_ctx);

    const lastSegP = this.segments[0].pos;
    const w = Math.max(4, this.segments[0].thick / 4);
    const cVel = clamp_v2(this.vel, v2(3, 3));
    const pupilRadius = w / 4;
    const maxPupilDistance = w - pupilRadius - 1;

    const head = this.segments[0];
    let eye2P = toScrn(lastSegP.x - w / 2 + cVel.x * 1, lastSegP.y - w / 2 + cVel.y * 1);
    var pupPos = null;
    if (head.isAnchor) {
      const target = mouse.pos;
      const delta = sub_v2(target, eye2P);
      const angle = Math.atan2(delta.y, delta.x);
      const dist = Math.sqrt(delta.x * delta.x + delta.y * delta.y);
      const pupilDistance = Math.min(maxPupilDistance, dist);
      const pupilOffset = v2(Math.cos(angle) * pupilDistance, Math.sin(angle) * pupilDistance);
      pupPos = add_v2(eye2P, pupilOffset);
    } else {
      const velAngle = Math.atan2(this.vel.y, this.vel.x);
      const velMagnitude = Math.sqrt(this.vel.x * this.vel.x + this.vel.y * this.vel.y);
      const maxVelMagnitude = Math.sqrt(this.maxVel.x * this.maxVel.x + this.maxVel.y * this.maxVel.y);
      const normalizedVelMag = Math.min(1, velMagnitude / maxVelMagnitude);
      const pupilDistance = maxPupilDistance * normalizedVelMag;
      const pupilOffset = v2(Math.cos(velAngle) * pupilDistance, Math.sin(velAngle) * pupilDistance);
      pupPos = add_v2(eye2P, pupilOffset);
    }

    drawCircle2(_ctx, eye2P.x, eye2P.y, w, this.eyeColor, "rgba(0, 0, 0, 1)", 1);
    drawCircle2(_ctx, pupPos.x, pupPos.y, pupilRadius, this.pupilColor, "rgba(0,0,0,0)", 0);
  }

  static instantiate(pos, _thick = r_range(8, 30), _segAmount = r_range_int(40, 80), _segSpace = r_range_int(4, 10)) {
    var snake = new Snake(pos, null, getRandomColor(), _thick, _segAmount, _segSpace);
    entities.push(snake);
    return snake;
  }
}
