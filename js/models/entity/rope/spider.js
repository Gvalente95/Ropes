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
