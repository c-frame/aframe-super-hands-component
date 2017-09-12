/* global AFRAME, THREE */
const inherit = AFRAME.utils.extendDeep;
const buttonCore = require('buttons-proto.js');
AFRAME.registerComponent('stretchable', inherit({}, buttonCore, {
  schema: {
    usePhysics: {default: 'ifavailable'},
    invert: {default: false}
  },
  init: function () {
    this.STRETCHED_STATE = 'stretched';
    this.STRETCH_EVENT = 'stretch-start';
    this.UNSTRETCH_EVENT = 'stretch-end';
    this.stretched = false;
    this.stretchers = [];

    this.start = this.start.bind(this);
    this.end = this.end.bind(this);

    this.el.addEventListener(this.STRETCH_EVENT, this.start);
    this.el.addEventListener(this.UNSTRETCH_EVENT, this.end);
  },
  update: function (oldDat) {

  },
  tick: (function () {
    const scale = new THREE.Vector3();
    const handPos = new THREE.Vector3();
    const otherHandPos = new THREE.Vector3();
    return function () {
      if (!this.stretched) { return; }
      scale.copy(this.el.getAttribute('scale'));
      handPos.copy(this.stretchers[0].getAttribute('position'));
      otherHandPos.copy(this.stretchers[1].getAttribute('position'));
      const currentStretch = handPos.distanceTo(otherHandPos);
      let deltaStretch = 1;
      if (this.previousStretch !== null && currentStretch !== 0) {
        deltaStretch = Math.pow(
            currentStretch / this.previousStretch,
            (this.data.invert)
              ? -1
              : 1
        );
      }
      this.previousStretch = currentStretch;
      scale.multiplyScalar(deltaStretch);
      this.el.setAttribute('scale', scale);
      // force scale update for physics body
      if (this.el.body && this.data.usePhysics !== 'never') {
        var physicsShape = this.el.body.shapes[0];
        if (physicsShape.halfExtents) {
          physicsShape.halfExtents
              .scale(deltaStretch, physicsShape.halfExtents);
          physicsShape.updateConvexPolyhedronRepresentation();
        } else if (physicsShape.radius) {
          physicsShape.radius *= deltaStretch;
          physicsShape.updateBoundingSphereRadius();
        // This doesn't update the cone size - can't find right update function
        // } else if (physicsShape.radiusTop && physicsShape.radiusBottom &&
        //     physicsShape.height) {
        //   physicsShape.height *= deltaStretch;
        //   physicsShape.radiusTop *= deltaStretch;
        //   physicsShape.radiusBottom *= deltaStretch;
        //   physicsShape.updateBoundingSphereRadius();
        } else if (!this.shapeWarned) {
          console.warn('Unable to stretch physics body: unsupported shape');
          this.shapeWarned = true;
          // todo: suport more shapes
        }
        this.el.body.updateBoundingRadius();
      }
    };
  })(),
  remove: function () {
    this.el.removeEventListener(this.STRETCH_EVENT, this.start);
    this.el.removeEventListener(this.UNSTRETCH_EVENT, this.end);
  },
  start: function (evt) {
    if (this.stretched || this.stretchers.includes(evt.detail.hand) ||
        !this.startButtonOk(evt)) {
      return;
    } // already stretched or already captured this hand or wrong button
    this.stretchers.push(evt.detail.hand);
    if (this.stretchers.length === 2) {
      this.stretched = true;
      this.previousStretch = null;
      this.el.addState(this.STRETCHED_STATE);
    }
    if (evt.preventDefault) { evt.preventDefault(); } // gesture accepted
  },
  end: function (evt) {
    var stretcherIndex = this.stretchers.indexOf(evt.detail.hand);
    if (!this.endButtonOk(evt)) { return; }
    if (stretcherIndex !== -1) {
      this.stretchers.splice(stretcherIndex, 1);
      this.stretched = false;
      this.el.removeState(this.STRETCHED_STATE);
    }
    if (evt.preventDefault) { evt.preventDefault(); }
  }
}));
