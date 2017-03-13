AFRAME.registerComponent('stretchable', {
  schema: { 
    usePhysics: { default: 'ifavailable' },
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
  tick: function() {
    if (!this.stretched) { return; }
    var scale = new THREE.Vector3().copy(this.el.getAttribute('scale')),
      myGeom = this.el.getAttribute('geometry'),
      handPos = new THREE.Vector3()
        .copy(this.stretchers[0].getAttribute('position')),
      otherHandPos = new THREE.Vector3()
        .copy(this.stretchers[1].getAttribute('position')),
      currentStretch = handPos.distanceTo(otherHandPos),
      deltaStretch = 1;
    if (this.previousStretch !== null && currentStretch !== 0) {
      deltaStretch = currentStretch / this.previousStretch;
    }
    this.previousStretch = currentStretch;
    scale = scale.multiplyScalar(deltaStretch);
    this.el.setAttribute('scale', scale);
    // force scale update for physics body
    if (this.el.body && this.data.usePhysics !== 'never') {
      var physicsShape = this.el.body.shapes[0];
      if(physicsShape.halfExtents) {
       physicsShape.halfExtents.scale(deltaStretch, 
                                      physicsShape.halfExtents);
        physicsShape.updateConvexPolyhedronRepresentation();
      } else { 
        if(!this.shapeWarned) {
          console.warn("Unable to stretch physics body: unsupported shape");
          this.shapeWarned = true;
        }
        // todo: suport more shapes
      }
      this.el.body.updateBoundingRadius();
    }
  },
  remove: function () {
    this.el.removeEventListener(this.STRETCH_EVENT, this.start);
    this.el.removeEventListener(this.UNSTRETCH_EVENT, this.end);
  },
  start: function(evt) {
    if (this.stretched) { return; } //already stretching
    this.stretchers.push(evt.detail.hand);
    if(this.stretchers.length === 2) {
      this.stretched = true;
      this.previousStretch = null;
      this.el.addState(this.STRETCHED_STATE);
    }
    if (evt.preventDefault) { evt.preventDefault(); } // gesture accepted
  },
  end: function (evt) {
    var stretcherIndex = this.stretchers.indexOf(evt.detail.hand);
    if (stretcherIndex === -1) { return; }
    this.stretchers.splice(stretcherIndex, 1);
    this.stretched = false;
    this.el.removeState(this.STRETCHED_STATE);
  } 
});