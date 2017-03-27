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
require('./reaction_components/clickable.js');

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
    this.DRAG_EVENT = 'drag-start';
    this.UNDRAG_EVENT = 'drag-end';
    this.DRAGOVER_EVENT = 'dragover-start';
    this.UNDRAGOVER_EVENT = 'dragover-end';
    this.DRAGDROP_EVENT = 'drag-drop';
    
    // links to other systems/components
    this.otherSuperHand = null;
    
    // state tracking - global event handlers (GEH)
    this.gehDragged = new Set();
    this.gehClicking = new Set();
    
    // state tracking - reaction components
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
    this.system.registerMe(this);
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
    this.system.unregisterMe(this);
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
    this.dispatchMouseEventAll('mousedown', this.el);
    this.gehClicking = new Set(this.hoverEls);
    this.updateGrabbed();
  },

  onGrabEndButton: function (evt) {
    var clickables = this.hoverEls.filter(h => this.gehClicking.has(h)), i;
    this.dispatchMouseEventAll('mouseup', this.el, true);
    for(i = 0; i < clickables.length; i++) {
      this.dispatchMouseEvent(clickables[i], 'click', this.el);
    }
    if(this.carried) {
      this.carried.emit(this.UNGRAB_EVENT, { hand: this.el });
      this.carried = null;
    }
    this.grabbing = false;
  },
  onStretchStartButton: function (evt) {
    this.stretching = true;
    this.updateStretched();
  },
  onStretchEndButton: function (evt) {
    if(this.stretched) {
      // avoid firing event twice when both hands release
      if(this.otherSuperHand.stretched) {
        this.stretched.emit(this.UNSTRETCH_EVENT, { hand: this.el });
      }
      this.stretched = null;
    }
    this.stretching = false;
  },
  onDragDropStartButton: function (evt) {
    this.dragging = true;
    if(this.hoverEls.length) {
      this.gehDragged = new Set(this.hoverEls);
      this.dispatchMouseEventAll('dragstart', this.el);
    }
    this.updateDragged();
  },
  onDragDropEndButton: function (evt) {
    var ddevt, dropTarget,
        carried = this.dragged;
    this.dragging = false; // keep _unHover() from activating another droptarget
    if(carried) {
      ddevt = { hand: this.el, dropped: carried, on: null };
      dropTarget = this.findTarget(this.DRAGDROP_EVENT, ddevt, true);
      if(dropTarget) {
        ddevt.on = dropTarget;
        this.emitCancelable(carried, this.DRAGDROP_EVENT, ddevt);
        this._unHover(dropTarget);
      }
      carried.emit(this.UNDRAG_EVENT, { hand: this.el });
    }
    this.gehDragged.forEach(carried => {
      this.dispatchMouseEvent(carried, 'dragend', this.el);
      // fire event both ways for all intersected targets 
      this.dispatchMouseEventAll('drop', carried, true, true);
      this.dispatchMouseEventAll('dragleave', carried, true, true);
    });
    this.dragged = null;
    this.gehDragged.clear();
  },
  onHit: function(evt) {
    var hitEl = evt.detail.el, used = false, hitElIndex;
    if (!hitEl) { return; } 
    hitElIndex = this.hoverEls.indexOf(hitEl);
    if(hitElIndex === -1) {
      this.hoverEls.push(hitEl);
      hitEl.addEventListener('stateremoved', this.unWatch);
      this.dispatchMouseEvent(hitEl, 'mouseover', this.el);
      if(this.dragging && this.gehDragged.size) {
        // events on targets and on dragged
        this.gehDragged.forEach(dragged => {
          this.dispatchMouseEventAll('dragenter', dragged, true, true);
        });
      }
      this.updateGrabbed();
      this.updateStretched();
      this.updateDragged();
      this.hover();
    }
  },
  updateGrabbed: function () {
    if (this.grabbing && !this.carried) {
      this.carried = this.findTarget(this.GRAB_EVENT, { hand: this.el });
    } 
  },
  updateStretched: function () {
    if (this.stretching && !this.stretched) {
      this.stretched = this.findTarget(this.STRETCH_EVENT, { hand: this.el });
    }
  },
  updateDragged: function () {
    if (this.dragging && !this.dragged) {
      /* prefer this.carried so that a drag started after a grab will work
       with carried element rather than a currently intersected drop target.
       fall back to queue in case a drag is initiated independent 
       of a grab */
      if (this.carried && !this.emitCancelable(this.carried, this.DRAG_EVENT, { hand: this.el })) {
        this.dragged = this.carried;
      } else {
        this.dragged = this.findTarget(this.DRAG_EVENT, { hand: this.el });
      }
    }
  },
  /* search collided entities for target to hover/dragover */
  hover: function() {
    var hvrevt, hoverEl;
    this.lastHover = null;
    if(this.dragging && this.dragged) {
      hvrevt = { 
        hand: this.el, hovered: hoverEl, carried: this.dragged
      };
      hoverEl = this.findTarget(this.DRAGOVER_EVENT, hvrevt, true);
      if(hoverEl) {
        hoverEl.removeEventListener('stateremoved', this.unWatch);
        hoverEl.addEventListener('stateremoved', this.unHover);
        this.emitCancelable(this.dragged, this.DRAGOVER_EVENT, hvrevt);
        this.lastHover = this.DRAGOVER_EVENT;
      }
    } else {
      hoverEl = this.findTarget(this.HOVER_EVENT, { hand: this.el }, true);
      if (hoverEl) {
        hoverEl.removeEventListener('stateremoved', this.unWatch);
        hoverEl.addEventListener('stateremoved', this.unHover);
        this.lastHover = this.HOVER_EVENT;
      }
    }
  },
  /* tied to 'stateremoved' event for hovered entities,
     called when controller moves out of collision range of entity */
  unHover: function (evt) {
    if(evt.detail.state === this.data.colliderState) {
      this._unWatch(evt.target);
      this._unHover(evt.target);
    }
  },
  /* inner unHover steps needed regardless of cause of unHover */
  _unHover: function(el) {
    var evt;
    el.removeEventListener('stateremoved', this.unHover);
    if(this.lastHover === this.DRAGOVER_EVENT) {
      evt = { hand: this.el, hovered: el, carried: this.dragged };
      this.emitCancelable(el, this.UNDRAGOVER_EVENT, evt);
      if(this.dragged) { 
        this.emitCancelable(this.dragged, this.UNDRAGOVER_EVENT, evt); 
      }
    } else if (this.lastHover === this.HOVER_EVENT) {
      this.emitCancelable(el, this.UNHOVER_EVENT, { hand: this.el });
    }
    //activate next target, if present
    this.hover();
  },
  unWatch: function (evt) {
    if(evt.detail.state === this.data.colliderState) {
      evt.target.removeEventListener('stateremoved', this.unWatch);
      this._unWatch(evt.target);
    }
  },
  _unWatch: function (target) {
    var hoverIndex = this.hoverEls.indexOf(target);
    if (hoverIndex !== -1) { this.hoverEls.splice(hoverIndex, 1); }
    this.gehDragged.forEach(dragged => {
      this.dispatchMouseEvent(target, 'dragleave', dragged);
      this.dispatchMouseEvent(dragged, 'dragleave', target);
    });
    this.dispatchMouseEvent(target, 'mouseout', this.el);
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
  },
  emitCancelable: function (target, name, detail) {
    var data, evt;
    detail = detail || {};
    data = { bubbles: true, cancelable: true, detail: detail };
    data.detail.target = data.detail.target || target;
    evt = new CustomEvent(name, data);
    return target.dispatchEvent(evt);
  },
  dispatchMouseEvent: function (target, name, relatedTarget) {
    var mEvt = new MouseEvent(name, { relatedTarget: relatedTarget });
    target.dispatchEvent(mEvt);
  },
  dispatchMouseEventAll: function (name, relatedTarget, filterUsed, alsoReverse) {
    var els = this.hoverEls, i;
    if (filterUsed) { 
      els = els
        .filter(el => el !== this.carried && el !== this.dragged &&
                el !== this.stretched && !this.gehDragged.has(el));
    }
    if(alsoReverse) {
      for(i = 0; i < els.length; i++) {
        this.dispatchMouseEvent(els[i], name, relatedTarget);
        this.dispatchMouseEvent(relatedTarget, name, els[i]);
      }
    } else {
      for(i = 0; i < els.length; i++) {
        this.dispatchMouseEvent(els[i], name, relatedTarget);
      }
    }
  },
  findTarget: function (evType, detail, filterUsed) {
    var elIndex, eligibleEls = this.hoverEls;
    if (filterUsed) {
      eligibleEls = eligibleEls
        .filter(el => el !== this.carried && el !== this.dragged && el !== this.stretched);
    }
    for(elIndex = 0; elIndex < eligibleEls.length; elIndex++) {
      if(!this.emitCancelable(eligibleEls[elIndex], evType, detail)) {
        return eligibleEls[elIndex];
      }
    }
    return null;
  }
});

},{"./reaction_components/clickable.js":3,"./reaction_components/drag-droppable.js":4,"./reaction_components/grabbable.js":5,"./reaction_components/hoverable.js":6,"./reaction_components/stretchable.js":7,"./systems/super-hands-system.js":8}],3:[function(require,module,exports){
AFRAME.registerComponent('clickable', {
  schema: {
    onclick: { type: 'string' }
  },
  init: function () {
    this.CLICKED_STATE = 'clicked';
    this.CLICK_EVENT = 'grab-start';
    this.UNCLICK_EVENT = 'grab-end';
    this.clickers = [];
    
    this.start = this.start.bind(this);
    this.end = this.end.bind(this);
    this.el.addEventListener(this.CLICK_EVENT, this.start);
    this.el.addEventListener(this.UNCLICK_EVENT, this.end);
  },
  remove: function () {
    this.el.removeEventListener(this.CLICK_EVENT, this.start);
    this.el.removeEventListener(this.UNCLICK_EVENT, this.end);
  },
  start: function(evt) {
    this.el.addState(this.CLICKED_STATE);
    if(this.clickers.indexOf(evt.detail.hand) === -1) {
      this.clickers.push(evt.detail.hand);
    }
  },
  end: function (evt) {
    var handIndex = this.clickers.indexOf(evt.detail.hand);
    if(handIndex !== -1) {
      this.clickers.splice(handIndex, 1);
    }
    if(this.clickers.length < 1) {
      this.el.removeState(this.CLICKED_STATE);
    }
  }
});
},{}],4:[function(require,module,exports){
AFRAME.registerComponent('drag-droppable', {
  init: function () {
    this.HOVERED_STATE = 'dragover';
    this.DRAGGED_STATE = 'dragged';
    this.HOVER_EVENT = 'dragover-start';
    this.UNHOVER_EVENT = 'dragover-end';
    this.DRAG_EVENT = 'drag-start';
    this.UNDRAG_EVENT = 'drag-end';
    this.DRAGDROP_EVENT = 'drag-drop';  
    
    this.hoverStart = this.hoverStart.bind(this);
    this.dragStart = this.dragStart.bind(this);
    this.hoverEnd = this.hoverEnd.bind(this);
    this.dragEnd = this.dragEnd.bind(this);
    this.dragDrop = this.dragDrop.bind(this);
    
    this.el.addEventListener(this.HOVER_EVENT, this.hoverStart);
    this.el.addEventListener(this.DRAG_EVENT, this.dragStart);
    this.el.addEventListener(this.UNHOVER_EVENT, this.hoverEnd);    
    this.el.addEventListener(this.UNDRAG_EVENT, this.dragEnd);  
    this.el.addEventListener(this.DRAGDROP_EVENT, this.dragDrop);  
  },
  remove: function () {
    this.el.removeEventListener(this.HOVER_EVENT, this.hoverStart);
    this.el.removeEventListener(this.DRAG_EVENT, this.dragStart);
    this.el.removeEventListener(this.UNHOVER_EVENT, this.hoverEnd);    
    this.el.removeEventListener(this.UNDRAG_EVENT, this.dragEnd);    
    this.el.removeEventListener(this.DRAGDROP_EVENT, this.dragDrop);  
  },
  hoverStart: function(evt) {
    this.el.addState(this.HOVERED_STATE);
    if (evt.preventDefault) { evt.preventDefault(); }
  },
  dragStart: function(evt) {
    this.el.addState(this.DRAGGED_STATE);
    if (evt.preventDefault) { evt.preventDefault(); }
  },
  hoverEnd: function (evt) {
    this.el.removeState(this.HOVERED_STATE);
  },
  dragEnd: function (evt) {
    this.el.removeState(this.DRAGGED_STATE);
  },
  dragDrop: function (evt) {
    if (evt.preventDefault) { evt.preventDefault(); }
  }
});
},{}],5:[function(require,module,exports){
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
    
    this.el.addEventListener(this.GRAB_EVENT, this.start);
    this.el.addEventListener(this.UNGRAB_EVENT, this.end);
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
  remove: function () {
    this.el.removeEventListener(this.GRAB_EVENT, this.start);
    this.el.removeEventListener(this.UNGRAB_EVENT, this.end);
  },
  start: function(evt) {
    if (this.grabbed) { return; } //already grabbed
    this.grabber = evt.detail.hand;
    this.grabbed = true;
    this.el.addState(this.GRABBED_STATE);
    // notify super-hands that the gesture was accepted
    if (evt.preventDefault) { evt.preventDefault(); }
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
},{}],6:[function(require,module,exports){
AFRAME.registerComponent('hoverable', {
  init: function () {
    this.HOVERED_STATE = 'hovered';
    this.HOVER_EVENT = 'hover-start';
    this.UNHOVER_EVENT = 'hover-end';
    
    this.hoverers = [];
    
    this.start = this.start.bind(this);
    this.end = this.end.bind(this);
    
    this.el.addEventListener(this.HOVER_EVENT, this.start);
    this.el.addEventListener(this.UNHOVER_EVENT, this.end);
  },
  remove: function () {
    this.el.removeEventListener(this.HOVER_EVENT, this.start);
    this.el.removeEventListener(this.UNHOVER_EVENT, this.end);
  },
  start: function(evt) {
    this.el.addState(this.HOVERED_STATE);
    if(this.hoverers.indexOf(evt.detail.hand) === -1) {
      this.hoverers.push(evt.detail.hand);
    }
    if(evt.preventDefault) { evt.preventDefault(); }
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
},{}],7:[function(require,module,exports){
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
},{}],8:[function(require,module,exports){
AFRAME.registerSystem('super-hands', {
  init: function () {
    this.superHands = [];
  },
  registerMe: function (comp) {
    //when second hand registers, store links
    if(this.superHands.length === 1) {
      this.superHands[0].otherSuperHand = comp;
      comp.otherSuperHand = this.superHands[0];
    }
    this.superHands.push(comp);
  },
  unregisterMe: function (comp) {
    var index = this.superHands.indexOf(comp);
    if(index !== -1) {
      this.superHands.splice(index, 1);
    }
    this.superHands.forEach(x => {
      if(x.otherSuperHand === comp) { x.otherSuperHand = null; }
    });
  } 
});

},{}]},{},[1]);
