(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
//require('aframe');
require('../index.js');
//require('aframe-extras').registerAll();
//require('aframe-event-set-component');
//require('aframe-physics-system');
//require('aframe-physics-system');
//AFRAME.registerComponent('grid', extras.primitives.grid);
//AFRAME.registerComponent('sphere-collider', extras.misc['sphere-collider']);

},{"../index.js":2}],2:[function(require,module,exports){
/* global AFRAME */

if (typeof AFRAME === 'undefined') {
  throw new Error('Component attempted to register before AFRAME was available.');
}

require('./systems/super-hands-system.js');
require('./reaction_components/hoverable.js');
require('./reaction_components/grabbable.js');
require('./reaction_components/stretchable.js');
require('./reaction_components/drag-droppable.js');

/**
 * Super Hands component for A-Frame.
 */
AFRAME.registerComponent('super-hands', {
  schema: {
    colliderState: { default: 'collided'},
    colliderEvent: { default: 'hit' },
    grabStartButtons: {
      default: ['gripdown', 'trackpaddown', 'triggerdown', 'gripclose', 
                'pointup', 'thumbup', 'pointingstart', 'pistolstart', 
                'thumbstickdown']
    },
    grabEndButtons: {
      default: ['gripup', 'trackpadup', 'triggerup', 'gripopen', 
                'pointdown', 'thumbdown', 'pointingend', 'pistolend', 
                'thumbstickup']
    },
    stretchStartButtons: {
      default: ['gripdown', 'trackpaddown', 'triggerdown', 'gripclose', 
                'pointup', 'thumbup', 'pointingstart', 'pistolstart', 
                'thumbstickdown']
    },
    stretchEndButtons: {
      default: ['gripup', 'trackpadup', 'triggerup', 'gripopen', 
                'pointdown', 'thumbdown', 'pointingend', 'pistolend', 
                'thumbstickup']
    },
    dragDropStartButtons: {
      default: ['gripdown', 'trackpaddown', 'triggerdown', 'gripclose', 
                'pointup', 'thumbup', 'pointingstart', 'pistolstart', 
                'thumbstickdown']
    },
    dragDropEndButtons: {
      default: ['gripup', 'trackpadup', 'triggerup', 'gripopen', 
                'pointdown', 'thumbdown', 'pointingend', 'pistolend', 
                'thumbstickup']
    }
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
    this.HOVER_EVENT = 'hover-start';
    this.UNHOVER_EVENT = 'hover-end';
    this.GRAB_EVENT = 'grab-start';
    this.UNGRAB_EVENT = 'grab-end';
    this.STRETCH_EVENT = 'stretch-start';
    this.UNSTRETCH_EVENT = 'stretch-end';
    this.DRAGOVER_EVENT = 'dragover-start';
    this.UNDRAGOVER_EVENT = 'dragover-end';
    this.DRAGDROP_EVENT = 'drag-drop';
    
    // links to other systems/components
    this.otherController = null;
    
    // state tracking
    this.hoverEls = [];
    this.lastHover = null;
    this.grabbing = false;
    this.stretching = false;
    this.dragging = false;
    this.carried = null;
    this.stretched = null;
    this.dragged = null;
    
    this.unHover = this.unHover.bind(this);
    this.unWatch = this.unWatch.bind(this);
    this.onHit = this.onHit.bind(this);
    this.onGrabStartButton = this.onGrabStartButton.bind(this);
    this.onGrabEndButton = this.onGrabEndButton.bind(this);
    this.onStretchStartButton = this.onStretchStartButton.bind(this);
    this.onStretchEndButton = this.onStretchEndButton.bind(this);
    this.onDragDropStartButton = this.onDragDropStartButton.bind(this);
    this.onDragDropEndButton = this.onDragDropEndButton.bind(this);
    this.system.registerMe(this.el);
  },

  /**
   * Called when component is attached and when component data changes.
   * Generally modifies the entity based on the data.
   */
  update: function (oldData) {
    // TODO: update event listeners
    this.unRegisterListeners(oldData);
    this.registerListeners();
  },

  /**
   * Called when a component is removed (e.g., via removeAttribute).
   * Generally undoes all modifications to the entity.
   */
  remove: function () {
    this.system.unregisterMe(this.el);
    // move listener registration to init/remove
    // as described in according to AFRAME 0.5.0 component guide
    this.unRegisterListeners();
  },
  /**
   * Called when entity pauses.
   * Use to stop or remove any dynamic or background behavior such as events.
   */
  pause: function () {

  },

  /**
   * Called when entity resumes.
   * Use to continue or add any dynamic or background behavior such as events.
   */
  play: function () {

  },
  onGrabStartButton: function (evt) {
    this.grabbing = true;
  },

  onGrabEndButton: function (evt) {
    if(this.carried) {
      this.carried.emit(this.UNGRAB_EVENT, { hand: this.el });
      this.carried = null;
    }
    this.grabbing = false;
  },
  onStretchStartButton: function (evt) {
    this.stretching = true;
  },
  onStretchEndButton: function (evt) {
    if(this.stretched) {
      // avoid firing event twice when both hands release
      if(this.otherController.components['super-hands'].stretched) {
        this.stretched.emit(this.UNSTRETCH_EVENT, { hand: this.el });
      }
      this.stretched = null;
    }
    this.stretching = false;
  },
  onDragDropStartButton: function (evt) {
    this.dragging = true;
  },
  onDragDropEndButton: function (evt) {
    var ddevt, 
        carried = this.dragged,
        dropTarget = this.hoverEls[0];
    this.dragging = false; // keep _unHover() from activating another droptarget
    if(carried && dropTarget) {
      ddevt = { hand: this.el, dropped: carried, on: dropTarget };
      dropTarget.emit(this.DRAGDROP_EVENT, ddevt);
      carried.emit(this.DRAGDROP_EVENT, ddevt);
      this._unHover(dropTarget);
    }
    this.dragged = null;
  },
  onHit: function(evt) {
    var hitEl = evt.detail.el, used = false, hitElIndex;
    if(!hitEl) { return; } 
    hitElIndex = this.hoverEls.indexOf(hitEl);
    // interactions target the oldest entity in the stack, if present
    var getTarget = () => {
      if(!used) {
        used = true;
        hitEl = this.hoverEls.length ? this.useHoveredEl() : hitEl;
      }
      return hitEl;
    };

    if (this.grabbing && !this.carried) { 
      this.carried = getTarget();
      this.carried.emit(this.GRAB_EVENT, { hand: this.el });
    } 
    if (this.stretching && !this.stretched) {
      this.stretched = getTarget();
      if(this.stretched === this.otherController.components['super-hands'].stretched) {
        this.stretched.emit(this.STRETCH_EVENT, { 
          hand: this.otherController, secondHand: this.el 
        });
      }
    }
    if (this.dragging && !this.dragged) {
      /* prefer this.carried so that a drag started after a grab will work
         with carried element rather than a currently intersected drop target.
         fall back to hitEl in case a drag is initiated independent 
         of a grab */
      this.dragged = this.carried || getTarget();
      this.hover(); // refresh hover in case already over a target
    }
    // keep stack of currently intersected but not interacted entities 
    if (!used && hitElIndex === -1 && hitEl !== this.carried && 
        hitEl !== this.stretched && hitEl !== this.dragged) {
      this.hoverEls.push(hitEl); 
      hitEl.addEventListener('stateremoved', this.unWatch);
      if(this.hoverEls.length === 1) { this.hover(); }
    }
  },
  /* send the appropriate hovered gesture for the top entity in the stack */
  hover: function() {
    var hvrevt, hoverEl;
    if(this.hoverEls.length) {
      hoverEl = this.hoverEls[0];
      hoverEl.removeEventListener('stateremoved', this.unWatch);
      hoverEl.addEventListener('stateremoved', this.unHover);
      if(this.dragging && this.dragged) {
        hvrevt = { 
          hand: this.el, hovered: hoverEl, carried: this.dragged
        };
        hoverEl.emit(this.DRAGOVER_EVENT, hvrevt);
        this.dragged.emit(this.DRAGOVER_EVENT, hvrevt);
        this.lastHover = this.DRAGOVER_EVENT;
      } else {
        hoverEl.emit(this.HOVER_EVENT, { hand: this.el });
        this.lastHover = this.HOVER_EVENT;
      }
    } else {
      this.lastHover = null;
    } 
  },
  /* called when the current target entity is used by another gesture */
  useHoveredEl: function () {
    var el = this.hoverEls.shift();
    this._unHover(el);
    return el;
  },
  /* tied to 'stateremoved' event for hovered entities,
     called when controller moves out of collision range of entity */
  unHover: function (evt) {
    var hoverIndex;
    if(evt.detail.state === this.data.colliderState) {
      hoverIndex = this.hoverEls.indexOf(evt.target);
      if(hoverIndex !== -1) { this.hoverEls.splice(hoverIndex, 1); }
      this._unHover(evt.target);
    }
  },
  /* inner unHover steps needed regardless of cause of unHover */
  _unHover: function(el) {
    var evt;
    el.removeEventListener('stateremoved', this.unHover);
    if(this.lastHover === this.DRAGOVER_EVENT) {
      evt = { hand: this.el, hovered: el, carried: this.dragged };
      el.emit(this.UNDRAGOVER_EVENT, evt);
      if(this.dragged) { this.dragged.emit(this.UNDRAGOVER_EVENT, evt); }
    } else if (this.lastHover === this.HOVER_EVENT) {
      el.emit(this.UNHOVER_EVENT, { hand: this.el });
    }
    //activate next target, if present
    this.hover();
  },
  unWatch: function (evt) {
    if(evt.detail.state === this.data.colliderState) {
      var hoverIndex = this.hoverEls.indexOf(evt.target);
      evt.target.removeEventListener('stateremoved', this.unWatch);
      if(hoverIndex !== -1) { this.hoverEls.splice(hoverIndex, 1); }
    }
  },
  registerListeners: function () {
    this.el.addEventListener(this.data.colliderEvent, this.onHit);
    
    this.data.grabStartButtons.forEach( b => {
      this.el.addEventListener(b, this.onGrabStartButton);
    });
    this.data.grabEndButtons.forEach( b => {
      this.el.addEventListener(b, this.onGrabEndButton);
    });
    this.data.stretchStartButtons.forEach( b => {
      this.el.addEventListener(b, this.onStretchStartButton);
    });
    this.data.stretchEndButtons.forEach( b => {
      this.el.addEventListener(b, this.onStretchEndButton);
    });
    this.data.dragDropStartButtons.forEach( b => {
      this.el.addEventListener(b, this.onDragDropStartButton);
    });
    this.data.dragDropEndButtons.forEach( b => {
      this.el.addEventListener(b, this.onDragDropEndButton);
    });    
  },
  unRegisterListeners: function (data) {
    data = data || this.data;
    if(Object.keys(data).length === 0) {
      // Empty object passed on initalization
      return;
    }
    this.el.removeEventListener(data.colliderEvent, this.onHit);
    
    data.grabStartButtons.forEach( b => {
      this.el.removeEventListener(b, this.onGrabStartButton);
    });
    data.grabEndButtons.forEach( b => {
      this.el.removeEventListener(b, this.onGrabEndButton);
    });
    data.stretchStartButtons.forEach( b => {
      this.el.removeEventListener(b, this.onStretchStartButton);
    });
    data.stretchEndButtons.forEach( b => {
      this.el.removeEventListener(b, this.onStretchEndButton);
    });
    data.dragDropStartButtons.forEach( b => {
      this.el.removeEventListener(b, this.onDragDropStartButton);
    });
    data.dragDropEndButtons.forEach( b => {
      this.el.removeEventListener(b, this.onDragDropEndButton);
    });    
  }
});

},{"./reaction_components/drag-droppable.js":3,"./reaction_components/grabbable.js":4,"./reaction_components/hoverable.js":5,"./reaction_components/stretchable.js":6,"./systems/super-hands-system.js":7}],3:[function(require,module,exports){
AFRAME.registerComponent('drag-droppable', {
  init: function () {
    this.HOVERED_STATE = 'dragover';
    this.HOVER_EVENT = 'dragover-start';
    this.UNHOVER_EVENT = 'dragover-end';
    
    this.start = this.start.bind(this);
    this.end = this.end.bind(this);
  },
  pause: function () {
    this.el.removeEventListener(this.HOVER_EVENT, this.start);
    this.el.removeEventListener(this.UNHOVER_EVENT, this.end);
  },
  play: function () {
    this.el.addEventListener(this.HOVER_EVENT, this.start);
    this.el.addEventListener(this.UNHOVER_EVENT, this.end);
  },
  start: function(evt) {
    this.el.addState(this.HOVERED_STATE);
  },
  end: function (evt) {
    this.el.removeState(this.HOVERED_STATE);
  } 
});
},{}],4:[function(require,module,exports){
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
    
    this.start = this.start.bind(this);
    this.end = this.end.bind(this);
  },
  update: function (oldDat) {
    if(this.data.usePhysics === 'never' && this.constraint) {
      this.el.body.world.removeConstraint(this.constraint);
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
    this.el.removeEventListener(this.GRAB_EVENT, this.start);
    this.el.removeEventListener(this.UNGRAB_EVENT, this.end);
  },
  play: function () {
    this.el.addEventListener(this.GRAB_EVENT, this.start);
    this.el.addEventListener(this.UNGRAB_EVENT, this.end);
  },
  start: function(evt) {
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
},{}],5:[function(require,module,exports){
AFRAME.registerComponent('hoverable', {
  init: function () {
    this.HOVERED_STATE = 'hovered';
    this.HOVER_EVENT = 'hover-start';
    this.UNHOVER_EVENT = 'hover-end';
    
    this.hoverers = [];
    
    this.start = this.start.bind(this);
    this.end = this.end.bind(this);
  },
  pause: function () {
    this.el.removeEventListener(this.HOVER_EVENT, this.start);
    this.el.removeEventListener(this.UNHOVER_EVENT, this.end);
  },
  play: function () {
    this.el.addEventListener(this.HOVER_EVENT, this.start);
    this.el.addEventListener(this.UNHOVER_EVENT, this.end);
  },
  start: function(evt) {
    this.el.addState(this.HOVERED_STATE);
    if(this.hoverers.indexOf(evt.detail.hand) === -1) {
      this.hoverers.push(evt.detail.hand);
    }
  },
  end: function (evt) {
    var handIndex = this.hoverers.indexOf(evt.detail.hand);
    if(handIndex !== -1) {
      this.hoverers.splice(handIndex, 1);
    }
    if(this.hoverers.length < 1) {
      this.el.removeState(this.HOVERED_STATE);
    }
  } 
});
},{}],6:[function(require,module,exports){
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
    if (this.previousStretch != null && currentStretch !== 0) {
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
  pause: function () {
    this.el.removeEventListener(this.STRETCH_EVENT, this.start);
    this.el.removeEventListener(this.UNSTRETCH_EVENT, this.end);
  },
  play: function () {
    this.el.addEventListener(this.STRETCH_EVENT, this.start);
    this.el.addEventListener(this.UNSTRETCH_EVENT, this.end);
  },
  start: function(evt) {
    if (this.stretched) { return; } //already stretching
    this.stretchers.push(evt.detail.hand, evt.detail.secondHand);
    this.stretched = true;
    this.previousStretch = null;
    this.el.addState(this.STRETCHED_STATE);
  },
  end: function (evt) {
    if(this.stretchers.indexOf(evt.detail.hand) === -1) { return; }
    this.stretchers = [];
    this.stretched = false;
    this.el.removeState(this.STRETCHED_STATE);
  } 
});
},{}],7:[function(require,module,exports){
AFRAME.registerSystem('super-hands', {
  init: function () {
    this.controllers = [];
  },
  registerMe: function (el) {
    //when second controller registers, store links
    if(this.controllers.length === 1) {
      this.controllers[0].components['super-hands'].otherController = el;
      el.components['super-hands'].otherController = this.controllers[0];
    }
    this.controllers.push(el);
  },
  unregisterMe: function (el) {
    var index = this.controllers.indexOf(el);
    if(index !== -1) {
      this.controllers.splice(index, 1);
    }
    this.controllers.forEach(x => {
      if(x.otherController === el) { x.otherControler = null; }
    });
  } 
});

},{}]},{},[1]);
