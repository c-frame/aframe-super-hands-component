AFRAME.registerComponent('locomotor', {
  schema: { 
    restrictY: {default: true}
  },
  init: function () {
    this.MOVE_STATE = 'moving';
    this.MOVE_EVENT = 'grab-start';
    this.STOP_EVENT = 'grab-end';
    this.mover = null;
    
    this.start = this.start.bind(this);
    this.end = this.end.bind(this);
    
    this.el.addEventListener(this.MOVE_EVENT, this.start);
    this.el.addEventListener(this.STOP_EVENT, this.end);
  },
  update: function (oldDat) {
  },
  tick: function() {
    if(this.mover) {
      var handPosition = this.mover.getAttribute('position'),
        previousPosition = this.previousPosition || handPosition,
        deltaPosition = {
          x: handPosition.x - previousPosition.x,
          y: handPosition.y - previousPosition.y,
          z: handPosition.z - previousPosition.z
        }, position = this.el.getAttribute('position');
      // subtract delta to invert movement
      this.el.setAttribute('position', {
        x: position.x - deltaPosition.x,
        y: position.y - deltaPosition.y * !this.data.restrictY,
        z: position.z - deltaPosition.z
      });
      this.previousPosition = handPosition;
    }
  },
  remove: function () {
    this.el.removeEventListener(this.MOVE_EVENT, this.start);
    this.el.removeEventListener(this.STOP_EVENT, this.end);
  },
  start: function(evt) {
    this.mover = evt.detail.hand;
    this.previousPosition = null;
  },
  end: function (evt) {
    this.mover = null;
  }
});