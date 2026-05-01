class Minimap {
  constructor(pos, size) {
    this.pos = pos;
    this.size = size;
    this.shown = true;
    this.isHov = false;
    this.backgroundColor = "rgba(90, 47, 47, 0.4)";
    this.borderColor = "rgba(255, 255, 255, 0.96)";
  }

  render(_ctx = ctx) {
    if (!this.shown) return;

    this.isHov = pointInRect(mouse.pos, this.pos, this.size);
    if (this.isHov && mouse.pressed) {
      var p = sub_v2(mouse.pos, this.pos);
      p.x /= this.size.x;
      p.y /= this.size.y;
      p.x *= mapSize.x;
      p.y *= mapSize.y;
      cam.scroll = sub_v2(p, scale_v2(winSize, 0.5));
    }
    drawRect(this.pos.x, this.pos.y, this.size.x, this.size.y, this.backgroundColor, this.isHov ? this.borderColor : null, _ctx);

    const normX = (worldX) => clamp(worldX / mapSize.x, 0, 1);
    const normY = (worldY) => clamp(worldY / mapSize.y, 0, 1);

    // Ground strip: from ground level (bottom of world) to bottom of minimap
    const groundNY = normY(groundLevel);
    const groundY = this.pos.y + groundNY * this.size.y;
    const groundH = this.pos.y + this.size.y - groundY;
    if (groundH > 0) drawRect(this.pos.x, groundY, this.size.x, groundH, "rgba(50, 150, 50, 0.25)", "rgba(0,0,0,0.2)", _ctx);

    // Entities / shapes
    for (const s of shapes) {
      const px = this.pos.x + normX(s.pos.x) * this.size.x;
      const py = this.pos.y + normY(s.pos.y) * this.size.y;
      const clr = s.inScreen ? "red" : "grey";
      if (s.type === "SQUARE") {
        const size = mult_v2(s.size, v2(this.size.x / mapSize.x, this.size.y / mapSize.y));
        drawRect(px, py, size.x, size.y, clr, null, _ctx, s.angle);
      } else {
        const rad = (s.size.x * this.size.x) / mapSize.x;
        drawCircle2(_ctx, px + rad / 2, py + rad / 2, rad, clr, null);
      }
    }

    for (const e of entities) {
      if (e.segments !== undefined) {
        const head = e.segments[0];
        const tail = e.segments[e.segments.length - 1];
        const px = this.pos.x + normX(head.pos.x) * this.size.x;
        const py = this.pos.y + normY(head.pos.y) * this.size.y;
        const tpx = this.pos.x + normX(tail.pos.x) * this.size.x;
        const tpy = this.pos.y + normY(tail.pos.y) * this.size.y;
        var clr = e.inScreen ? e.color2 : "grey";
        drawLine(ctx, v2(px, py), v2(tpx, tpy), clr, 1);
        continue;
      }
      var pos = e.segments !== undefined ? e.segments[0].pos : e.pos;
      const px = this.pos.x + normX(pos.x) * this.size.x;
      const py = this.pos.y + normY(pos.y) * this.size.y;
      const dot = v2(4, 4);
      drawRect(px, py, dot.x, dot.y, e.color, null, _ctx);
    }

    // Ropes (head segment)
    for (const r of ropes) {
      const head = r.segments[0];
      const tail = r.segments[r.segments.length - 1];

      const px = this.pos.x + normX(head.pos.x) * this.size.x;
      const py = this.pos.y + normY(head.pos.y) * this.size.y;
      const tpx = this.pos.x + normX(tail.pos.x) * this.size.x;
      const tpy = this.pos.y + normY(tail.pos.y) * this.size.y;
      var clr = r.inScreen ? r.color2 : "grey";
      drawLine(ctx, v2(px, py), v2(tpx, tpy), clr, 1);
    }

    // Camera viewport rectangle relative to map bounds
    const viewNX = normX(cam.scroll.x);
    const viewNY = normY(cam.scroll.y);
    const viewNW = clamp(_canvas.width / mapSize.x, 0, 1) * this.size.x;
    const viewNH = clamp(_canvas.height / mapSize.y, 0, 1) * this.size.y;
    const viewX = this.pos.x + viewNX * this.size.x;
    const viewY = this.pos.y + viewNY * this.size.y;

    _ctx.lineWidth = 1;
    drawRect(viewX, viewY, viewNW, viewNH, "rgba(255, 255, 255, 0.07)", "white", _ctx);
    // drawText(_ctx, viewX + viewNW / 2, viewY + viewNH / 2, "CAMERA", "white", null, 8, true);
  }

  hide() {
    this.shown = false;
  }
  show() {
    this.shown = true;
  }
}
