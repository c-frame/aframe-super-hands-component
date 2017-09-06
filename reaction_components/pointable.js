/* global AFRAME, THREE */
const physicsCore = require('./physics-grab-proto.js');
AFRAME.registerComponent('pointable', AFRAME.utils.extendDeep({}, physicsCore, {
  schema: {
    maxGrabbers: {type: 'int', default: NaN}
  },
  init: function () {
    this.GRABBED_STATE = 'grabbed';
    this.GRAB_EVENT = 'grab-start';
    this.UNGRAB_EVENT = 'grab-end';
    this.grabbed = false;
    this.grabbers = [];
    this.constraints = new Map();
    this.deltaPositionIsValid = false;
    this.grabDistance = undefined;
    this.grabDirection = {x: 0, y: 0, z: -1};
    this.grabOffset = {x: 0, y: 0, z: 0};
    this.physicsInit();

    this.el.addEventListener(this.GRAB_EVENT, e => this.start(e));
    this.el.addEventListener(this.UNGRAB_EVENT, e => this.end(e));
    this.el.addEventListener('mouseout', e => this.lostGrabber(e));
  },
  update: function () {
    this.physicsUpdate();
  },
  tick: (function () {
    const deltaPosition = new THREE.Vector3();
    const targetPosition = new THREE.Vector3();
    const destPosition = {x: 0, y: 0, z: 0};
    return function () {
      var entityPosition;
      if (this.grabber) {
        // reflect on z-axis to point in same direction as the laser
        // targetPosition.set(0, 0, -1);
        targetPosition.copy(this.grabDirection);
        targetPosition
            .applyQuaternion(this.grabber.object3D.getWorldQuaternion())
            .setLength(this.grabDistance)
            .add(this.grabber.object3D.getWorldPosition())
            .add(this.grabOffset);
        if (this.deltaPositionIsValid) {
          // relative position changes work better with nested entities
          deltaPosition.sub(targetPosition);
          entityPosition = this.el.getAttribute('position');
          destPosition.x = entityPosition.x - deltaPosition.x;
          destPosition.y = entityPosition.y - deltaPosition.y;
          destPosition.z = entityPosition.z - deltaPosition.z;
          this.el.setAttribute('position', destPosition);
        } else {
          this.deltaPositionIsValid = true;
        }
        deltaPosition.copy(targetPosition);
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
      if (!evt.detail.hand.object3D) {
        console.warn('pointable entities must have an object3D');
        return;
      }
      this.grabbers.push(evt.detail.hand);
      // initiate physics if available, otherwise manual
      if (!this.physicsStart(evt) && !this.grabber) {
        this.grabber = evt.detail.hand;
        this.resetGrabber();
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
    }
    this.physicsEnd(evt);
    if (!this.resetGrabber()) {
      this.grabbed = false;
      this.el.removeState(this.GRABBED_STATE);
    }
  },
  resetGrabber: function () {
    let raycaster;
    if (!this.grabber) {
      return false;
    }
    raycaster = this.grabber.getAttribute('raycaster');
    this.deltaPositionIsValid = false;
    this.grabDistance = this.el.object3D.getWorldPosition()
        .distanceTo(this.grabber.object3D.getWorldPosition());
    if (raycaster) {
      this.grabDirection = raycaster.direction;
      this.grabOffset = raycaster.origin;
    }
    return true;
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
