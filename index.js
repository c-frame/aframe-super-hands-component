/* global AFRAME */

if (typeof AFRAME === 'undefined') {
  throw new Error('Component attempted to register before AFRAME was available.');
}

/**
 * Super Hands component for A-Frame.
 */
AFRAME.registerComponent('super-hands', {
  schema: {
    dropTargetClasses: { default: [] },
    colliderState: { default: 'collided'},
    colliderEvent: { default: 'hit' },
    usePhysics: { default: true }
    // TODO: make list of button events listened a schema item
  },

  /**
   * Set if component needs multiple instancing.
   */
  multiple: false,

  /**
   * Called once when component is attached. Generally for initial setup.
   */
  init: function () {
    // constants
    this.GRABBED_STATE = 'grabbed';
    this.STRETCHED_STATE = 'stretched';
    this.DRAGDROP_EVENT = 'dragdropped';
    this.DRAGDROP_HOVERED_STATE = 'hovered';
    this.DRAGDROP_HOVERING_STATE = 'hovering';
    
    // links to other systems/components
    this.otherController = null;
    
    // state tracking
    this.hoverEls = [];
    this.constraint = null;
    this.grabbing = false;
    this.stretching = false;
    this.previousStretch = null;
    this.previousPosition = null;
    this.carried = null;
    
    this.findOtherController = this.findOtherController.bind(this);
    this.unHover = this.unHover.bind(this);
    this.onHit = this.onHit.bind(this);
    this.onGripOpen = this.onGripOpen.bind(this);
    this.onGripClose = this.onGripClose.bind(this);
    
    this.findOtherController();
  },

  /**
   * Called when component is attached and when component data changes.
   * Generally modifies the entity based on the data.
   */
  update: function (oldData) {
    if(this.data.usePhysics) {
      this.physics = this.el.sceneEl.systems.physics;
    } else {
      if(this.constraint) {
        this.physics.world.removeConstraint(this.constraint);
        this.constraint = null;
      }
      this.physics = null;
    }
  },

  /**
   * Called when a component is removed (e.g., via removeAttribute).
   * Generally undoes all modifications to the entity.
   */
  remove: function () { },

  /**
   * Called on each scene tick.
   */
  tick: function (t) { 
    var hitEl = this.carried, 
      scale, hitElGeom, position, delta;
    if (!hitEl) { return; }
    if(this.stretching) {
      scale = new THREE.Vector3().copy(hitEl.getAttribute('scale')); 
      hitElGeom = hitEl.getAttribute('geometry');
      delta = this.getStretchDelta();
      scale = scale.multiplyScalar(delta);
      hitEl.setAttribute('scale', scale);
      // force scale update for physics body
      if (hitEl.body) {
        var physicsShape = hitEl.body.shapes[0];
        if(physicsShape.halfExtents) {
          physicsShape.halfExtents.set(hitElGeom.width / 2 * scale.x,
                                       hitElGeom.height / 2 * scale.y,
                                       hitElGeom.depth / 2 * scale.z);
          physicsShape.updateConvexPolyhedronRepresentation();
        } else { 
          if(!this.shapeWarned) {
            console.warn("Unable to stretch physics body: unsupported shape");
            this.shapeWarned = true;
          }
          // todo: suport more shapes
        }
        hitEl.body.updateBoundingRadius();
      }
    } else if(!this.constraint) {
      // carried element needs manual update
      delta = this.getPositionDelta();
      position = hitEl.getAttribute('position');
      hitEl.setAttribute('position', {
        x: position.x + delta.x,
        y: position.y + delta.y,
        z: position.z + delta.z
      });
    } 
  },
  /**
   * Called when entity pauses.
   * Use to stop or remove any dynamic or background behavior such as events.
   */
  pause: function () {
    this.el.sceneEl.removeEventListener('controllersupdated',  
                                        this.findOtherController);
    this.el.removeEventListener(this.data.colliderEvent, this.onHit);
    this.el.removeEventListener('gripdown', this.onGripClose);
    this.el.removeEventListener('gripup', this.onGripOpen);
    this.el.removeEventListener('trackpaddown', this.onGripClose);
    this.el.removeEventListener('trackpadup', this.onGripOpen);
    this.el.removeEventListener('triggerdown', this.onGripClose);
    this.el.removeEventListener('triggerup', this.onGripOpen);
  },

  /**
   * Called when entity resumes.
   * Use to continue or add any dynamic or background behavior such as events.
   */
  play: function () {
    this.el.sceneEl.addEventListener('controllersupdated',  
                                     this.findOtherController);
    this.el.addEventListener(this.data.colliderEvent, this.onHit);
    this.el.addEventListener('gripdown', this.onGripClose);
    this.el.addEventListener('gripup', this.onGripOpen);
    this.el.addEventListener('trackpaddown', this.onGripClose);
    this.el.addEventListener('trackpadup', this.onGripOpen);
    this.el.addEventListener('triggerdown', this.onGripClose);
    this.el.addEventListener('triggerup', this.onGripOpen);
  },
  
  /* link between controllers for two-handed interactions  */
  findOtherController: function () {
    if (!this.el.components['tracked-controls']) {
      return; //controllers not yet on
    }
    // this could be smoother if systems.controllers kept a link from the 
    // controller back to its node
    var controllers = document.querySelectorAll('[tracked-controls]');
    for (var [id, node] of controllers.entries()) { 
      if(node !== this.el) {
        this.otherController = node;
        break;
      }
    }
  },
  onGripClose: function (evt) {
    this.grabbing = true;
    this.previousStretch = null;
    this.previousPosition = null;
  },

  onGripOpen: function (evt) {
    var hoverEls = this.hoverEls.slice(),
        carried = this.carried,
        hitEl;
    if(carried) {
      if(hoverEls.length !== 0) { // drag-drop occurs
        dropTarget = hoverEls[0]; 
        dropTarget.emit(this.DRAGDROP_EVENT, 
                   { drop: 'receive', dropped: carried, on: dropTarget });
        carried.emit(this.DRAGDROP_EVENT, 
                     { drop: 'give', dropped: carried, on: dropTarget });
        dropTarget.removeState(this.DRAGDROP_HOVERED_STATE);
      }
      carried.removeState(this.GRABBED_STATE);
      carried.removeState(this.STRETCHED_STATE);
      carried.removeState(this.DRAGDROP_HOVERING_STATE);
    }
    // clear list of backup targets to prevent triggering hover
    this.hoverEls = [];
    this.carried = null;
    this.grabbing = false;
    this.stretching = false;
    if(this.physics && this.constraint) {
      this.physics.world.removeConstraint(this.constraint);
      this.constraint = null;
    }
  },
  onHit: function(evt) {
    var hitEl = evt.detail.el;
    // return if no valid interaction state
    if(!hitEl || !this.grabbing || hitEl === this.carried) { return; } 
    if (!this.carried) { // empty hand
      this.carried = hitEl;
      if (hitEl.is(this.GRABBED_STATE)) { // second hand grab (AKA stretch)
        hitEl.addState(this.STRETCHED_STATE);
        this.stretching = true;
      } else { // basic grab
        hitEl.addState(this.GRABBED_STATE);
        if(this.physics && hitEl.body) { // use constraint to lock target to hand
          this.constraint = new window.CANNON
            .LockConstraint(this.el.body, hitEl.body);
          this.physics.world.addConstraint(this.constraint);
        } 
      }
    } else if ((!this.data.dropTargetClasses.length || 
                this.data.dropTargetClasses
                  .filter(x => hitEl.classList.contains(x)).length) &&
               this.hoverEls.indexOf(hitEl) === -1) { 
      // hand full and hitEl is a valid, new drag-drop target
      this.hoverEls.push(hitEl); 
      hitEl.addEventListener('stateremoved', this.unHover);
      if (this.hoverEls.length === 1) { this.hover(); }
    } 
  },
  /* notify drag-drop target that entity is held over it  */
  hover: function() {
    if(this.hoverEls.length) {
      // only add to first element in case of multiple overlapping targets
      this.hoverEls[0].addState(this.DRAGDROP_HOVERED_STATE);
      this.carried.addState(this.DRAGDROP_HOVERING_STATE);
    } else {
      this.carried.removeState(this.DRAGDROP_HOVERING_STATE);
    }
  },
  /* tied to 'stateremoved' event for current hovered drop target */
  unHover: function (evt) {
    var hoverIndex;
    if (evt.detail.state == this.data.colliderState || 
        evt.detail.state == this.DRAGDROP_HOVERED_STATE) {
      /* TODO?: need to check if (currentTarget === target) in case this
          is bubbled up from a child that is also a drop target? */
      hoverIndex = this.hoverEls.indexOf(evt.target);
      evt.target.removeEventListener('stateremoved', this.unHover);
      evt.target.removeState(this.DRAGDROP_HOVERED_STATE);
      if (hoverIndex > -1) { this.hoverEls.splice(hoverIndex, 1); } 
      // activate backup target if present
      this.hover();
    }
  },
  /* movement per tick for stretch and manual grab updates */ 
  getStretchDelta: function () {
    var otherHandPos = new THREE.Vector3()
        .copy(this.otherController.getAttribute('position')),
      currentPosition = new THREE.Vector3()
        .copy(this.el.getAttribute('position')),
      currentStretch = currentPosition.distanceTo(otherHandPos),
      deltaStretch = currentStretch / (this.previousStretch || NaN); 
    this.previousStretch = currentStretch;
    return deltaStretch || 1;
  },
  getPositionDelta: function () {
    var currentPosition = this.el.getAttribute('position'),
      previousPosition = this.previousPosition || currentPosition,
      deltaPosition = {
      x: currentPosition.x - previousPosition.x,
      y: currentPosition.y - previousPosition.y,
      z: currentPosition.z - previousPosition.z
    };
    this.previousPosition = currentPosition;
    return deltaPosition;
  }
});
