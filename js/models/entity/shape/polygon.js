class Polygon extends Shape {
  constructor(vertices, color, curveType = "sine", wobbleAmount = 1, z = 10) {
    super(vertices[0], v2(20, 20), color);
    this.vertices = vertices;
    this.z = z;
    this.baseVertices = vertices.map((v) => v2(v.x, v.y));
    this.angles = [];
    this.wobbleAmount = wobbleAmount;
    for (let i = 0; i < vertices.length; i++) {
      this.angles.push(r_range(-Math.PI, Math.PI));
    }
    this.curveType = curveType;
    this.color = color;
    this.static = true;
  }

  update() {
    if (!this.static) {
      if (!this.grounded) this.vel.y += 0.1;
      for (let i = 0; i < this.vertices.length; i++) {
        var newP = add_v2(this.vertices[i], this.vel);
        var clampedP = clamp_v2(newP, mapSize);
        this.grounded = newP.y != clampedP.y;
        this.baseVertices[i] = clampedP;
        this.vertices[i] = clampedP;
      }
    } else if (this.wobbleAmount) {
      for (let i = 1; i < this.vertices.length - 1; i++) {
        var wobbleFactor = Math.sin((frame + i * 100) * 0.05) * this.wobbleAmount;

        let ang = this.angles[i];
        var offset = v2(Math.cos(ang) * wobbleFactor, Math.sin(ang) * wobbleFactor);
        offset.x = 0;
        this.vertices[i] = add_v2(this.baseVertices[i], offset);
      }
    }
  }

  render() {
    const frequency = 3;
    const amplitude = 8;
    ctx.fillStyle = this.color;
    ctx.beginPath();

    ctx.moveTo(px(this.vertices[0].x, this.z), sy(this.vertices[0].y));

    for (let i = 0; i < this.vertices.length; i++) {
      const a = this.vertices[i];
      const b = this.vertices[(i + 1) % this.vertices.length];

      if (this.curveType !== "sine") {
        ctx.lineTo(px(b.x, this.z), sy(b.y));
        continue;
      }
      const segments = 16;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      const nx = -dy / len;
      const ny = dx / len;
      const amplitude = 10;
      if (this.curveType === "sine") {
        for (let i = 0; i < this.vertices.length; i++) {
          const a = this.vertices[i];
          const b = this.vertices[(i + 1) % this.vertices.length];

          const midX = (a.x + b.x) / 2;
          const midY = (a.y + b.y) / 2;

          ctx.quadraticCurveTo(px(a.x, this.z), sy(a.y), px(midX, this.z), sy(midY));
        }
      } else {
        for (let i = 0; i < this.vertices.length; i++) {
          const b = this.vertices[(i + 1) % this.vertices.length];
          ctx.lineTo(px(b.x, this.z), sy(b.y));
        }
      }
    }
    ctx.closePath();
    ctx.fill();
  }
  static instantiate(vertices = [rand_v2(), rand_v2(), rand_v2(), rand_v2()], color = getRandomColor(), isBackground = false, wobbleAmount = 1, curveType = "sine", z = 1) {
    var polygon = new Polygon(vertices, color, curveType, wobbleAmount, z);
    polygons.push(polygon);
    if (isBackground) backgroundElements.push(polygon);
    else frontPolygons.push(polygon);
    return polygon;
  }
}

function makeHill(x, y, w, h, color = "rgb(48, 33, 78)") {
  return Polygon.instantiate([v2(x, y), v2(x + w * 0.25, y - h), v2(x + w * 0.6, y - h * 0.7), v2(x + w, y)], color, false, 2, "sine", 2);
}

function makeCrystal(x, y, s, color = "rgb(80, 220, 255)") {
  return Polygon.instantiate([v2(x, y), v2(x + s * 0.4, y - s * 1.5), v2(x + s, y), v2(x + s * 0.5, y + s * 0.35)], color, false, 0.4, "line", 0.5);
}

function makeSlimeBlob(x, y, w, h, color = "rgb(80, 190, 90)") {
  return Polygon.instantiate([v2(x, y), v2(x + w * 0.2, y - h * 0.7), v2(x + w * 0.55, y - h), v2(x + w * 0.9, y - h * 0.5), v2(x + w, y), v2(x + w * 0.55, y + h * 0.2)], color, false, 5, "sine", 1);
}

function makeSpikeCluster(x, y, w, h, color = "rgb(230, 230, 180)") {
  const verts = [v2(x, y)];
  for (let i = 0; i < 6; i++) {
    const px = x + (i / 5) * w;
    verts.push(v2(px, y - h * r_range(0.4, 1.2)));
    verts.push(v2(px + w / 10, y));
  }
  const p = Polygon.instantiate(verts, color, false, 0, "line", 0.3);
  p.static = true;
  return p;
}

function makeFallingRock(x, y, s, color = "rgb(90, 82, 78)") {
  const p = Polygon.instantiate([v2(x, y), v2(x + s * 0.8, y - s * 0.2), v2(x + s, y + s * 0.6), v2(x + s * 0.3, y + s), v2(x - s * 0.2, y + s * 0.4)], color, false, 0, "line", 0);
  p.static = false;
  return p;
}

function makeSeaweed(x, y, h, color = "rgb(40, 160, 100)") {
  return Polygon.instantiate([v2(x, y), v2(x + 18, y - h * 0.3), v2(x - 10, y - h * 0.6), v2(x + 14, y - h), v2(x + 30, y), v2(x + 12, y + 12)], color, false, 8, "sine", 0.2);
}

function makeFloatingLeaf(x, y, w, h, color = "rgb(180, 190, 70)") {
  const p = Polygon.instantiate([v2(x, y), v2(x + w * 0.5, y - h), v2(x + w, y), v2(x + w * 0.5, y + h * 0.3)], color, false, 3, "sine", 0.4);
  p.static = false;
  p.vel = v2(r_range(-0.4, 0.4), r_range(-0.2, 0.2));
  return p;
}

function makeArch(x, y, w, h, t = 40, color = "rgb(70, 58, 90)") {
  return Polygon.instantiate(
    [
      v2(x, y),
      v2(x + w * 0.2, y - h),
      v2(x + w * 0.5, y - h - t),
      v2(x + w * 0.8, y - h),
      v2(x + w, y),
      v2(x + w - t, y),
      v2(x + w * 0.75, y - h + t),
      v2(x + w * 0.5, y - h),
      v2(x + w * 0.25, y - h + t),
      v2(x + t, y),
    ],
    color,
    false,
    1,
    "sine",
    1,
  );
}

function makeMushroomCap(x, y, w, h, color = "rgb(190, 50, 90)") {
  return Polygon.instantiate(
    [v2(x, y), v2(x + w * 0.15, y - h * 0.75), v2(x + w * 0.5, y - h), v2(x + w * 0.85, y - h * 0.75), v2(x + w, y), v2(x + w * 0.7, y + h * 0.2), v2(x + w * 0.3, y + h * 0.2)],
    color,
    false,
    2,
    "sine",
    0.5,
  );
}

function makeHangingVine(x, y, h, color = "rgb(60, 130, 55)") {
  return Polygon.instantiate(
    [v2(x, y), v2(x + 12, y + h * 0.25), v2(x - 8, y + h * 0.5), v2(x + 16, y + h * 0.75), v2(x, y + h), v2(x - 16, y + h * 0.75), v2(x + 4, y + h * 0.5), v2(x - 12, y + h * 0.25)],
    color,
    false,
    6,
    "sine",
    0.7,
  );
}
