class Mouse {
  constructor() {
    this.pos = new Vec2(window.innerWidth / 2, window.innerHeight / 2);
    this.pressed = false;
    this.clicked = false;
    this.delta = new Vec2(0, 0);
  }

  reset() {
    this.clicked = false;
    this.delta = new Vec2(0, 0);
  }
}

window.addEventListener("mousemove", (e) => {
  mouse.delta = new Vec2(mouse.pos.x - e.clientX, mouse.pos.y - e.clientY);
  mouse.pos.x = e.clientX;
  mouse.pos.y = e.clientY;
});
window.addEventListener("mousedown", (e) => {
  mouse.pressed = true;
  if (e.button !== 2) mouse.clicked = true;
});
window.addEventListener("mouseup", () => {
  mouse.pressed = false;
});

