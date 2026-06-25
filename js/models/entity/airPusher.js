class AirPusher {
  constructor(pos, angle = 0, force = 20, radius = 400) {
    this.pos = pos;
    this.angle = angle;
    this.baseForce = force;
    this.force = this.baseForce;
    this.size = v2(20, 20);
    this.radius = radius;
    this.airLines = [];
  }

  remove() {
    AirPusher.remove(this);
  }
  duplicate() {
    var newAirPusher = new AirPusher(v2(this.pos.x + 5, this.pos.y + 5), this.angle, this.force, this.radius);
    airPushers.push(newAirPusher);
  }
  place(pos = v2(mouse.world.x, mouse.world.y)) {
    this.pos = pos;
  }

  getWindForceAtPos(pos, mass = 0.1) {
    var dx = pos.x - this.pos.x;
    var dy = pos.y - this.pos.y;
    var dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > this.radius) return pos;
    var angleToPoint = Math.atan2(dy, dx);
    var angleDiff = Math.abs(((angleToPoint - this.angle + Math.PI) % (2 * Math.PI)) - Math.PI);
    if (angleDiff > Math.PI / 6) return pos;
    var strength = (1 - dist / this.radius) * this.force * Math.random();
    // Use direction from airPusher to pos for wind direction
    var dirX = dx / (dist || 1);
    var dirY = dy / (dist || 1);
    var massFactor = Math.max(0.1, 1 - mass); // Clamp to prevent negative push
    var pushX = dirX * strength * massFactor;
    var pushY = dirY * strength * massFactor;
    return v2(pos.x + pushX, pos.y + pushY);
  }

  control() {
    if (player === this) player = null;
    else {
      player = this;
      cam.follow(this);
    }
  }

  controlAirPusher() {
    var dir = scale_v2(input.wasd, 4 * dt * 100);
    var newP = add_v2(this.pos, dir);
    newP.x = clamp(newP.x, -mapSize.x, mapSize.x);
    newP.y = clamp(newP.y, -mapSize.y, groundLevel);
    this.place(newP);
    this.angle += input.arrows.x * 0.05;
    if (this.angle < Math.PI) this.angle += Math.PI * 2;
    else if (this.angle > Math.PI) this.angle -= Math.PI * 2;
    this.radius = clamp(this.radius - input.arrows.y * 10, 1, window.innerWidth);
  }

  render_rad() {
    var size = this.radius;
    var baseWidth = Math.max(20, size);
    var dx = Math.cos(this.angle),
      dy = Math.sin(this.angle);
    var px = -dy,
      py = dx;
    var baseCenter = v2(this.pos.x + dx * 20, this.pos.y + dy * 20);
    var tip = v2(baseCenter.x + dx * size, baseCenter.y + dy * size);
    var left = v2(tip.x + px * baseWidth * 0.5, tip.y + py * baseWidth * 0.5);
    var right = v2(tip.x - px * baseWidth * 0.5, tip.y - py * baseWidth * 0.5);
    if (!hovSegment && !selShape && !selDirPusher && !selAirPusher && !selSegment && pointInTriangle(mouse.world.x, mouse.world.y, baseCenter.x, baseCenter.y, left.x, left.y, right.x, right.y))
      hovDirPusher = this;
    var clr = player === this || hovDirPusher === this ? "rgba(255, 255, 255, 0.2)" : "rgba(255, 255, 255, 0.1)";
    if (hovDirPusher === this && mouse.pressed) selDirPusher = this;
    drawTriangleBorder(ctx, toScrn(baseCenter.x, baseCenter.y), toScrn(left.x, left.y), toScrn(right.x, right.y), clr, 2);
  }

  render(_ctx = ctx) {
    if (player === this) this.controlAirPusher();
    var size = 20;
    this.force = clamp(this.force + r_range(-4, 4), this.baseForce * 0.5, this.baseForce * 1.5);
    var p = toScrn(this.pos.x, this.pos.y);

    var dx = Math.cos(this.angle);
    var dy = Math.sin(this.angle);
    var px = -dy;
    var py = dx;
    var tip = v2(p.x + dx * size, p.y + dy * size);
    var left = v2(p.x + px * size * 0.5, p.y + py * size * 0.5);
    var right = v2(p.x - px * size * 0.5, p.y - py * size * 0.5);

    if (!selDirPusher && !selAirPusher && !hovAirPusher && !hovDirPusher && pointInTriangle(mouse.pos.x, mouse.pos.y, tip.x, tip.y, left.x, left.y, right.x, right.y)) {
      hovAirPusher = this;
    }
    this.render_rad();

    var length = this.baseForce * 2;
    var rad = this.radius / 2 - length / 2;
    var push = v2(Math.cos(this.angle) * rad, Math.sin(this.angle) * rad);
    drawArrowFromAngle(add_v2(p, push), this.angle, -length, "rgba(255, 255, 255, 0.24)");

    if (hovAirPusher === this && input.keyClicked === "f") cam.follow(this);

    if ((!mouse.pressed || hovSegment) && input.keyClicked !== "enter") {
      if (selAirPusher === this) selAirPusher = null;
      if (selDirPusher === this) selDirPusher = null;
    } else {
      if (hovAirPusher === this) {
        if (input.keyClicked === "enter" || (mouse.clicked && input.keys["shift"])) {
          this.control();
        } else selAirPusher = this;
      }
      if (selAirPusher === this) this.place();
      else {
        if (selDirPusher === this) {
          var diff = magnitude_v2(p, mouse.pos);
          if (input.keys["shift"]) {
            var dx = mouse.pos.x - p.x;
            var dy = mouse.pos.y - p.y;
            var forward = Math.cos(this.angle) * dx + Math.sin(this.angle) * dy;
            var clampedDiff = clamp(diff * 0.1, -200, 200);
            this.baseForce = forward >= 0 ? clampedDiff : -clampedDiff;
          } else {
            this.angle = Math.atan2(mouse.pos.y - p.y, mouse.pos.x - p.x);
            this.radius = Math.floor(diff);
          }
        }
      }
    }
    var clr = hovAirPusher === this || selAirPusher === this ? (this === player ? "blue" : "white") : this === player ? "rgba(0, 208, 255, 1)" : "grey";
    drawTriangleBorder(_ctx, tip, left, right, clr, 2);
  }

  static remove(airPusher) {
    var idx = airPushers.indexOf(airPusher);
    if (idx === -1) return;
    if (selAirPusher === airPusher) selAirPusher = null;
    if (selDirPusher === airPusher) selDirPusher = null;
    airPushers.splice(idx, 1);
  }
  static instantiate(pos, angle = 0) {
    var airPusher = new AirPusher(v2(pos.x, pos.y), angle);
    airPushers.push(airPusher);
    return airPusher;
  }
}
