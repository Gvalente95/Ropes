class CinematicManager {
  constructor() {
    this.active = false;
    this.onStart = null;
    this.onUpdate = null;
    this.onEnd = null;
    this.startTime = 0;
    this.endTime = 0;
  }
  create = (onUpdate, duration, delay = 0, onStart = null, onEnd = null) => {
    const now = performance.now();
    this.startTime = now + delay;
    this.endTime = this.startTime + duration;
    setTimeout(() => {
      this.start(onUpdate, onStart, onEnd);
    }, delay);
    setTimeout(() => {
      this.stop();
    }, delay + duration);
  };

  start = (onUpdate, onStart, onEnd) => {
    if (this.active) return;
    this.active = true;
    this.onUpdate = onUpdate;
    this.onStart = onStart;
    this.onEnd = onEnd;
    if (this.onStart) this.onStart();
  };

  stop = () => {
    if (this.onEnd) this.onEnd();
    this.active = false;
    this.onEnd = this.onUpdate = this.onStart = null;
    this.startTime = this.endTime = 0;
  };
  play = () => {
    if (this.onUpdate) this.onUpdate();
  };
}
