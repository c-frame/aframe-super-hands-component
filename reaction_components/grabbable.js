/* global AFRAME */
AFRAME.registerComponent('grabbable', {
  schema: {
    usePhysics: {default: 'ifavailable'},
    maxGrabbers: {type: 'int', default: NaN},
    invert: {default: false},
    suppressY: {default: false}
  },
  init: function () {
    this.GRABBED_STATE = 'grabbed';
    this.GRAB_EVENT = 'grab-start';
    this.UNGRAB_EVENT = 'grab-end';
    this.grabbed = false;
    this.grabbers = [];
    this.constraints = new Map();

    this.el.addEventListener(this.GRAB_EVENT, e => this.start(e));
    this.el.addEventListener(this.UNGRAB_EVENT, e => this.end(e));
    this.el.addEventListener('mouseout', e => this.lostGrabber(e));
  },
  update: function (oldDat) {
    if (this.data.usePhysics === 'never' && this.constraints.size) {
      this.clearConstraints();
    }
    this.xFactor = (this.data.invert) ? -1 : 1;
    this.zFactor = (this.data.invert) ? -1 : 1;
    this.yFactor = ((this.data.invert) ? -1 : 1) * !this.data.suppressY;
  },
  tick: function () {
    if (this.grabber && !this.constraints.size &&
       this.data.usePhysics !== 'only') {
      const handPosition = (this.grabber.object3D)
          ? this.grabber.object3D.getWorldPosition()
          : this.grabber.getAttribute('position');
      const previousPosition = this.previousPosition || handPosition;
      const deltaPosition = {
        x: handPosition.x - previousPosition.x,
        y: handPosition.y - previousPosition.y,
        z: handPosition.z - previousPosition.z
      };
      const position = this.el.getAttribute('position');
      this.previousPosition = handPosition;
      this.el.setAttribute('position', {
        x: position.x + deltaPosition.x * this.xFactor,
        y: position.y + deltaPosition.y * this.yFactor,
        z: position.z + deltaPosition.z * this.zFactor
      });
    }
  },
  remove: function () {
    this.el.removeEventListener(this.GRAB_EVENT, this.start);
    this.el.removeEventListener(this.UNGRAB_EVENT, this.end);
    this.clearConstraints();
  },
  start: function (evt) {
    // room for more grabbers?
    const grabAvailable = !Number.isFinite(this.data.maxGrabbers) ||
        this.grabbers.length < this.data.maxGrabbers;

    if (this.grabbers.indexOf(evt.detail.hand) === -1 && grabAvailable) {
      this.grabbers.push(evt.detail.hand);
      // initiate physics constraint if available and not already existing
      if (this.data.usePhysics !== 'never' && this.el.body &&
          evt.detail.hand.body && !this.constraints.has(evt.detail.hand)) {
        let newCon;
        if (this.grabbers.length > 1) {
          newCon = new window.CANNON.DistanceConstraint(
            this.el.body,
            evt.detail.hand.body
          );
        } else {
          newCon = new window.CANNON.LockConstraint(
            this.el.body, evt.detail.hand.body
          );
        }
        this.el.body.world.addConstraint(newCon);
        this.constraints.set(evt.detail.hand, newCon);
      } else if (!this.grabber) {
        // otherwise, initiate manual grab if first grabber
        this.grabber = evt.detail.hand;
        this.previousPosition = null;
      }
      // notify super-hands that the gesture was accepted
      if (evt.preventDefault) { evt.preventDefault(); }
      this.grabbed = true;
      this.el.addState(this.GRABBED_STATE);
    }
  },
  end: function (evt) {
    const handIndex = this.grabbers.indexOf(evt.detail.hand);
    let constraint = this.constraints.get(evt.detail.hand);
    if (handIndex !== -1) {
      this.grabbers.splice(handIndex, 1);
      this.grabber = this.grabbers[0];
      this.previousPosition = null;
    }
    if (constraint) {
      this.el.body.world.removeConstraint(constraint);
      this.constraints.delete(evt.detail.hand);
    }
    if (!this.grabber) {
      this.grabbed = false;
      this.el.removeState(this.GRABBED_STATE);
    }
  },
  clearConstraints: function () {
    if (this.el.body) {
      for (let c of this.constraints.values()) {
        this.el.body.world.removeConstraint(c);
      }
    }
    this.constraints.clear();
  },
  lostGrabber: function (evt) {
    let i = this.grabbers.indexOf(evt.relatedTarget);
    // if a queued, non-physics grabber leaves the collision zone, forget it
    if (i !== -1 && evt.relatedTarget !== this.grabber &&
        !this.constraints.has(evt.relatedTarget)) {
      this.grabbers.splice(i, 1);
    }
  }
});
