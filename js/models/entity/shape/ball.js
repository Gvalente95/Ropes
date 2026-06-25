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

  static instantiate(pos = mouse.world, size = r_range(20, 80)) {
    var ball = new Ball(v2(pos.x, pos.y), v2(size, size));
    shapes.push(ball);
    return ball;
  }
}
