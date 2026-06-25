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
