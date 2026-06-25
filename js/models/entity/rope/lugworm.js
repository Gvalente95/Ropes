class Lugworm extends RopeEntity {
  constructor(pos, _segAmount = 80, _segSpace = 5) {
    super(pos, pos, getRandomColor(), 2, _segAmount, _segSpace);
    this.pos = this.segments[0].pos;
    this.vel = v2(r_range(-5, 5), r_range(-5, 5));
    this.type = "LUGWORM";
    this.maxVel = v2(8, 8);
    this.steerFactor = v2(5, 4);
    this.steerSpeed = mult_v2(this.maxVel, this.steerFactor);
    this.steerChance = 2;
    this.gravity = v2(0, -20);
  }

  update() {
    this.pos = this.segments[0].pos;
    var newP = this.steerAgent();
    this.segments[0].pos = newP;
    super.update();
  }
  static instantiate(pos) {
    var lugworm = new Lugworm(pos);
    entities.push(lugworm);
    return lugworm;
  }
}
