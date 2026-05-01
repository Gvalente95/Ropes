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
    this.basketSize = v2(200, 140);
    this.active = false;
    this.canScore = true;
    this.counterSize = 0;
    this.barA = null;
    this.barB = null;
    this.snakeAStart = null;
    this.snakeBStart = null;
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
      const basketTopLeft0 = v2(this.basketCenter0.x - this.basketSize.x / 2, this.basketCenter0.y);
      const basketTopLeft1 = v2(this.basketCenter1.x - this.basketSize.x / 2, this.basketCenter1.y);
      const baskSize = v2(this.basketSize.x, this.basketSize.y / 2);
      if (pointInRect(this.ball.center, basketTopLeft0, baskSize)) {
        this.scoreA++;
        bar = this.barA;
      } else if (pointInRect(this.ball.center, basketTopLeft1, baskSize)) {
        this.scoreB++;
        bar = this.barB;
      }

      if (bar) {
        this.canScore = false;
        setTimeout(() => this.resetGame(1), 400);
      }
    }
  }

  resetGame(bounces = 3) {
    this.startBounce = bounces;
    this.ball.pos = v2(mapSize.x / 2, mapSize.y * 0.7);
    this.ball.vel.x = this.ball.vel.y = 0;
    this.counterSize = 100;
    this.snakeA.segments[0].pos = this.snakeAStart;
    this.snakeB.segments[0].pos = this.snakeBStart;
    this.snakeA.vel = v2(0, 0);
    this.snakeB.vel = v2(0, 0);
    this.snakeA.alive = this.snakeB.alive = false;
    this.canScore = true;
  }

  render() {
    if (this.startBounce > 0) {
      drawText(ctx, winCenter.x, winCenter.y, this.startBounce, "white", null, this.counterSize);
    } else {
      var h = mapSize.y * 0.3;
      drawText(ctx, mapSize.x / 2, h, this.scoreA + " - " + this.scoreB, "white", null, 40);
    }

    drawRect(0, 0, mapSize.x / 2, mapSize.y, setAlpha(this.snakeA.color, 0.3));
    drawRect(mapSize.x / 2, 0, mapSize.x / 2, mapSize.y, setAlpha(this.snakeB.color, 0.3));
  }

  init() {
    clearAll();
    colGrid.init(200, false);
    gravity = v2(0, 80);
    SelfCollisionsInterval = 1;
    setMapSize(v2(winSize.x, winSize.y));

    var thick = 40;
    var sh = mapSize.y - thick;

    var xDist = 200;
    var sw = 300;

    var stiff = 0.3;

    var me = new Snake(v2(xDist + sw, sh), v2(xDist, sh), getRandomColor(), thick);
    me.segments[me.segments.length - 1].setAnchor(null);
    me.control();
    me.stiffness = stiff;
    entities.push(me);
    this.snakeA = me;
    this.snakeAStart = this.snakeA.segments[0].pos;
    cam.setTarget(null);
    cam.center(v2(0, winSize.y * .8));

    var ennemy = new Snake(v2(mapSize.x - xDist - sw, sh), v2(mapSize.x - xDist, sh), getRandomColor(), thick);
    ennemy.segments[ennemy.segments.length - 1].setAnchor(null);
    entities.push(ennemy);
    ennemy.control2();
    ennemy.stiffness = stiff;
    this.snakeB = ennemy;
    this.snakeBStart = this.snakeB.segments[0].pos;

    var ball = Ball.instantiate(v2(winCenter.x, 100), v2(40, 40));
    ball.color = "rgba(249, 120, 0, 1)";
    this.ball = ball;

    var w = 20;
    var webSize = v2(this.basketSize.x, this.basketSize.y);

    var xDistFromHor = mapSize.x * 0.01;
    var yDistFromTop = mapSize.y * 0.4;
    var p0 = v2(xDistFromHor, yDistFromTop);
    var p1 = v2(mapSize.x - xDistFromHor - w, yDistFromTop);
    this.basketCenter0 = v2(p0.x + webSize.x / 2, p0.y + webSize.y / 2);
    this.basketCenter1 = v2(p1.x - webSize.x / 2, p1.y + webSize.y / 2);

    for (let i = 0; i < 2; i++) {
      var p = i === 0 ? p0 : p1;
      var clr = i === 0 ? this.snakeA.color : this.snakeB.color;
      var s = new Rectangle(p, v2(w, mapSize.y - yDistFromTop), clr);
      s.static = true;
      s.movable = false;
      shapes.push(s);

      var bx = i === 0 ? p.x + webSize.x : p.x - webSize.x;
      var bar = new Rectangle(v2(bx, p.y), v2(w, webSize.y), clr);
      bar.static = true;
      bar.movable = false;
      shapes.push(bar);

      var p = v2(p.x - (i === 1 ? webSize.x : 0), p.y + webSize.y);

      var barDown = new Rope(p, v2(p.x + webSize.x, p.y), clr, 4, 32, 4);
      ropes.push(barDown);

      //   var barDown = new Rectangle(p, v2(webSize.x, w), clr);
      //   shapes.push(barDown);
      //   barDown.static = true;
      //   barDown.movable = false;
      if (i === 0) this.barA = barDown;
      else this.barB = barDown;
    }
    this.active = true;
    this.resetGame(3);
  }
}
