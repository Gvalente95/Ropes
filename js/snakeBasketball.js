class SnakeBasketball {
  constructor() {
    this.snakeA = null;
    this.snakeB = null;
    this.ball = null;
    this.startBounce = 0;
    this.scoreA = 0;
    this.scoreB = 0;
    this.basketCenter0 = null;
    this.basketCenter1 = null;
    this.basketSize = new Vec2(140, 140);
    this.active = false;
    this.canScore = true;
    this.counterSize = 0;
    this.barA = null;
    this.barB = null;
  }

  update() {
    if (this.startBounce > 0) {
      if (this.ball.frameCollisionsAmount > 0) {
        this.startBounce--;
        this.counterSize = 100;
      } else if (this.counterSize > 2) this.counterSize -= 0.5;
      return;
    }
    if (this.startBounce === 0) this.snakeA.alive = this.snakeB.alive = true;
    if (this.canScore) {
      var bar = null;
      const basketTopLeft0 = new Vec2(this.basketCenter0.x - this.basketSize.x / 2, this.basketCenter0.y - this.basketSize.y / 2);
      const basketTopLeft1 = new Vec2(this.basketCenter1.x - this.basketSize.x / 2, this.basketCenter1.y - this.basketSize.y / 2);
      if (pointInRect(this.ball.center, basketTopLeft0, this.basketSize)) {
        this.scoreA++;
        bar = this.barA;
      } else if (pointInRect(this.ball.center, basketTopLeft1, this.basketSize)) {
        this.scoreB++;
        bar = this.barB;
      }

      if (bar) {
        this.canScore = false;
        bar.collisionsEnabled = false;
        setTimeout(() => (bar.collisionsEnabled = false), 1000);
        setTimeout(() => {
          bar.collisionsEnabled = true;
        }, 2000);
        setTimeout(() => (this.canScore = true), 2500);
      }
    }
  }

  render() {
    if (this.startBounce > 0) {
      drawText(ctx, [screenCenter.x, screenCenter.y], this.startBounce, "white", null, this.counterSize);
    } else {
      var h = window.innerHeight * 0.3;
      drawText(ctx, [window.innerWidth / 2, h], this.scoreA + " - " + this.scoreB, "white", null, 40);
    }

    drawRect(0, 0, window.innerWidth / 2, window.innerHeight, setAlpha(this.snakeB.color, 0.3));
    drawRect(window.innerWidth / 2, 0, window.innerWidth / 2, window.innerHeight, setAlpha(this.snakeA.color, 0.3));

    // drawCircle2(ctx, [this.basketCenter0.x, this.basketCenter0.y], 8, "red");
    // drawCircle2(ctx, [this.basketCenter1.x, this.basketCenter1.y], 8, "red");
  }

  init() {
    clearAll();
    colGrid.init(200, false);
    gravity = new Vec2(0, 60);
    SelfCollisionsInterval = 1;

    var thick = 40;
    var sh = window.innerHeight - thick;

    var xDist = 200;
    var sw = 300;

    var stiff = 0.3;

    var me = new Snake(new Vec2(xDist + sw, sh), new Vec2(xDist, sh), getRandomColor(), thick);
    me.segments[me.segments.length - 1].setAnchor(null);
    me.control();
    me.stiffness = stiff;
    entities.push(me);
    this.snakeA = me;

    var ennemy = new Snake(new Vec2(window.innerWidth - xDist - sw, sh), new Vec2(window.innerWidth - xDist, sh), getRandomColor(), thick);
    ennemy.segments[ennemy.segments.length - 1].setAnchor(null);
    entities.push(ennemy);
    ennemy.control2();
    ennemy.stiffness = stiff;
    this.snakeB = ennemy;

    var ball = Shape.instantiate("CIRCLE", new Vec2(screenCenter.x, 100), new Vec2(40, 40));
    ball.color = "rgba(249, 120, 0, 1)";
    this.ball = ball;

    var w = 20;
    var webSize = new Vec2(this.basketSize.x, this.basketSize.y);
    var barColor = "rgba(66, 83, 101, 1)";

    var xDistFromHor = window.innerWidth * 0.01;
    var yDistFromTop = window.innerHeight * 0.4;
    var p0 = new Vec2(xDistFromHor, yDistFromTop);
    var p1 = new Vec2(window.innerWidth - xDistFromHor - w, yDistFromTop);
    this.basketCenter0 = new Vec2(p0.x + webSize.x / 2, p0.y + webSize.y / 2);
    this.basketCenter1 = new Vec2(p1.x - webSize.x / 2, p1.y + webSize.y / 2);

    for (let i = 0; i < 2; i++) {
      var p = i === 0 ? p0 : p1;
      var clr = i === 0 ? this.snakeA.color : this.snakeB.color;
      var s = new Shape(p, new Vec2(w, window.innerHeight - yDistFromTop), "SQUARE", clr);
      s.static = true;
      s.movable = false;
      shapes.push(s);

      var bx = i === 0 ? p.x + webSize.x : p.x - webSize.x;
      var bar = new Shape(new Vec2(bx, p.y), new Vec2(w, webSize.y), "SQUARE", clr);
      bar.static = true;
      bar.movable = false;
      shapes.push(bar);

      var p = new Vec2(p.x - (i === 1 ? webSize.x : 0), p.y + webSize.y);

      //   var barDown = new Rope(p, new Vec2(p.x + webSize.x, p.y), clr, 4, 32, 4);
      //   ropes.push(barDown);

      var barDown = new Shape(p, new Vec2(webSize.x, w), "SQUARE", clr);
      shapes.push(barDown);
      barDown.static = true;
      barDown.movable = false;
      if (i === 0) this.barA = barDown;
      else this.barB = barDown;
    }
    this.active = true;
    this.startBounce = 3;
    this.counterSize = 100;
    this.snakeA.alive = this.snakeB.alive = false;
  }
}
