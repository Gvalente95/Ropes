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
