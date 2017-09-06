/* global AFRAME, THREE */
const physicsCore = require('./physics-grab-proto.js');
AFRAME.registerComponent('grabbable', AFRAME.utils.extendDeep({}, physicsCore, {
  schema: {
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
    this.previousPositionIsValid = false;
    this.physicsInit();

    this.el.addEventListener(this.GRAB_EVENT, e => this.start(e));
    this.el.addEventListener(this.UNGRAB_EVENT, e => this.end(e));
    this.el.addEventListener('mouseout', e => this.lostGrabber(e));
  },
  update: function (oldDat) {
    this.physicsUpdate();
    this.xFactor = (this.data.invert) ? -1 : 1;
    this.zFactor = (this.data.invert) ? -1 : 1;
    this.yFactor = ((this.data.invert) ? -1 : 1) * !this.data.suppressY;
  },
  tick: (function () {
    // peristent objs for improved garbage collection and aframe type checking
    const handPositionV3 = new THREE.Vector3();
    const previousPositionV3 = new THREE.Vector3();
    const destPosition = {x: 0, y: 0, z: 0};
    return function () {
      if (this.grabber && !this.physicsIsGrabbing() &&
          this.data.usePhysics !== 'only') {
        if (this.grabber.object3D) {
          this.grabber.object3D.getWorldPosition(handPositionV3);
        } else {
          handPositionV3.copy(this.grabber.getAttribute('position'));
        }
        if (this.previousPositionIsValid) {
          const position = this.el.getAttribute('position');
          destPosition.x = position.x +
              (handPositionV3.x - previousPositionV3.x) * this.xFactor;
          destPosition.y = position.y +
              (handPositionV3.y - previousPositionV3.y) * this.yFactor;
          destPosition.z = position.z +
              (handPositionV3.z - previousPositionV3.z) * this.zFactor;
          this.el.setAttribute('position', destPosition);
        } else {
          this.previousPositionIsValid = true;
        }
        previousPositionV3.copy(handPositionV3);
      }
    };
  })(),
  remove: function () {
    this.el.removeEventListener(this.GRAB_EVENT, this.start);
    this.el.removeEventListener(this.UNGRAB_EVENT, this.end);
    this.physicsRemove();
  },
  start: function (evt) {
    // room for more grabbers?
    const grabAvailable = !Number.isFinite(this.data.maxGrabbers) ||
        this.grabbers.length < this.data.maxGrabbers;

    if (this.grabbers.indexOf(evt.detail.hand) === -1 && grabAvailable) {
      this.grabbers.push(evt.detail.hand);
      // initiate physics if available
      if (!this.physicsStart(evt) && !this.grabber) {
        // otherwise, initiate manual grab if first grabber
        this.grabber = evt.detail.hand;
        this.previousPositionIsValid = false;
      }
      // notify super-hands that the gesture was accepted
      if (evt.preventDefault) { evt.preventDefault(); }
      this.grabbed = true;
      this.el.addState(this.GRABBED_STATE);
    }
  },
  end: function (evt) {
    const handIndex = this.grabbers.indexOf(evt.detail.hand);
    if (handIndex !== -1) {
      this.grabbers.splice(handIndex, 1);
      this.grabber = this.grabbers[0];
      this.previousPositionIsValid = false;
    }
    this.physicsEnd(evt);
    if (!this.grabber) {
      this.grabbed = false;
      this.el.removeState(this.GRABBED_STATE);
    }
  },
  lostGrabber: function (evt) {
    let i = this.grabbers.indexOf(evt.relatedTarget);
    // if a queued, non-physics grabber leaves the collision zone, forget it
    if (i !== -1 && evt.relatedTarget !== this.grabber &&
        !this.physicsIsConstrained(evt.relatedTarget)) {
      this.grabbers.splice(i, 1);
    }
  }
}));
