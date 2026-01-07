class Input {
  constructor() {
    this.keys = {};
    this.codeClicked = null;
    this.lastKey = null;
    this.keyClicked = null;
    this.wasd = new Vec2(0, 0);
    this.arrows = new Vec2(0, 0);
  }

  update() {
    this.wasd.x = (this.keys["d"] === true) - (this.keys["a"] === true);
    this.wasd.y = (this.keys["s"] === true) - (this.keys["w"] === true);
    this.arrows.x = (this.keys["arrowright"] === true) - (this.keys["arrowleft"] === true);
    this.arrows.y = (this.keys["arrowdown"] === true) - (this.keys["arrowup"] === true);
  }
  reset() {
    this.keyClicked = null;
    this.codeClicked = null;
  }
}

window.addEventListener("keydown", (e) => {
  var ek = e.key.toLowerCase();
  input.lastKey = ek;
  var prevent = [" ", "arrowleft", "arrowright", "arrowup", "arrowdown", "tab"];
  if (prevent.includes(ek)) e.preventDefault();
  input.keys[ek] = true;
  input.keyClicked = ek;
  input.codeClicked = e.code;
  input.update();
});
window.addEventListener("keyup", (e) => {
  var ek = e.key.toLowerCase();
  input.keys[ek] = false;
  input.update();
});
