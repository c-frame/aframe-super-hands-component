AFRAME.registerComponent('grabbable', {
  schema: { 
    grabEvent: { default: 'super-hands-grab' },
    releaseEvent: { default: 'super-hands-release' },
    usePhysics: { default: 'auto' },
  },
  init: function () {
    this.GRABBED_STATE = 'grabbed';
    this.constraint = null;
    this.grabbed = false;
    
    this.start = this.start.bind(this);
    this.end = this.end.bind(this);
  },
  update: function (oldDat) {
    // TODO: handle change in event name
    
    if(this.data.usePhysics === 'false' && this.constraint) {
      this.physics.world.removeConstraint(this.constraint);
      this.constraint = null;
    }
  },
  tick: function() {
    if(this.grabbed && !this.constraint) {
      var handPosition = this.grabber.getAttribute('position'),
        previousPosition = this.previousPosition || handPosition,
        deltaPosition = {
          x: handPosition.x - previousPosition.x,
          y: handPosition.y - previousPosition.y,
          z: handPosition.z - previousPosition.z
        },
        position = this.el.getAttribute('position');
      
      this.previousPosition = handPosition;
      this.el.setAttribute('position', {
        x: position.x + deltaPosition.x,
        y: position.y + deltaPosition.y,
        z: position.z + deltaPosition.z
      });
    }
  },
  pause: function () {
    this.el.removeEventListener(this.data.grabEvent, this.start);
    this.el.removeEventListener(this.data.releaseEvent, this.end);
  },
  play: function () {
    this.el.addEventListener(this.data.grabEvent, this.start);
    this.el.addEventListener(this.data.releaseEvent, this.end);
  },
  start: function(evt) {
    if (this.grabbed) { return; } //already grabbed
    this.grabber = evt.detail.hand;
    this.grabbed = true;
    this.el.addState(this.GRABBED_STATE);
    if(this.data.usePhysics !== 'false' && this.el.body && 
       this.grabber.body) {
      this.constraint = new window.CANNON
        .LockConstraint(this.el.body, this.grabber.body);
      this.el.body.world.addConstraint(this.constraint);
    } else if(this.data.usePhysics !== 'true') {
      this.previousPosition = null;
    }
  },
  end: function (evt) {
    if(evt.detail.hand !== this.grabber) { return; }
    if(this.constraint) {
      this.el.body.world.removeConstraint(this.constraint);
      this.constraint = null;
    }
    this.grabber = null;
    this.grabbed = false;
    this.el.removeState(this.GRABBED_STATE);
  } 
});