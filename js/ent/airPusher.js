class AirPusher {
  constructor(pos, angle = 0, force = 20, radius = 400) {
    this.pos = pos;
    this.angle = angle;
    this.baseForce = force;
    this.force = this.baseForce;
    this.radius = radius;
    this.airLines = [];
  }

  remove() {
    AirPusher.remove(this);
  }
  duplicate() {
    var newAirPusher = new AirPusher(new Vec2(this.pos.x + 5, this.pos.y + 5), this.angle, this.force, this.radius);
    airPushers.push(newAirPusher);
  }
  place(pos = new Vec2(mouse.pos.x, mouse.pos.y)) {
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
    return new Vec2(pos.x + pushX, pos.y + pushY);
  }

  render_rad() {
    var size = this.radius;
    var baseWidth = Math.max(20, size);
    var dx = Math.cos(this.angle),
      dy = Math.sin(this.angle);
    var px = -dy,
      py = dx;
    var baseCenter = [this.pos.x + dx * 20, this.pos.y + dy * 20];
    var tip = [baseCenter[0] + dx * size, baseCenter[1] + dy * size];
    var left = [tip[0] + px * baseWidth * 0.5, tip[1] + py * baseWidth * 0.5];
    var right = [tip[0] - px * baseWidth * 0.5, tip[1] - py * baseWidth * 0.5];
    if (!hovSegment && !selShape && !selDirPusher && !selAirPusher && !selSegment && pointInTriangle(mouse.pos.x, mouse.pos.y, baseCenter[0], baseCenter[1], left[0], left[1], right[0], right[1])) hovDirPusher = this;
    var clr = player === this || hovDirPusher === this ? "rgba(255, 255, 255, 0.2)" : "rgba(255, 255, 255, 0.1)";
    if (hovDirPusher === this && mouse.pressed) selDirPusher = this;
    drawTriangleBorder(ctx, baseCenter, left, right, clr, 2);
  }

  control() {
    player = this;
  }

  render(_ctx = ctx) {
    if (player === this) {
      var dir = scale_v2(input.wasd, 4 * dt * 100);
      var newP = add_v2(this.pos, dir);
      var cp = clamp_v2(newP, new Vec2(window.innerWidth, window.innerHeight));
      this.place(cp);
      this.angle -= input.arrows.x * 0.05;
      if (this.angle < Math.PI) this.angle += Math.PI * 2;
      else if (this.angle > Math.PI) this.angle -= Math.PI * 2;
      this.radius = clamp(this.radius + input.arrows.y * 10, 1, window.innerWidth / 2);
    }
    var size = 20;
    this.force = clamp(this.force + r_range(-4, 4), this.baseForce * 0.5, this.baseForce * 1.5);
    var dx = Math.cos(this.angle);
    var dy = Math.sin(this.angle);
    var px = -dy;
    var py = dx;
    var tip = [this.pos.x + dx * size, this.pos.y + dy * size];
    var left = [this.pos.x + px * size * 0.5, this.pos.y + py * size * 0.5];
    var right = [this.pos.x - px * size * 0.5, this.pos.y - py * size * 0.5];
    if (!selDirPusher && !selAirPusher && !hovAirPusher && !hovDirPusher && pointInTriangle(mouse.pos.x, mouse.pos.y, tip[0], tip[1], left[0], left[1], right[0], right[1])) hovAirPusher = this;
    this.render_rad();

    if (!mouse.pressed || hovSegment) {
      if (selAirPusher === this) selAirPusher = null;
      if (selDirPusher === this) selDirPusher = null;
    } else {
      if (hovAirPusher === this) {
        if (mouse.clicked && input.keys["shift"]) {
          if (this === player) player = null;
          else this.control();
        } else selAirPusher = this;
      }
      if (selAirPusher === this) this.place();
      else {
        if (selDirPusher === this) {
          var diff = magnitude_v2(this.pos, mouse.pos);
          if (input.keys["shift"]) {
            var dx = mouse.pos.x - this.pos.x;
            var dy = mouse.pos.y - this.pos.y;
            var forward = Math.cos(this.angle) * dx + Math.sin(this.angle) * dy;
            var clampedDiff = clamp(diff, -20, 20);
            this.baseForce = forward >= 0 ? clampedDiff : -clampedDiff;
          } else {
            this.angle = Math.atan2(mouse.pos.y - this.pos.y, mouse.pos.x - this.pos.x);
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
    var airPusher = new AirPusher(new Vec2(pos.x, pos.y), angle);
    airPushers.push(airPusher);
    return airPusher;
  }
}
