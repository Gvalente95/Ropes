class Mouse {
  constructor() {
    this.pos = v2(window.innerWidth / 2, window.innerHeight / 2);
    this.world = v2(window.innerWidth / 2, window.innerHeight / 2);
    this.screen = v2(window.innerWidth / 2, window.innerHeight / 2);
    this.wheel = v2(0, 0);
    this.wheelDelta = v2(0, 0);
    this.pressed = false;
    this.clicked = false;
    this.delta = v2(0, 0);
  }

  setPos(x = this.pos.x, y = this.pos.y) {
    this.delta = v2(this.pos.x - x, this.pos.y - y);
    this.pos = v2(x, y);
    this.world = toWorld(x, y);
    this.screen = toScrn(x, y);
  }

  reset() {
    this.clicked = false;
    this.delta = v2(0, 0);
    this.wheel = v2(0, 0);
    this.wheelDelta = v2(0, 0);
  }
}

window.addEventListener("mousemove", (e) => {
  mouse.setPos(e.clientX, e.clientY);
});
window.addEventListener("mousedown", (e) => {
  mouse.pressed = true;
  if (e.button !== 2) mouse.clicked = true;
});
window.addEventListener("mouseup", () => {
  mouse.pressed = false;
});

window.addEventListener("wheel", (e) => {
  // e.preventDefault();
  mouse.wheel = v2(e.deltaX, e.deltaY);
  mouse.wheelDelta = v2(e.deltaX, e.deltaY);
});

window.addEventListener(
  "touchmove",
  (e) => {
    e.preventDefault();
  },
  { passive: false }
);
