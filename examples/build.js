(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
require('../index.js');

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
require('./reaction_components/locomotor-auto-config.js');
require('./primitives/a-locomotor.js');

/**
 * Super Hands component for A-Frame.
 */
AFRAME.registerComponent('super-hands', {
  schema: {
    colliderState: {default: 'collided'},
    colliderEvent: {default: 'hit'},
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
    this.state = new Map();
    this.grabbing = false;
    this.stretching = false;
    this.dragging = false;

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
    const clickables = this.hoverEls.filter(h => this.gehClicking.has(h));
    this.dispatchMouseEventAll('mouseup', this.el, true);
    for (let i = 0; i < clickables.length; i++) {
      this.dispatchMouseEvent(clickables[i], 'click', this.el);
    }
    this.gehClicking.clear();
    if (this.state.has(this.GRAB_EVENT)) {
      this.state.get(this.GRAB_EVENT)
        .emit(this.UNGRAB_EVENT, { hand: this.el });
      /* push to top of stack so a drop followed by re-grab gets the same
         target */
      this.promoteHoveredEl(this.state.get(this.GRAB_EVENT));
      this.state.delete(this.GRAB_EVENT);
      this.hover();
    }
    this.grabbing = false;
  },
  onStretchStartButton: function (evt) {
    this.stretching = true;
    this.updateStretched();
  },
  onStretchEndButton: function (evt) {
    var stretched = this.state.get(this.STRETCH_EVENT);
    if (stretched) {
      stretched.emit(this.UNSTRETCH_EVENT, { hand: this.el });
      this.promoteHoveredEl(stretched);
      this.state.delete(this.STRETCH_EVENT);
      this.hover();
    }
    this.stretching = false;
  },
  onDragDropStartButton: function (evt) {
    this.dragging = true;
    if (this.hoverEls.length) {
      this.gehDragged = new Set(this.hoverEls);
      this.dispatchMouseEventAll('dragstart', this.el);
    }
    this.updateDragged();
  },
  onDragDropEndButton: function (evt) {
    var ddevt;
    var dropTarget;
    const carried = this.state.get(this.DRAG_EVENT);
    this.dragging = false; // keep _unHover() from activating another droptarget
    this.gehDragged.forEach(carried => {
      this.dispatchMouseEvent(carried, 'dragend', this.el);
      // fire event both ways for all intersected targets
      this.dispatchMouseEventAll('drop', carried, true, true);
      this.dispatchMouseEventAll('dragleave', carried, true, true);
    });
    this.gehDragged.clear();
    if (carried) {
      ddevt = { hand: this.el, dropped: carried, on: null };
      dropTarget = this.findTarget(this.DRAGDROP_EVENT, ddevt, true);
      if (dropTarget) {
        ddevt.on = dropTarget;
        this.emitCancelable(carried, this.DRAGDROP_EVENT, ddevt);
        this._unHover(dropTarget);
      }
      carried.emit(this.UNDRAG_EVENT, { hand: this.el });
      this.promoteHoveredEl(carried);
      this.state.delete(this.DRAG_EVENT);
      this.hover();
    }
  },
  onHit: function (evt) {
    const hitEl = evt.detail.el;
    var hitElIndex;
    if (!hitEl) { return; }
    hitElIndex = this.hoverEls.indexOf(hitEl);
    if (hitElIndex === -1) {
      this.hoverEls.push(hitEl);
      hitEl.addEventListener('stateremoved', this.unWatch);
      this.dispatchMouseEvent(hitEl, 'mouseover', this.el);
      if (this.dragging && this.gehDragged.size) {
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
    var carried = this.state.get(this.GRAB_EVENT);
    if (this.grabbing && !carried) {
      carried = this.findTarget(this.GRAB_EVENT, { hand: this.el });
      if (carried) {
        // save in state, end hover, and put back on watch list
        this.state.set(this.GRAB_EVENT, carried);
        this._unHover(carried);
        carried.addEventListener('stateremoved', this.unWatch);
      }
    }
  },
  updateStretched: function () {
    var stretched = this.state.get(this.STRETCH_EVENT);
    if (this.stretching && !stretched) {
      stretched = this.findTarget(this.STRETCH_EVENT, { hand: this.el });
      if (stretched) {
        // save in state, end hover, and put back on watch list
        this.state.set(this.STRETCH_EVENT, stretched);
        this._unHover(stretched);
        stretched.addEventListener('stateremoved', this.unWatch);
      }
    }
  },
  updateDragged: function () {
    var dragged = this.state.get(this.DRAG_EVENT);
    if (this.dragging && !dragged) {
      /* prefer carried so that a drag started after a grab will work
       with carried element rather than a currently intersected drop target.
       fall back to queue in case a drag is initiated independent
       of a grab */
      if (this.state.get(this.GRAB_EVENT) &&
          !this.emitCancelable(this.state.get(this.GRAB_EVENT), this.DRAG_EVENT, { hand: this.el })) {
        dragged = this.state.get(this.GRAB_EVENT);
      } else {
        dragged = this.findTarget(this.DRAG_EVENT, { hand: this.el });
      }
      if (dragged) {
        // end hover and put back on watch list
        this.state.set(this.DRAG_EVENT, dragged);
        this._unHover(dragged);
        dragged.addEventListener('stateremoved', this.unWatch);
      }
    }
  },
  /* search collided entities for target to hover/dragover */
  hover: function () {
    var hvrevt, hoverEl;
    // end previous hover
    if (this.state.has(this.HOVER_EVENT)) {
      // put back on watch list
      this.state.get(this.HOVER_EVENT)
        .addEventListener('stateremoved', this.unWatch);
      this._unHover(this.state.get(this.HOVER_EVENT), true);
    }
    if (this.state.has(this.DRAGOVER_EVENT)) {
      this.state.get(this.DRAGOVER_EVENT)
        .addEventListener('stateremoved', this.unWatch);
      this._unHover(this.state.get(this.DRAGOVER_EVENT), true);
    }
    if (this.dragging && this.state.get(this.DRAG_EVENT)) {
      hvrevt = {
        hand: this.el,
        hovered: hoverEl,
        carried: this.state.get(this.DRAG_EVENT)
      };
      hoverEl = this.findTarget(this.DRAGOVER_EVENT, hvrevt, true);
      if (hoverEl) {
        hoverEl.removeEventListener('stateremoved', this.unWatch);
        hoverEl.addEventListener('stateremoved', this.unHover);
        this.emitCancelable(this.state.get(this.DRAG_EVENT), this.DRAGOVER_EVENT, hvrevt);
        this.state.set(this.DRAGOVER_EVENT, hoverEl);
      }
    }
    // fallback to hover if not dragging or dragover wasn't successful
    if (!this.state.has(this.DRAGOVER_EVENT)) {
      hoverEl = this.findTarget(this.HOVER_EVENT, { hand: this.el }, true);
      if (hoverEl) {
        hoverEl.removeEventListener('stateremoved', this.unWatch);
        hoverEl.addEventListener('stateremoved', this.unHover);
        this.state.set(this.HOVER_EVENT, hoverEl);
      }
    }
  },
  /* tied to 'stateremoved' event for hovered entities,
     called when controller moves out of collision range of entity */
  unHover: function (evt) {
    if (evt.detail.state === this.data.colliderState) {
      this._unWatch(evt.target);
      this._unHover(evt.target);
    }
  },
  /* inner unHover steps needed regardless of cause of unHover */
  _unHover: function (el, skipNextHover) {
    var evt;
    el.removeEventListener('stateremoved', this.unHover);
    if (el === this.state.get(this.DRAGOVER_EVENT)) {
      this.state.delete(this.DRAGOVER_EVENT);
      evt = {
        hand: this.el,
        hovered: el,
        carried: this.state.get(this.DRAG_EVENT)
      };
      this.emitCancelable(el, this.UNDRAGOVER_EVENT, evt);
      if (this.state.has(this.DRAG_EVENT)) {
        this.emitCancelable(
          this.state.get(this.DRAG_EVENT),
          this.UNDRAGOVER_EVENT,
          evt
        );
      }
    }
    if (el === this.state.get(this.HOVER_EVENT)) {
      this.state.delete(this.HOVER_EVENT);
      this.emitCancelable(el, this.UNHOVER_EVENT, { hand: this.el });
    }
    // activate next target, if present
    if (!skipNextHover) {
      this.hover();
    }
  },
  unWatch: function (evt) {
    if (evt.detail.state === this.data.colliderState) {
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

    this.data.grabStartButtons.forEach(b => {
      this.el.addEventListener(b, this.onGrabStartButton);
    });
    this.data.grabEndButtons.forEach(b => {
      this.el.addEventListener(b, this.onGrabEndButton);
    });
    this.data.stretchStartButtons.forEach(b => {
      this.el.addEventListener(b, this.onStretchStartButton);
    });
    this.data.stretchEndButtons.forEach(b => {
      this.el.addEventListener(b, this.onStretchEndButton);
    });
    this.data.dragDropStartButtons.forEach(b => {
      this.el.addEventListener(b, this.onDragDropStartButton);
    });
    this.data.dragDropEndButtons.forEach(b => {
      this.el.addEventListener(b, this.onDragDropEndButton);
    });
  },
  unRegisterListeners: function (data) {
    data = data || this.data;
    if (Object.keys(data).length === 0) {
      // Empty object passed on initalization
      return;
    }
    this.el.removeEventListener(data.colliderEvent, this.onHit);

    data.grabStartButtons.forEach(b => {
      this.el.removeEventListener(b, this.onGrabStartButton);
    });
    data.grabEndButtons.forEach(b => {
      this.el.removeEventListener(b, this.onGrabEndButton);
    });
    data.stretchStartButtons.forEach(b => {
      this.el.removeEventListener(b, this.onStretchStartButton);
    });
    data.stretchEndButtons.forEach(b => {
      this.el.removeEventListener(b, this.onStretchEndButton);
    });
    data.dragDropStartButtons.forEach(b => {
      this.el.removeEventListener(b, this.onDragDropStartButton);
    });
    data.dragDropEndButtons.forEach(b => {
      this.el.removeEventListener(b, this.onDragDropEndButton);
    });
  },
  emitCancelable: function (target, name, detail) {
    var data, evt;
    detail = detail || {};
    data = { bubbles: true, cancelable: true, detail: detail };
    data.detail.target = data.detail.target || target;
    evt = new window.CustomEvent(name, data);
    return target.dispatchEvent(evt);
  },
  dispatchMouseEvent: function (target, name, relatedTarget) {
    var mEvt = new window.MouseEvent(name, { relatedTarget: relatedTarget });
    target.dispatchEvent(mEvt);
  },
  dispatchMouseEventAll: function (name, relatedTarget, filterUsed, alsoReverse) {
    let els = this.hoverEls;
    if (filterUsed) {
      els = els
        .filter(el => el !== this.state.get(this.GRAB_EVENT) &&
                el !== this.state.get(this.DRAG_EVENT) &&
                el !== this.state.get(this.STRETCH_EVENT) &&
                !this.gehDragged.has(el));
    }
    if (alsoReverse) {
      for (let i = 0; i < els.length; i++) {
        this.dispatchMouseEvent(els[i], name, relatedTarget);
        this.dispatchMouseEvent(relatedTarget, name, els[i]);
      }
    } else {
      for (let i = 0; i < els.length; i++) {
        this.dispatchMouseEvent(els[i], name, relatedTarget);
      }
    }
  },
  findTarget: function (evType, detail, filterUsed) {
    var elIndex;
    var eligibleEls = this.hoverEls;
    if (filterUsed) {
      eligibleEls = eligibleEls
        .filter(el => el !== this.state.get(this.GRAB_EVENT) &&
                el !== this.state.get(this.DRAG_EVENT) &&
                el !== this.state.get(this.STRETCH_EVENT));
    }
    for (elIndex = eligibleEls.length - 1; elIndex >= 0; elIndex--) {
      if (!this.emitCancelable(eligibleEls[elIndex], evType, detail)) {
        return eligibleEls[elIndex];
      }
    }
    return null;
  },
  promoteHoveredEl: function (el) {
    var hoverIndex = this.hoverEls.indexOf(el);
    if (hoverIndex !== -1) {
      this.hoverEls.splice(hoverIndex, 1);
      this.hoverEls.push(el);
    }
  }
});

},{"./primitives/a-locomotor.js":3,"./reaction_components/clickable.js":4,"./reaction_components/drag-droppable.js":5,"./reaction_components/grabbable.js":6,"./reaction_components/hoverable.js":7,"./reaction_components/locomotor-auto-config.js":8,"./reaction_components/stretchable.js":9,"./systems/super-hands-system.js":10}],3:[function(require,module,exports){
/* global AFRAME */
var extendDeep = AFRAME.utils.extendDeep;
// The mesh mixin provides common material properties for creating mesh-based primitives.
// This makes the material component a default component and maps all the base material properties.
var meshMixin = AFRAME.primitives.getMeshMixin();
AFRAME.registerPrimitive('a-locomotor', extendDeep({}, meshMixin, {
  // Preset default components. These components and component properties will be attached to the entity out-of-the-box.
  defaultComponents: {
    geometry: {
      primitive: 'sphere',
      radius: 2.5
    },
    material: {
      visible: false
    },
    grabbable: {
      usePhysics: 'never',
      invert: true,
      suppressY: true
    },
    stretchable: {
      invert: true
    },
    'locomotor-auto-config': {}
  },
  mappings: {
    'fetch-camera': 'locomotor-auto-config.camera',
    'add-to-colliders': 'locomotor-auto-config.collider',
    'allow-movement': 'locomotor-auto-config.move',
    'horizontal-only': 'grabbable.suppressY',
    'allow-scaling': 'locomotor-auto-config.stretch'
  }
}));

},{}],4:[function(require,module,exports){
/* global AFRAME */
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
  start: function (evt) {
    this.el.addState(this.CLICKED_STATE);
    if (this.clickers.indexOf(evt.detail.hand) === -1) {
      this.clickers.push(evt.detail.hand);
      if (evt.preventDefault) { evt.preventDefault(); }
    }
  },
  end: function (evt) {
    var handIndex = this.clickers.indexOf(evt.detail.hand);
    if (handIndex !== -1) {
      this.clickers.splice(handIndex, 1);
    }
    if (this.clickers.length < 1) {
      this.el.removeState(this.CLICKED_STATE);
    }
  }
});

},{}],5:[function(require,module,exports){
/* global AFRAME */
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
  hoverStart: function (evt) {
    this.el.addState(this.HOVERED_STATE);
    if (evt.preventDefault) { evt.preventDefault(); }
  },
  dragStart: function (evt) {
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

},{}],6:[function(require,module,exports){
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
        let newCon = new window.CANNON.LockConstraint(
          this.el.body, evt.detail.hand.body
        );
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

},{}],7:[function(require,module,exports){
/* global AFRAME */
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
  start: function (evt) {
    this.el.addState(this.HOVERED_STATE);
    if (this.hoverers.indexOf(evt.detail.hand) === -1) {
      this.hoverers.push(evt.detail.hand);
    }
    if (evt.preventDefault) { evt.preventDefault(); }
  },
  end: function (evt) {
    var handIndex = this.hoverers.indexOf(evt.detail.hand);
    if (handIndex !== -1) {
      this.hoverers.splice(handIndex, 1);
    }
    if (this.hoverers.length < 1) {
      this.el.removeState(this.HOVERED_STATE);
    }
  }
});

},{}],8:[function(require,module,exports){
/* global AFRAME */
AFRAME.registerComponent('locomotor-auto-config', {
  schema: {
    camera: {default: true},
    stretch: {default: true},
    move: {default: true},
    collider: {default: true}
  },
  init: function () {
    let ready = true;
    if (!this.data.stretch) {
      this.el.removeComponent('stretchable');
    }
    if (!this.data.move) {
      this.el.removeComponent('grabbable');
    }
    if (this.data.collider) {
      // make sure locomotor is collidable
      this.el.childNodes.forEach(el => {
        let col = el.getAttribute && el.getAttribute('sphere-collider');
        if (col && col.objects.indexOf('a-locomotor') === -1) {
          el.setAttribute('sphere-collider', {
            objects: (col.objects === '')
                // empty objects property will collide with everything
                ? col.objects
                // otherwise add self to selector string
                : col.objects + ', a-locomotor'
          });
        }
      });
    }
    if (this.data.camera) {
      // this step has to be done asnychronously
      ready = false;
      // make default camera child of locomotor so it can be moved
      this.el.sceneEl.addEventListener('camera-ready', e => {
        var defCam = document.querySelector('[data-aframe-default-camera]');
        if (defCam) {
          // re-parenting resets the userHeight, so save and add it back
          const camComp = defCam.getAttribute('camera');
          const uh = (camComp && camComp.userHeight) ? camComp.userHeight : 1.6;
          this.el.appendChild(defCam);
          // put the attribute change on the stack to make it work in FF
          window.setTimeout(
            () => {
              defCam.setAttribute('camera', {userHeight: uh});
              this.ready();
            },
            0
          );
        }
      });
    }
    if (ready) {
      this.ready();
    }
  },
  ready: function () {
    this.el.emit('locomotor-ready', {});
  }
});

},{}],9:[function(require,module,exports){
/* global AFRAME, THREE */
AFRAME.registerComponent('stretchable', {
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
  tick: function () {
    if (!this.stretched) { return; }
    let scale = new THREE.Vector3().copy(this.el.getAttribute('scale'));
    const handPos = new THREE.Vector3()
        .copy(this.stretchers[0].getAttribute('position'));
    const otherHandPos = new THREE.Vector3()
        .copy(this.stretchers[1].getAttribute('position'));
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
    scale = scale.multiplyScalar(deltaStretch);
    this.el.setAttribute('scale', scale);
    // force scale update for physics body
    if (this.el.body && this.data.usePhysics !== 'never') {
      var physicsShape = this.el.body.shapes[0];
      if (physicsShape.halfExtents) {
        physicsShape.halfExtents
            .scale(deltaStretch, physicsShape.halfExtents);
        physicsShape.updateConvexPolyhedronRepresentation();
      } else {
        if (!this.shapeWarned) {
          console.warn('Unable to stretch physics body: unsupported shape');
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
  start: function (evt) {
    if (this.stretched || this.stretchers.includes(evt.detail.hand)) {
      return;
    } // already stretched or already captured this hand
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
    if (stretcherIndex === -1) { return; }
    this.stretchers.splice(stretcherIndex, 1);
    this.stretched = false;
    this.el.removeState(this.STRETCHED_STATE);
  }
});

},{}],10:[function(require,module,exports){
/* global AFRAME */
AFRAME.registerSystem('super-hands', {
  init: function () {
    this.superHands = [];
  },
  registerMe: function (comp) {
    // when second hand registers, store links
    if (this.superHands.length === 1) {
      this.superHands[0].otherSuperHand = comp;
      comp.otherSuperHand = this.superHands[0];
    }
    this.superHands.push(comp);
  },
  unregisterMe: function (comp) {
    var index = this.superHands.indexOf(comp);
    if (index !== -1) {
      this.superHands.splice(index, 1);
    }
    this.superHands.forEach(x => {
      if (x.otherSuperHand === comp) { x.otherSuperHand = null; }
    });
  }
});

},{}]},{},[1]);
