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
