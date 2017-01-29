AFRAME.registerComponent('grabbable', {
  schema: { 
    usePhysics: { default: 'ifavailable' },
  },
  init: function () {
    this.GRABBED_STATE = 'grabbed';
    this.GRAB_EVENT = 'grab-start';
    this.UNGRAB_EVENT = 'grab-end';
    this.constraint = null;
    this.grabbed = false;
    
    // wrappers as event handlers so that the inner func can be spied on
    this.startB = evt => this.start(evt);
    this.endB = evt => this.end(evt);
  },
  update: function (oldDat) {
    if(this.data.usePhysics === 'never' && this.constraint) {
      this.physics.world.removeConstraint(this.constraint);
      this.constraint = null;
    }
  },
  tick: function() {
    if(this.grabbed && !this.constraint && 
       this.data.usePhysics !== 'only') {
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
    this.el.removeEventListener(this.GRAB_EVENT, this.startB);
    this.el.removeEventListener(this.UNGRAB_EVENT, this.endB);
  },
  play: function () {
    
    this.el.addEventListener(this.GRAB_EVENT, this.startB);
    this.el.addEventListener(this.UNGRAB_EVENT, this.endB);
    console.log("from grabbable.play: grabbable event listeners registered");
  },
  start: function(evt) {
    console.log("grabbable handler was called");
    if (this.grabbed) { return; } //already grabbed
    this.grabber = evt.detail.hand;
    this.grabbed = true;
    this.el.addState(this.GRABBED_STATE);
    if(this.data.usePhysics !== 'never' && this.el.body && 
       this.grabber.body) {
      this.constraint = new window.CANNON
        .LockConstraint(this.el.body, this.grabber.body);
      this.el.body.world.addConstraint(this.constraint);
    } else if(this.data.usePhysics !== 'only') {
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