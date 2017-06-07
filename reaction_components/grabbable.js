AFRAME.registerComponent('grabbable', {
  schema: { 
    usePhysics: {default: 'ifavailable'},
    maxGrabbers: {type: 'int', default: NaN}
  },
  init: function () {
    this.GRABBED_STATE = 'grabbed';
    this.GRAB_EVENT = 'grab-start';
    this.UNGRAB_EVENT = 'grab-end';
    this.grabbed = false;
    this.grabbers = [];
    this.constraints = new Map();
    
    this.start = this.start.bind(this);
    this.end = this.end.bind(this);
    
    this.el.addEventListener(this.GRAB_EVENT, this.start);
    this.el.addEventListener(this.UNGRAB_EVENT, this.end);
  },
  update: function (oldDat) {
    if(this.data.usePhysics === 'never' && this.constraints.size) {
      this.clearConstraints();
    }
  },
  tick: function() {
    if(this.grabber && !this.constraints.size && 
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
  remove: function () {
    this.el.removeEventListener(this.GRAB_EVENT, this.start);
    this.el.removeEventListener(this.UNGRAB_EVENT, this.end);
    this.clearConstraints();
  },
  start: function(evt) {
    let grabInitiated = false;
    if (this.grabbers.indexOf(evt.detail.hand) === -1 &&
        (!Number.isFinite(this.data.maxGrabbers) || this.grabbers.length < this.data.maxGrabbers)) {
      this.grabbers.push(evt.detail.hand);
      this.el.addEventListener('mouseout', e => this.lostGrabber(e));
    }
    // initiate physics constraint if available and not already existing
    if(this.data.usePhysics !== 'never' && this.el.body && 
       evt.detail.hand.body && !this.constraints.has(evt.detail.hand) &&
       (!Number.isFinite(this.data.maxGrabbers) || this.constraints.size < this.data.maxGrabbers)) {
      let newCon = new window.CANNON
        .LockConstraint(this.el.body, evt.detail.hand.body);
      this.el.body.world.addConstraint(newCon);
      this.constraints.set(evt.detail.hand, newCon);
      grabInitiated = true;
    } else if (!this.grabber) { // otherwise, initiate manual grab if first grabber
      // notify super-hands that the gesture was accepted
      if (evt.preventDefault) { evt.preventDefault(); }
      this.grabber = evt.detail.hand;
      this.previousPosition = null;
      grabInitiated = true;
    } 
    if (grabInitiated) {
      // notify super-hands that the gesture was accepted
      if (evt.preventDefault) { evt.preventDefault(); }
      this.grabbed = true;
      this.el.addState(this.GRABBED_STATE);
    }
  },
  end: function (evt) {
    var handIndex = this.grabbers.indexOf(evt.detail.hand),
        constraint = this.constraints.get(evt.detail.hand),
        nextGrabber;
    if(handIndex !== -1) { this.grabbers.splice(handIndex, 1); }
    this.grabber = null;
    if (constraint) {
      this.el.body.world.removeConstraint(constraint);
      this.constraints.delete(evt.detail.hand);
    }
    nextGrabber = this.grabbers[0];
    // refresh super-hands grab for manual (no physics) grabs
    if (nextGrabber && !this.constraints.has(nextGrabber)) {
      if (nextGrabber.components['super-hands']) {
        nextGrabber.components['super-hands'].updateGrabbed();
      }
    } else {
      this.grabbed = false;
      this.el.removeState(this.GRABBED_STATE);
    }
  },
  clearConstraints: function () {
    if (this.el.body) {
      for(let c of this.constraints.values()) {
        this.el.body.world.removeConstraint(c);
      }
    }
    this.constraints.clear();
  },
  lostGrabber: function (evt) {
    let i = this.grabbers.indexOf(evt.relatedTarget);
    // if a queued, non-physics grabber leaves the collision zone, forget it
    if (i !== -1 && !this.constraints.has(evt.relatedTarget)) {
      this.grabbers.splice(i, 1);
    }
  }
});