(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

require('../index.js');
require('aframe-motion-capture-components');
/* used in examples to allow a desktop playback without HMD
   defined here to keep example files clear of clutter */
window.playDemoRecording = function (spectate) {
  let l = document.querySelector('a-link, a-entity[link]');
  let s = document.querySelector('a-scene');
  let b = document.getElementById('replayer-button');
  b && b.setAttribute('visible', 'false');
  l && l.setAttribute('visible', 'false');
  s.addEventListener('replayingstopped', e => {
    let c = document.querySelector('[camera]');
    window.setTimeout(function () {
      c.setAttribute('position', '0 1.6 2');
      c.setAttribute('rotation', '0 0 0');
    });
  });
  s.setAttribute('avatar-replayer', {
    src: './demo-recording.json',
    spectatorMode: spectate === undefined ? true : spectate,
    spectatorPosition: { x: 0, y: 1.6, z: 2 }
  });
};

},{"../index.js":2,"aframe-motion-capture-components":11}],2:[function(require,module,exports){
'use strict';

/* global AFRAME */

if (typeof AFRAME === 'undefined') {
  throw new Error('Component attempted to register before AFRAME was available.');
}

require('./systems/super-hands-system.js');
require('./reaction_components/hoverable.js');
require('./reaction_components/grabbable.js');
require('./reaction_components/stretchable.js');
require('./reaction_components/drag-droppable.js');
require('./reaction_components/draggable.js');
require('./reaction_components/droppable.js');
require('./reaction_components/clickable.js');
require('./misc_components/locomotor-auto-config.js');
require('./misc_components/progressive-controls.js');
require('./primitives/a-locomotor.js');

/**
 * Super Hands component for A-Frame.
 */
AFRAME.registerComponent('super-hands', {
  schema: {
    colliderState: { default: '' },
    colliderEvent: { default: 'hit' },
    colliderEventProperty: { default: 'el' },
    colliderEndEvent: { default: 'hitend' },
    colliderEndEventProperty: { default: 'el' },
    grabStartButtons: {
      default: ['gripdown', 'trackpaddown', 'triggerdown', 'gripclose', 'abuttondown', 'bbuttondown', 'xbuttondown', 'ybuttondown', 'pointup', 'thumbup', 'pointingstart', 'pistolstart', 'thumbstickdown', 'mousedown', 'touchstart']
    },
    grabEndButtons: {
      default: ['gripup', 'trackpadup', 'triggerup', 'gripopen', 'abuttonup', 'bbuttonup', 'xbuttonup', 'ybuttonup', 'pointdown', 'thumbdown', 'pointingend', 'pistolend', 'thumbstickup', 'mouseup', 'touchend']
    },
    stretchStartButtons: {
      default: ['gripdown', 'trackpaddown', 'triggerdown', 'gripclose', 'abuttondown', 'bbuttondown', 'xbuttondown', 'ybuttondown', 'pointup', 'thumbup', 'pointingstart', 'pistolstart', 'thumbstickdown', 'mousedown', 'touchstart']
    },
    stretchEndButtons: {
      default: ['gripup', 'trackpadup', 'triggerup', 'gripopen', 'abuttonup', 'bbuttonup', 'xbuttonup', 'ybuttonup', 'pointdown', 'thumbdown', 'pointingend', 'pistolend', 'thumbstickup', 'mouseup', 'touchend']
    },
    dragDropStartButtons: {
      default: ['gripdown', 'trackpaddown', 'triggerdown', 'gripclose', 'abuttondown', 'bbuttondown', 'xbuttondown', 'ybuttondown', 'pointup', 'thumbup', 'pointingstart', 'pistolstart', 'thumbstickdown', 'mousedown', 'touchstart']
    },
    dragDropEndButtons: {
      default: ['gripup', 'trackpadup', 'triggerup', 'gripopen', 'abuttonup', 'bbuttonup', 'xbuttonup', 'ybuttonup', 'pointdown', 'thumbdown', 'pointingend', 'pistolend', 'thumbstickup', 'mouseup', 'touchend']
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
    this.hoverElsDist = [];
    this.state = new Map();
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
    if (this.data.colliderState.length) {
      console.warn('super-hands colliderState property is deprecated. Use colliderEndEvent/colliderEndEventProperty instead');
    }
    this.unRegisterListeners(oldData);
    this.registerListeners();
  },

  /**
   * Called when a component is removed (e.g., via removeAttribute).
   * Generally undoes all modifications to the entity.
   */
  remove: function () {
    this.system.unregisterMe(this);
    this.unRegisterListeners();
    // cleanup states
    this.hoverEls.forEach(h => {
      h.removeEventListener('stateremoved', this.unWatch);
    });
    this.hoverEls.length = 0;
    if (this.state.get(this.HOVER_EVENT)) {
      this._unHover(this.state.get(this.HOVER_EVENT));
    }
    this.onGrabEndButton();
    this.onStretchEndButton();
    this.onDragDropEndButton();
  },
  /**
   * Called when entity pauses.
   * Use to stop or remove any dynamic or background behavior such as events.
   */
  pause: function () {},

  /**
   * Called when entity resumes.
   * Use to continue or add any dynamic or background behavior such as events.
   */
  play: function () {},
  onGrabStartButton: function (evt) {
    let carried = this.state.get(this.GRAB_EVENT);
    this.dispatchMouseEventAll('mousedown', this.el);
    this.gehClicking = new Set(this.hoverEls);
    if (!carried) {
      carried = this.findTarget(this.GRAB_EVENT, {
        hand: this.el,
        buttonEvent: evt
      });
      if (carried) {
        this.state.set(this.GRAB_EVENT, carried);
        this._unHover(carried);
      }
    }
  },
  onGrabEndButton: function (evt) {
    const clickables = this.hoverEls.filter(h => this.gehClicking.has(h));
    const grabbed = this.state.get(this.GRAB_EVENT);
    const endEvt = { hand: this.el, buttonEvent: evt };
    this.dispatchMouseEventAll('mouseup', this.el);
    for (let i = 0; i < clickables.length; i++) {
      this.dispatchMouseEvent(clickables[i], 'click', this.el);
    }
    this.gehClicking.clear();
    // check if grabbed entity accepts ungrab event
    if (grabbed && !this.emitCancelable(grabbed, this.UNGRAB_EVENT, endEvt)) {
      /* push to top of stack so a drop followed by re-grab gets the same
         target */
      this.promoteHoveredEl(this.state.get(this.GRAB_EVENT));
      this.state.delete(this.GRAB_EVENT);
      this.hover();
    }
  },
  onStretchStartButton: function (evt) {
    let stretched = this.state.get(this.STRETCH_EVENT);
    if (!stretched) {
      stretched = this.findTarget(this.STRETCH_EVENT, {
        hand: this.el,
        buttonEvent: evt
      });
      if (stretched) {
        this.state.set(this.STRETCH_EVENT, stretched);
        this._unHover(stretched);
      }
    }
  },
  onStretchEndButton: function (evt) {
    const stretched = this.state.get(this.STRETCH_EVENT);
    const endEvt = { hand: this.el, buttonEvent: evt };
    // check if end event accepted
    if (stretched && !this.emitCancelable(stretched, this.UNSTRETCH_EVENT, endEvt)) {
      this.promoteHoveredEl(stretched);
      this.state.delete(this.STRETCH_EVENT);
      this.hover();
    }
  },
  onDragDropStartButton: function (evt) {
    let dragged = this.state.get(this.DRAG_EVENT);
    this.dragging = true;
    if (this.hoverEls.length) {
      this.gehDragged = new Set(this.hoverEls);
      this.dispatchMouseEventAll('dragstart', this.el);
    }
    if (!dragged) {
      /* prefer carried so that a drag started after a grab will work
       with carried element rather than a currently intersected drop target.
       fall back to queue in case a drag is initiated independent
       of a grab */
      if (this.state.get(this.GRAB_EVENT) && !this.emitCancelable(this.state.get(this.GRAB_EVENT), this.DRAG_EVENT, { hand: this.el, buttonEvent: evt })) {
        dragged = this.state.get(this.GRAB_EVENT);
      } else {
        dragged = this.findTarget(this.DRAG_EVENT, {
          hand: this.el,
          buttonEvent: evt
        });
      }
      if (dragged) {
        this.state.set(this.DRAG_EVENT, dragged);
        this._unHover(dragged);
      }
    }
  },
  onDragDropEndButton: function (evt) {
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
      const ddEvt = {
        hand: this.el,
        dropped: carried,
        on: null,
        buttonEvent: evt
      };
      const endEvt = { hand: this.el, buttonEvent: evt };
      const dropTarget = this.findTarget(this.DRAGDROP_EVENT, ddEvt, true);
      if (dropTarget) {
        ddEvt.on = dropTarget;
        this.emitCancelable(carried, this.DRAGDROP_EVENT, ddEvt);
        this._unHover(dropTarget);
      }
      // check if end event accepted
      if (!this.emitCancelable(carried, this.UNDRAG_EVENT, endEvt)) {
        this.promoteHoveredEl(carried);
        this.state.delete(this.DRAG_EVENT);
        this.hover();
      }
    }
  },
  onHit: function (evt) {
    const hitEl = evt.detail[this.data.colliderEventProperty];
    var processHitEl = (hitEl, distance) => {
      let hitElIndex;
      hitElIndex = this.hoverEls.indexOf(hitEl);
      if (hitElIndex === -1) {
        // insert in order of distance when available
        if (distance) {
          let i = 0;
          const dists = this.hoverElsDist;
          while (distance < dists[i] && i < dists.length) {
            i++;
          }
          this.hoverEls.splice(i, 0, hitEl);
          this.hoverElsDist.splice(i, 0, distance);
        } else {
          this.hoverEls.push(hitEl);
          this.hoverElsDist.push(null);
        }
        // later loss of collision will remove from hoverEls
        hitEl.addEventListener('stateremoved', this.unWatch);
        this.dispatchMouseEvent(hitEl, 'mouseover', this.el);
        if (this.dragging && this.gehDragged.size) {
          // events on targets and on dragged
          this.gehDragged.forEach(dragged => {
            this.dispatchMouseEventAll('dragenter', dragged, true, true);
          });
        }
        this.hover();
      }
    };
    if (!hitEl) {
      return;
    }
    if (Array.isArray(hitEl)) {
      for (let i = 0, dist; i < hitEl.length; i++) {
        dist = evt.detail.intersections && evt.detail.intersections[i].distance;
        processHitEl(hitEl[i], dist);
      }
      hitEl.forEach(processHitEl);
    } else {
      processHitEl(hitEl, null);
    }
  },
  /* search collided entities for target to hover/dragover */
  hover: function () {
    var hvrevt, hoverEl;
    // end previous hover
    if (this.state.has(this.HOVER_EVENT)) {
      this._unHover(this.state.get(this.HOVER_EVENT), true);
    }
    if (this.state.has(this.DRAGOVER_EVENT)) {
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
        hoverEl.addEventListener('stateremoved', this.unHover);
        this.emitCancelable(this.state.get(this.DRAG_EVENT), this.DRAGOVER_EVENT, hvrevt);
        this.state.set(this.DRAGOVER_EVENT, hoverEl);
      }
    }
    // fallback to hover if not dragging or dragover wasn't successful
    if (!this.state.has(this.DRAGOVER_EVENT)) {
      hoverEl = this.findTarget(this.HOVER_EVENT, { hand: this.el }, true);
      if (hoverEl) {
        hoverEl.addEventListener('stateremoved', this.unHover);
        this.state.set(this.HOVER_EVENT, hoverEl);
      }
    }
  },
  /* tied to 'stateremoved' event for hovered entities,
     called when controller moves out of collision range of entity */
  unHover: function (evt) {
    const clearedEls = evt.detail[this.data.colliderEndEventProperty];
    if (clearedEls) {
      if (Array.isArray(clearedEls)) {
        clearedEls.forEach(el => this._unHover(el));
      } else {
        this._unHover(clearedEls);
      }
    } else if (evt.detail.state === this.data.colliderState) {
      this._unHover(evt.target);
    }
  },
  /* inner unHover steps needed regardless of cause of unHover */
  _unHover: function (el, skipNextHover) {
    let unHovered = false;
    let evt;
    el.removeEventListener('stateremoved', this.unHover);
    if (el === this.state.get(this.DRAGOVER_EVENT)) {
      this.state.delete(this.DRAGOVER_EVENT);
      unHovered = true;
      evt = {
        hand: this.el,
        hovered: el,
        carried: this.state.get(this.DRAG_EVENT)
      };
      this.emitCancelable(el, this.UNDRAGOVER_EVENT, evt);
      if (this.state.has(this.DRAG_EVENT)) {
        this.emitCancelable(this.state.get(this.DRAG_EVENT), this.UNDRAGOVER_EVENT, evt);
      }
    }
    if (el === this.state.get(this.HOVER_EVENT)) {
      this.state.delete(this.HOVER_EVENT);
      unHovered = true;
      this.emitCancelable(el, this.UNHOVER_EVENT, { hand: this.el });
    }
    // activate next target, if present
    if (unHovered && !skipNextHover) {
      this.hover();
    }
  },
  unWatch: function (evt) {
    const clearedEls = evt.detail[this.data.colliderEndEventProperty];
    if (clearedEls) {
      if (Array.isArray(clearedEls)) {
        clearedEls.forEach(el => this._unWatch(el));
      } else {
        // deprecation path: aframe <=0.7.0 / sphere-collider
        this._unWatch(clearedEls);
      }
    } else if (evt.detail.state === this.data.colliderState) {
      // deprecation path: sphere-collider <=3.11.4
      this._unWatch(evt.target);
    }
  },
  _unWatch: function (target) {
    var hoverIndex = this.hoverEls.indexOf(target);
    target.removeEventListener('stateremoved', this.unWatch);
    if (hoverIndex !== -1) {
      this.hoverEls.splice(hoverIndex, 1);
      this.hoverElsDist.splice(hoverIndex, 1);
    }
    this.gehDragged.forEach(dragged => {
      this.dispatchMouseEvent(target, 'dragleave', dragged);
      this.dispatchMouseEvent(dragged, 'dragleave', target);
    });
    this.dispatchMouseEvent(target, 'mouseout', this.el);
  },
  registerListeners: function () {
    this.el.addEventListener(this.data.colliderEvent, this.onHit);
    this.el.addEventListener(this.data.colliderEndEvent, this.unWatch);
    this.el.addEventListener(this.data.colliderEndEvent, this.unHover);

    // binding order to keep grabEnd from triggering dragover
    // again before dragDropEnd can delete its carried state
    this.data.grabStartButtons.forEach(b => {
      this.el.addEventListener(b, this.onGrabStartButton);
    });
    this.data.stretchStartButtons.forEach(b => {
      this.el.addEventListener(b, this.onStretchStartButton);
    });
    this.data.dragDropStartButtons.forEach(b => {
      this.el.addEventListener(b, this.onDragDropStartButton);
    });
    this.data.dragDropEndButtons.forEach(b => {
      this.el.addEventListener(b, this.onDragDropEndButton);
    });
    this.data.stretchEndButtons.forEach(b => {
      this.el.addEventListener(b, this.onStretchEndButton);
    });
    this.data.grabEndButtons.forEach(b => {
      this.el.addEventListener(b, this.onGrabEndButton);
    });
  },
  unRegisterListeners: function (data) {
    data = data || this.data;
    if (Object.keys(data).length === 0) {
      // Empty object passed on initalization
      return;
    }
    this.el.removeEventListener(data.colliderEvent, this.onHit);
    this.el.removeEventListener(data.colliderEndEvent, this.unHover);
    this.el.removeEventListener(data.colliderEndEvent, this.unWatch);

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
      els = els.filter(el => el !== this.state.get(this.GRAB_EVENT) && el !== this.state.get(this.DRAG_EVENT) && el !== this.state.get(this.STRETCH_EVENT) && !this.gehDragged.has(el));
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
      eligibleEls = eligibleEls.filter(el => el !== this.state.get(this.GRAB_EVENT) && el !== this.state.get(this.DRAG_EVENT) && el !== this.state.get(this.STRETCH_EVENT));
    }
    for (elIndex = eligibleEls.length - 1; elIndex >= 0; elIndex--) {
      if (!this.emitCancelable(eligibleEls[elIndex], evType, detail)) {
        return eligibleEls[elIndex];
      }
    }
    return null;
  },
  // Helper to ensure dropping and regrabbing finds the same target for
  // for order-sorted hoverEls (grabbing; no-op for distance-sorted (pointing)
  promoteHoveredEl: function (el) {
    var hoverIndex = this.hoverEls.indexOf(el);
    if (hoverIndex !== -1 && this.hoverElsDist[hoverIndex] == null) {
      this.hoverEls.splice(hoverIndex, 1);
      this.hoverElsDist.splice(hoverIndex, 1);
      this.hoverEls.push(el);
      this.hoverElsDist.push(null);
    }
  }
});

},{"./misc_components/locomotor-auto-config.js":3,"./misc_components/progressive-controls.js":4,"./primitives/a-locomotor.js":14,"./reaction_components/clickable.js":15,"./reaction_components/drag-droppable.js":16,"./reaction_components/draggable.js":17,"./reaction_components/droppable.js":18,"./reaction_components/grabbable.js":19,"./reaction_components/hoverable.js":20,"./reaction_components/stretchable.js":24,"./systems/super-hands-system.js":25}],3:[function(require,module,exports){
'use strict';

/* global AFRAME */
AFRAME.registerComponent('locomotor-auto-config', {
  schema: {
    camera: { default: true },
    stretch: { default: true },
    move: { default: true }
  },
  dependencies: ['grabbable', 'stretchable'],
  init: function () {
    this.ready = false;
    if (this.data.camera) {
      if (!document.querySelector('a-camera, [camera]')) {
        let cam = document.createElement('a-camera');
        cam.setAttribute('position', '0 1.6 0');
        this.el.appendChild(cam);
      }
    }
    this.fakeCollisions();
    // for controllers added later
    this.fakeCollisionsB = this.fakeCollisions.bind(this);
    this.el.addEventListener('controllerconnected', this.fakeCollisionsB);
  },
  update: function () {
    if (this.el.getAttribute('stretchable') && !this.data.stretch) {
      // store settings for resetting
      this.stretchSet = this.el.getAttribute('stretchable');
      this.el.removeAttribute('stretchable');
    } else if (!this.el.getAttribute('stretchable') && this.data.stretch) {
      this.el.setAttribute('stretchable', this.stretchSet);
    }
    if (this.el.getAttribute('grabbable') && !this.data.move) {
      // store settings for resetting
      this.grabSet = this.el.getAttribute('grabbable');
      this.el.removeAttribute('grabbable');
    } else if (!this.el.getAttribute('grabbable') && this.data.move) {
      this.el.setAttribute('grabbable', this.grabSet);
    }
  },
  remove: function () {
    this.el.getChildEntities().forEach(el => {
      let sh = el.getAttribute('super-hands');
      if (sh) {
        let evtDetails = {};
        evtDetails[sh.colliderEndEventProperty] = this.el;
        el.emit(sh.colliderEndEvent, evtDetails);
      }
    });
    this.el.removeEventListener('controllerconnected', this.fakeCollisionsB);
  },
  announceReady: function () {
    if (!this.ready) {
      this.ready = true;
      this.el.emit('locomotor-ready', {});
    }
  },
  fakeCollisions: function () {
    this.el.getChildEntities().forEach(el => {
      let sh = el.getAttribute('super-hands');
      if (sh) {
        // generate fake collision to be permanently in super-hands queue
        let evtDetails = {};
        evtDetails[sh.colliderEventProperty] = this.el;
        el.emit(sh.colliderEvent, evtDetails);
        this.colliderState = sh.colliderState;
        this.el.addState(this.colliderState);
      }
    });
    this.announceReady();
  }
});

},{}],4:[function(require,module,exports){
'use strict';

/* global AFRAME */
const gazeDefaultId = 'progressivecontrolsgazedefault';
const pointDefaultId = 'progressivecontrolspointdefault';
const touchDefaultId = 'progressivecontrolstouchdefault';

AFRAME.registerComponent('progressive-controls', {
  schema: {
    maxLevel: { default: 'touch', oneOf: ['gaze', 'point', 'touch'] },
    gazeMixin: { default: '' },
    pointMixin: { default: '' },
    touchMixin: { default: '' },
    override: { default: false },
    objects: { default: '' },
    controllerModel: { default: true }
  },
  init: function () {
    // deprecation path: AFRAME v0.8.0 prerelease not reporting new version number
    // use this condition after v0.8.0 release: parseFloat(AFRAME.version) < 0.8
    const rayEndProp = !AFRAME.components.link.schema.titleColor ? 'el' : 'clearedEls';

    this.levels = ['gaze', 'point', 'touch'];
    this.currentLevel = new Map();
    this.controllerName = new Map();

    // setup mixins for defaults
    const assets = this.el.sceneEl.querySelector('a-assets') || this.el.sceneEl.appendChild(document.createElement('a-assets'));
    const gazeDefault = this.gazeDefault = document.createElement('a-mixin');
    const shRayConfig = AFRAME.utils.styleParser.stringify({
      colliderEvent: 'raycaster-intersection',
      colliderEventProperty: 'els',
      colliderEndEvent: 'raycaster-intersection-cleared',
      colliderEndEventProperty: rayEndProp,
      colliderState: ''
    });
    gazeDefault.setAttribute('id', gazeDefaultId);
    gazeDefault.setAttribute('geometry', 'primitive: ring;' + 'radiusOuter: 0.008; radiusInner: 0.005; segmentsTheta: 32');
    gazeDefault.setAttribute('material', 'color: #000; shader: flat');
    gazeDefault.setAttribute('position', '0 0 -0.5');
    gazeDefault.setAttribute('raycaster', '');
    gazeDefault.setAttribute('super-hands', shRayConfig);
    const pointDefault = this.pointDefault = document.createElement('a-mixin');
    pointDefault.setAttribute('id', pointDefaultId);
    pointDefault.setAttribute('raycaster', 'showLine: true');
    pointDefault.setAttribute('super-hands', shRayConfig);
    const touchDefault = this.touchDefault = document.createElement('a-mixin');
    touchDefault.setAttribute('id', touchDefaultId);
    touchDefault.setAttribute('super-hands', '');
    touchDefault.setAttribute('sphere-collider', '');
    if (this.el.sceneEl.getAttribute('physics')) {
      const physicsBodyDefault = 'shape: sphere; sphereRadius: 0.02';
      pointDefault.setAttribute('static-body', physicsBodyDefault);
      gazeDefault.setAttribute('static-body', physicsBodyDefault);
      touchDefault.setAttribute('static-body', physicsBodyDefault);
    }
    assets.appendChild(gazeDefault);
    assets.appendChild(pointDefault);
    assets.appendChild(touchDefault);

    this.camera = this.el.querySelector('a-camera,[camera]');
    if (!this.camera) {
      this.camera = this.el.appendChild(document.createElement('a-camera'));
      this.camera.setAttribute('position', '0 1.6 0');
    }
    this.caster = this.camera.querySelector('.gazecaster') || this.camera.appendChild(document.createElement('a-entity'));
    ['left', 'right'].forEach(hand => {
      // find controller by left-controller/right-controller class or create one
      this[hand] = this.el.querySelector('.' + hand + '-controller') || this.el.appendChild(document.createElement('a-entity'));
      const ctrlrCompConfig = {
        hand: hand,
        model: this.data.controllerModel
      };
      ['daydream-controls', 'gearvr-controls', 'oculus-touch-controls', 'vive-controls', 'windows-motion-controls'].forEach(ctrlr => this[hand].setAttribute(ctrlr, ctrlrCompConfig));
    });
    this.el.addEventListener('controllerconnected', e => this.detectLevel(e));
    this.eventRepeaterB = this.eventRepeater.bind(this);
    // pass mouse and touch events into the scene
    this.addEventListeners();
    // default level
    this.currentLevel.set('right', 0);
  },
  update: function (oldData) {
    const objs = { objects: this.data.objects };
    updateMixin(this.gazeDefault, 'raycaster', objs);
    updateMixin(this.pointDefault, 'raycaster', objs);
    updateMixin(this.touchDefault, 'sphere-collider', objs);
    // async updates due to aframevr/aframe#3200
    // force setLevel refresh with new params
    for (let [hand, level] of this.currentLevel) {
      window.setTimeout(() => this.setLevel(level, hand, true));
    }
  },
  remove: function () {
    if (!this.eventsRegistered) {
      return;
    }
    const canv = this.el.sceneEl.canvas;
    canv.removeEventListener('mousedown', this.eventRepeaterB);
    canv.removeEventListener('mouseup', this.eventRepeaterB);
    canv.removeEventListener('touchstart', this.eventRepeaterB);
    canv.removeEventListener('touchend', this.eventRepeaterB);
  },
  setLevel: function (newLevel, hand, force) {
    hand = hand || 'right';
    const maxLevel = this.levels.indexOf(this.data.maxLevel);
    const currentHand = this[hand];
    const override = this.data.override;
    newLevel = newLevel > maxLevel ? maxLevel : newLevel;
    if (newLevel === this.currentLevel.get(hand) && !force) {
      return;
    }
    if (newLevel !== 0 && this.caster) {
      // avoids error where physics system tries to tick on removed entity
      this.caster.setAttribute('mixin', '');
      this.camera.removeChild(this.caster);
      this.caster = null;
    }
    switch (newLevel) {
      case this.levels.indexOf('gaze'):
        const gazeMixin = this.data.gazeMixin;
        this.caster.setAttribute('mixin', (override && gazeMixin.length ? '' : gazeDefaultId + ' ') + gazeMixin);
        break;
      case this.levels.indexOf('point'):
        const ctrlrName = this.controllerName.get(hand);
        const ctrlrCfg = this.controllerConfig[ctrlrName];
        const pntMixin = this.data.pointMixin;
        if (ctrlrCfg && ctrlrCfg.raycaster) {
          currentHand.setAttribute('raycaster', ctrlrCfg.raycaster);
        }
        currentHand.setAttribute('mixin', (override && pntMixin.length ? '' : pointDefaultId + ' ') + pntMixin);
        break;
      case this.levels.indexOf('touch'):
        const tchMixin = this.data.touchMixin;
        currentHand.setAttribute('mixin', (override && tchMixin.length ? '' : touchDefaultId + ' ') + tchMixin);
        break;
    }
    this.currentLevel.set(hand, newLevel);
    this.el.emit('controller-progressed', {
      level: this.levels[newLevel],
      hand: hand
    });
  },
  detectLevel: function (evt) {
    const DOF6 = ['vive-controls', 'oculus-touch-controls', 'windows-motion-controls'];
    const DOF3 = ['gearvr-controls', 'daydream-controls'];
    const hand = evt.detail.component.data.hand || 'right';
    this.controllerName.set(hand, evt.detail.name);
    if (DOF6.indexOf(evt.detail.name) !== -1) {
      this.setLevel(this.levels.indexOf('touch'), hand);
    } else if (DOF3.indexOf(evt.detail.name) !== -1) {
      this.setLevel(this.levels.indexOf('point'), hand);
    }
  },
  eventRepeater: function (evt) {
    if (!this.caster) {
      return;
    } // only for gaze mode
    if (evt.type.startsWith('touch')) {
      evt.preventDefault();
      // avoid repeating touchmove because it interferes with look-controls
      if (evt.type === 'touchmove') {
        return;
      }
    }
    this.caster.emit(evt.type, evt.detail);
  },
  addEventListeners: function () {
    if (!this.el.sceneEl.canvas) {
      this.el.sceneEl.addEventListener('loaded', this.addEventListeners.bind(this));
      return;
    }
    this.el.sceneEl.canvas.addEventListener('mousedown', this.eventRepeaterB);
    this.el.sceneEl.canvas.addEventListener('mouseup', this.eventRepeaterB);
    this.el.sceneEl.canvas.addEventListener('touchstart', this.eventRepeaterB);
    this.el.sceneEl.canvas.addEventListener('touchmove', this.eventRepeaterB);
    this.el.sceneEl.canvas.addEventListener('touchend', this.eventRepeaterB);
    this.eventsRegistered = true;
  },
  controllerConfig: {
    'gearvr-controls': {
      raycaster: { origin: { x: 0, y: 0.0005, z: 0 } }
    },
    'oculus-touch-controls': {
      raycaster: { origin: { x: 0.001, y: 0, z: 0.065 }, direction: { x: 0, y: -0.8, z: -1 } }
    }
  }
});

function updateMixin(mixin, attr, additions) {
  const stringify = AFRAME.utils.styleParser.stringify;
  const extend = AFRAME.utils.extend;
  const old = mixin.getAttribute(attr);
  if (old) {
    mixin.setAttribute(attr, stringify(extend(old, additions)));
  }
}

},{}],5:[function(require,module,exports){
/* global THREE, AFRAME  */
var constants = require('../constants');
var log = AFRAME.utils.debug('aframe-motion-capture:avatar-recorder:info');
var warn = AFRAME.utils.debug('aframe-motion-capture:avatar-recorder:warn');

/**
 * Wrapper around individual motion-capture-recorder components for recording camera and
 * controllers together.
 */
AFRAME.registerComponent('avatar-recorder', {
  schema: {
    autoPlay: {default: false},
    autoRecord: {default: false},
    cameraOverride: {type: 'selector'},
    localStorage: {default: true},
    recordingName: {default: constants.DEFAULT_RECORDING_NAME},
    loop: {default: true}
  },

  init: function () {
    this.cameraEl = null;
    this.isRecording = false;
    this.trackedControllerEls = {};
    this.recordingData = null;

    this.onKeyDown = AFRAME.utils.bind(this.onKeyDown, this);
    this.tick = AFRAME.utils.throttle(this.throttledTick, 100, this);
  },

  /**
   * Poll for tracked controllers.
   */
  throttledTick: function () {
    var self = this;
    var trackedControllerEls = this.el.querySelectorAll('[tracked-controls]');
    this.trackedControllerEls = {};
    trackedControllerEls.forEach(function setupController (trackedControllerEl) {
      if (!trackedControllerEl.id) {
        warn('Found a tracked controller entity without an ID. ' +
             'Provide an ID or this controller will not be recorded');
        return;
      }
      trackedControllerEl.setAttribute('motion-capture-recorder', {
        autoRecord: false,
        visibleStroke: false
      });
      self.trackedControllerEls[trackedControllerEl.id] = trackedControllerEl;
      if (self.isRecording) {
        trackedControllerEl.components['motion-capture-recorder'].startRecording();
      }
    });
  },

  play: function () {
    window.addEventListener('keydown', this.onKeyDown);
  },

  pause: function () {
    window.removeEventListener('keydown', this.onKeyDown);
  },

  /**
   * Keyboard shortcuts.
   */
  onKeyDown: function (evt) {
    var key = evt.keyCode;
    var KEYS = {space: 32};
    switch (key) {
      // <space>: Toggle recording.
      case KEYS.space: {
        this.toggleRecording();
        break;
      }
    }
  },

  /**
   * Start or stop recording.
   */
  toggleRecording: function () {
    if (this.isRecording) {
      this.stopRecording();
    } else {
      this.startRecording();
    }
  },

  /**
   * Set motion capture recorder on the camera once the camera is ready.
   */
  setupCamera: function (doneCb) {
    var el = this.el;
    var self = this;

    if (this.data.cameraOverride) {
      prepareCamera(this.data.cameraOverride);
      return;
    }

    // Grab camera.
    if (el.camera && el.camera.el) {
      prepareCamera(el.camera.el);
      return;
    }

    el.addEventListener('camera-set-active', function setup (evt) {
      prepareCamera(evt.detail.cameraEl);
      el.removeEventListener('camera-set-active', setup);
    });

    function prepareCamera (cameraEl) {
      if (self.cameraEl) {
        self.cameraEl.removeAttribute('motion-capture-recorder');
      }
      self.cameraEl = cameraEl;
      cameraEl.setAttribute('motion-capture-recorder', {
        autoRecord: false,
        visibleStroke: false
      });
      doneCb(cameraEl)
    }
  },

  /**
   * Start recording camera and tracked controls.
   */
  startRecording: function () {
    var trackedControllerEls = this.trackedControllerEls;
    var self = this;

    if (this.isRecording) { return; }

    log('Starting recording!');

    if (this.el.components['avatar-replayer']) {
      this.el.components['avatar-replayer'].stopReplaying();
    }

    // Get camera.
    this.setupCamera(function cameraSetUp () {
      self.isRecording = true;
      // Record camera.
      self.cameraEl.components['motion-capture-recorder'].startRecording();
      // Record tracked controls.
      Object.keys(trackedControllerEls).forEach(function startRecordingController (id) {
        trackedControllerEls[id].components['motion-capture-recorder'].startRecording();
      });
    });
  },

  /**
   * Tell camera and tracked controls motion-capture-recorder components to stop recording.
   * Store recording and replay if autoPlay is on.
   */
  stopRecording: function () {
    var trackedControllerEls = this.trackedControllerEls;

    if (!this.isRecording) { return; }

    log('Stopped recording.');
    this.isRecording = false;
    this.cameraEl.components['motion-capture-recorder'].stopRecording();
    Object.keys(trackedControllerEls).forEach(function (id) {
      trackedControllerEls[id].components['motion-capture-recorder'].stopRecording();
    });
    this.recordingData = this.getJSONData();
    this.storeRecording(this.recordingData);

    if (this.data.autoPlay) {
      this.replayRecording();
    }
  },

  /**
   * Gather the JSON data from the camera and tracked controls motion-capture-recorder
   * components. Combine them together, keyed by the (active) `camera` and by the
   * tracked controller IDs.
   */
  getJSONData: function () {
    var data = {};
    var trackedControllerEls = this.trackedControllerEls;

    if (this.isRecording) { return; }

    // Camera.
    data.camera = this.cameraEl.components['motion-capture-recorder'].getJSONData();

    // Tracked controls.
    Object.keys(trackedControllerEls).forEach(function getControllerData (id) {
      data[id] = trackedControllerEls[id].components['motion-capture-recorder'].getJSONData();
    });

    return data;
  },

  /**
   * Store recording in IndexedDB using recordingdb system.
   */
  storeRecording: function (recordingData) {
    var data = this.data;
    if (!data.localStorage) { return; }
    log('Recording stored in localStorage.');
    this.el.systems.recordingdb.addRecording(data.recordingName, recordingData);
  }
});

},{"../constants":10}],6:[function(require,module,exports){
/* global THREE, AFRAME  */
var constants = require('../constants');

var bind = AFRAME.utils.bind;
var error = AFRAME.utils.debug('aframe-motion-capture:avatar-replayer:error');
var log = AFRAME.utils.debug('aframe-motion-capture:avatar-replayer:info');
var warn = AFRAME.utils.debug('aframe-motion-capture:avatar-replayer:warn');

var fileLoader = new THREE.FileLoader();

AFRAME.registerComponent('avatar-replayer', {
  schema: {
    autoPlay: {default: true},
    cameraOverride: {type: 'selector'},
    loop: {default: false},
    recordingName: {default: constants.DEFAULT_RECORDING_NAME},
    spectatorMode: {default: false},
    spectatorPosition: {default: {x: 0, y: 1.6, z: 2}, type: 'vec3'},
    src: {default: ''}
  },

  init: function () {
    var sceneEl = this.el;

    // Bind methods.
    this.onKeyDown = bind(this.onKeyDown, this);

    // Prepare camera.
    this.setupCamera = bind(this.setupCamera, this);
    if (sceneEl.camera) {
      this.setupCamera();
    } else {
      sceneEl.addEventListener('camera-set-active', this.setupCamera);
    }

    if (this.data.autoPlay) {
      this.replayRecordingFromSource();
    }
  },

  update: function (oldData) {
    var data = this.data;
    var spectatorModeUrlParam;

    spectatorModeUrlParam =
      window.location.search.indexOf('spectatormode') !== -1 ||
      window.location.search.indexOf('spectatorMode') !== -1;

    // Handle toggling spectator mode. Don't run on initialization. Want to activate after
    // the player camera is initialized.
    if (oldData.spectatorMode !== data.spectatorMode ||
        spectatorModeUrlParam) {
      if (data.spectatorMode || spectatorModeUrlParam) {
        this.activateSpectatorCamera();
      } else if (oldData.spectatorMode === true) {
        this.deactivateSpectatorCamera();
      }
    }

    // Handle `src` changing.
    if (data.src && oldData.src !== data.src && data.autoPlay) {
      this.replayRecordingFromSource();
    }
  },

  play: function () {
    window.addEventListener('keydown', this.onKeyDown);
  },

  pause: function () {
    window.removeEventListener('keydown', this.onKeyDown);
  },

  remove: function () {
    this.stopReplaying();
    this.cameraEl.removeObject3D('replayerMesh');
  },

  /**
   * Grab a handle to the "original" camera.
   * Initialize spectator camera and dummy geometry for original camera.
   */
  setupCamera: function () {
    var data = this.data;
    var sceneEl = this.el;

    if (data.cameraOverride) {
      // Specify which camera is the original camera (e.g., used by Inspector).
      this.cameraEl = data.cameraOverride;
    } else {
      // Default camera.
      this.cameraEl = sceneEl.camera.el;
      // Make sure A-Frame doesn't automatically remove this camera.
      this.cameraEl.removeAttribute('data-aframe-default-camera');
    }
    this.cameraEl.setAttribute('data-aframe-avatar-replayer-camera', '');

    sceneEl.removeEventListener('camera-set-active', this.setupCamera);

    this.configureHeadGeometry();

    // Create spectator camera for either if we are in spectator mode or toggling to it.
    this.initSpectatorCamera();
  },

  /**
   * q: Toggle spectator camera.
   */
  onKeyDown: function (evt) {
    switch (evt.keyCode) {
      // q.
      case 81: {
        this.el.setAttribute('avatar-replayer', 'spectatorMode', !this.data.spectatorMode);
        break;
      }
    }
  },

  /**
   * Activate spectator camera, show replayer mesh.
   */
  activateSpectatorCamera: function () {
    var spectatorCameraEl = this.spectatorCameraEl;

    if (!spectatorCameraEl) {
      this.el.addEventListener('spectatorcameracreated',
                               bind(this.activateSpectatorCamera, this));
      return;
    }

    if (!spectatorCameraEl.hasLoaded) {
      spectatorCameraEl.addEventListener('loaded', bind(this.activateSpectatorCamera, this));
      return;
    }

    log('Activating spectator camera');
    spectatorCameraEl.setAttribute('camera', 'active', true);
    this.cameraEl.getObject3D('replayerMesh').visible = true;
  },

  /**
   * Deactivate spectator camera (by setting original camera active), hide replayer mesh.
   */
  deactivateSpectatorCamera: function () {
    log('Deactivating spectator camera');
    this.cameraEl.setAttribute('camera', 'active', true);
    this.cameraEl.getObject3D('replayerMesh').visible = false;
  },

  /**
   * Create and activate spectator camera if in spectator mode.
   */
  initSpectatorCamera: function () {
    var data = this.data;
    var sceneEl = this.el;
    var spectatorCameraEl;
    var spectatorCameraRigEl;

    // Developer-defined spectator rig.
    if (this.el.querySelector('#spectatorCameraRig')) {
      this.spectatorCameraEl = sceneEl.querySelector('#spectatorCameraRig');
      return;
    }

    // Create spectator camera rig.
    spectatorCameraRigEl = sceneEl.querySelector('#spectatorCameraRig') ||
                           document.createElement('a-entity');
    spectatorCameraRigEl.id = 'spectatorCameraRig';
    spectatorCameraRigEl.setAttribute('position', data.spectatorPosition);
    this.spectatorCameraRigEl = spectatorCameraRigEl;

    // Create spectator camera.
    spectatorCameraEl = sceneEl.querySelector('#spectatorCamera') ||
                        document.createElement('a-entity');
    spectatorCameraEl.id = 'spectatorCamera';
    spectatorCameraEl.setAttribute('camera', {active: data.spectatorMode, userHeight: 0});
    spectatorCameraEl.setAttribute('look-controls', '');
    spectatorCameraEl.setAttribute('wasd-controls', {fly: true});
    this.spectatorCameraEl = spectatorCameraEl;

    // Append rig.
    spectatorCameraRigEl.appendChild(spectatorCameraEl);
    sceneEl.appendChild(spectatorCameraRigEl);
    sceneEl.emit('spectatorcameracreated');
  },

  /**
   * Check for recording sources and play.
   */
  replayRecordingFromSource: function () {
    var data = this.data;
    var recordingdb = this.el.systems.recordingdb;;
    var recordingNames;
    var src;
    var self = this;

    // Allow override to display replayer from query param.
    if (new URLSearchParams(window.location.search).get('avatar-replayer-disabled') !== null) {
      return;
    }

    recordingdb.getRecordingNames().then(function (recordingNames) {
      // See if recording defined in query parameter.
      var queryParamSrc = self.getSrcFromSearchParam();

      // 1. Try `avatar-recorder` query parameter as recording name from IndexedDB.
      if (recordingNames.indexOf(queryParamSrc) !== -1) {
        log('Replaying `' + queryParamSrc + '` from IndexedDB.');
        recordingdb.getRecording(queryParamSrc).then(bind(self.startReplaying, self));
        return;
      }

      // 2. Use `avatar-recorder` query parameter or `data.src` as URL.
      src = queryParamSrc || self.data.src;
      if (src) {
        if (self.data.src) {
          log('Replaying from component `src`', src);
        } else if (queryParamSrc) {
          log('Replaying from query parameter `recording`', src);
        }
        self.loadRecordingFromUrl(src, false, bind(self.startReplaying, self));
        return;
      }

      // 3. Use `data.recordingName` as recording name from IndexedDB.
      if (recordingNames.indexOf(self.data.recordingName) !== -1) {
        log('Replaying `' + self.data.recordingName + '` from IndexedDB.');
        recordingdb.getRecording(self.data.recordingName).then(bind(self.startReplaying, self));
      }
    });
  },

  /**
   * Defined for test stubbing.
   */
  getSrcFromSearchParam: function () {
    var search = new URLSearchParams(window.location.search);
    return search.get('recording') || search.get('avatar-recording');
  },

  /**
   * Set player on camera and controllers (marked by ID).
   *
   * @params {object} replayData - {
   *   camera: {poses: [], events: []},
   *   [c1ID]: {poses: [], events: []},
   *   [c2ID]: {poses: [], events: []}
   * }
   */
  startReplaying: function (replayData) {
    var data = this.data;
    var self = this;
    var sceneEl = this.el;

    if (this.isReplaying) { return; }

    // Wait for camera.
    if (!this.el.camera) {
      this.el.addEventListener('camera-set-active', function waitForCamera () {
        self.startReplaying(replayData);
        self.el.removeEventListener('camera-set-active', waitForCamera);
      });
      return;
    }

    this.replayData = replayData;
    this.isReplaying = true;

    this.cameraEl.removeAttribute('motion-capture-replayer');

    Object.keys(replayData).forEach(function setReplayer (key) {
      var replayingEl;

      if (key === 'camera') {
        // Grab camera.
        replayingEl = self.cameraEl;
      } else {
        // Grab other entities.
        replayingEl = sceneEl.querySelector('#' + key);
        if (!replayingEl) {
          error('No element found with ID ' + key + '.');
          return;
        }
      }

      log('Setting motion-capture-replayer on ' + key + '.');
      replayingEl.setAttribute('motion-capture-replayer', {loop: data.loop});
      replayingEl.components['motion-capture-replayer'].startReplaying(replayData[key]);
    });
  },

  /**
   * Create head geometry for spectator mode.
   * Always created in case we want to toggle, but only visible during spectator mode.
   */
  configureHeadGeometry: function () {
    var cameraEl = this.cameraEl;
    var headMesh;
    var leftEyeMesh;
    var rightEyeMesh;
    var leftEyeBallMesh;
    var rightEyeBallMesh;

    if (cameraEl.getObject3D('mesh') || cameraEl.getObject3D('replayerMesh')) { return; }

    // Head.
    headMesh = new THREE.Mesh();
    headMesh.geometry = new THREE.BoxBufferGeometry(0.3, 0.3, 0.2);
    headMesh.material = new THREE.MeshStandardMaterial({color: 'pink'});
    headMesh.visible = this.data.spectatorMode;

    // Left eye.
    leftEyeMesh = new THREE.Mesh();
    leftEyeMesh.geometry = new THREE.SphereBufferGeometry(0.05);
    leftEyeMesh.material = new THREE.MeshBasicMaterial({color: 'white'});
    leftEyeMesh.position.x -= 0.1;
    leftEyeMesh.position.y += 0.1;
    leftEyeMesh.position.z -= 0.1;
    leftEyeBallMesh = new THREE.Mesh();
    leftEyeBallMesh.geometry = new THREE.SphereBufferGeometry(0.025);
    leftEyeBallMesh.material = new THREE.MeshBasicMaterial({color: 'black'});
    leftEyeBallMesh.position.z -= 0.04;
    leftEyeMesh.add(leftEyeBallMesh);
    headMesh.add(leftEyeMesh);

    // Right eye.
    rightEyeMesh = new THREE.Mesh();
    rightEyeMesh.geometry = new THREE.SphereBufferGeometry(0.05);
    rightEyeMesh.material = new THREE.MeshBasicMaterial({color: 'white'});
    rightEyeMesh.position.x += 0.1;
    rightEyeMesh.position.y += 0.1;
    rightEyeMesh.position.z -= 0.1;
    rightEyeBallMesh = new THREE.Mesh();
    rightEyeBallMesh.geometry = new THREE.SphereBufferGeometry(0.025);
    rightEyeBallMesh.material = new THREE.MeshBasicMaterial({color: 'black'});
    rightEyeBallMesh.position.z -= 0.04;
    rightEyeMesh.add(rightEyeBallMesh);
    headMesh.add(rightEyeMesh);

    cameraEl.setObject3D('replayerMesh', headMesh);
  },

  /**
   * Remove motion-capture-replayer components.
   */
  stopReplaying: function () {
    var self = this;

    if (!this.isReplaying || !this.replayData) { return; }

    this.isReplaying = false;
    Object.keys(this.replayData).forEach(function removeReplayer (key) {
      if (key === 'camera') {
        self.cameraEl.removeComponent('motion-capture-replayer');
      } else {
        el = document.querySelector('#' + key);
        if (!el) {
          warn('No element with id ' + key);
          return;
        }
        el.removeComponent('motion-capture-replayer');
      }
    });
  },

  /**
   * XHR for data.
   */
  loadRecordingFromUrl: function (url, binary, callback) {
    var data;
    var self = this;
    fileLoader.crossOrigin = 'anonymous';
    if (binary === true) {
      fileLoader.setResponseType('arraybuffer');
    }
    fileLoader.load(url, function (buffer) {
      if (binary === true) {
        data = self.loadStrokeBinary(buffer);
      } else {
        data = JSON.parse(buffer);
      }
      if (callback) { callback(data); }
    });
  }
});

},{"../constants":10}],7:[function(require,module,exports){
/* global AFRAME, THREE */

var EVENTS = {
  axismove: {id: 0, props: ['id', 'axis', 'changed']},
  buttonchanged: {id: 1, props: ['id', 'state']},
  buttondown: {id: 2, props: ['id', 'state']},
  buttonup: {id: 3, props: ['id', 'state']},
  touchstart: {id: 4, props: ['id', 'state']},
  touchend: {id: 5, props: ['id', 'state']}
};

var EVENTS_DECODE = {
  0: 'axismove',
  1: 'buttonchanged',
  2: 'buttondown',
  3: 'buttonup',
  4: 'touchstart',
  5: 'touchend'
};

AFRAME.registerComponent('motion-capture-recorder', {
  schema: {
    autoRecord: {default: false},
    enabled: {default: true},
    hand: {default: 'right'},
    recordingControls: {default: false},
    persistStroke: {default: false},
    visibleStroke: {default: true}
  },

  init: function () {
    this.drawing = false;
    this.recordedEvents = [];
    this.recordedPoses = [];
    this.addEventListeners();
  },

  addEventListeners: function () {
    var el = this.el;
    this.recordEvent = this.recordEvent.bind(this);
    el.addEventListener('axismove', this.recordEvent);
    el.addEventListener('buttonchanged', this.onTriggerChanged.bind(this));
    el.addEventListener('buttonchanged', this.recordEvent);
    el.addEventListener('buttonup', this.recordEvent);
    el.addEventListener('buttondown', this.recordEvent);
    el.addEventListener('touchstart', this.recordEvent);
    el.addEventListener('touchend', this.recordEvent);
  },

  recordEvent: function (evt) {
    var detail;
    if (!this.isRecording) { return; }

    // Filter out `target`, not serializable.
    if ('detail' in evt && 'state' in evt.detail && typeof evt.detail.state === 'object' &&
        'target' in evt.detail.state) {
      delete evt.detail.state.target;
    }

    detail = {};
    EVENTS[evt.type].props.forEach(function buildDetail (propName) {
      // Convert GamepadButton to normal JS object.
      if (propName === 'state') {
        var stateProp;
        detail.state = {};
        for (stateProp in evt.detail.state) {
          detail.state[stateProp] = evt.detail.state[stateProp];
        }
        return;
      }
      detail[propName] = evt.detail[propName];
    });

    this.recordedEvents.push({
      name: evt.type,
      detail: detail,
      timestamp: this.lastTimestamp
    });
  },

  onTriggerChanged: function (evt) {
    var data = this.data;
    var value;
    if (!data.enabled || data.autoRecord) { return; }
    // Not Trigger
    if (evt.detail.id !== 1 || !this.data.recordingControls) { return; }
    value = evt.detail.state.value;
    if (value <= 0.1) {
      if (this.isRecording) { this.stopRecording(); }
      return;
    }
    if (!this.isRecording) { this.startRecording(); }
  },

  getJSONData: function () {
    var data;
    var trackedControlsComponent = this.el.components['tracked-controls'];
    var controller = trackedControlsComponent && trackedControlsComponent.controller;
    if (!this.recordedPoses) { return; }
    data = {
      poses: this.getStrokeJSON(this.recordedPoses),
      events: this.recordedEvents
    };
    if (controller) {
      data.gamepad = {
        id: controller.id,
        hand: controller.hand,
        index: controller.index
      };
    }
    return data;
  },

  getStrokeJSON: function (stroke) {
    var point;
    var points = [];
    for (var i = 0; i < stroke.length; i++) {
      point = stroke[i];
      points.push({
        position: point.position,
        rotation: point.rotation,
        timestamp: point.timestamp
      });
    }
    return points;
  },

  saveCapture: function (binary) {
    var jsonData = JSON.stringify(this.getJSONData());
    var type = binary ? 'application/octet-binary' : 'application/json';
    var blob = new Blob([jsonData], {type: type});
    var url = URL.createObjectURL(blob);
    var fileName = 'motion-capture-' + document.title + '-' + Date.now() + '.json';
    var aEl = document.createElement('a');
    aEl.setAttribute('class', 'motion-capture-download');
    aEl.href = url;
    aEl.setAttribute('download', fileName);
    aEl.innerHTML = 'downloading...';
    aEl.style.display = 'none';
    document.body.appendChild(aEl);
    setTimeout(function () {
      aEl.click();
      document.body.removeChild(aEl);
    }, 1);
  },

  update: function () {
    var el = this.el;
    var data = this.data;
    if (this.data.autoRecord) {
      this.startRecording();
    } else {
      // Don't try to record camera with controllers.
      if (el.components.camera) { return; }

      if (data.recordingControls) {
        el.setAttribute('vive-controls', {hand: data.hand});
        el.setAttribute('oculus-touch-controls', {hand: data.hand});
      }
      el.setAttribute('stroke', '');
    }
  },

  tick: (function () {
    var position = new THREE.Vector3();
    var rotation = new THREE.Quaternion();
    var scale = new THREE.Vector3();

    return function (time, delta) {
      var newPoint;
      var pointerPosition;
      this.lastTimestamp = time;
      if (!this.data.enabled || !this.isRecording) { return; }
      newPoint = {
        position: AFRAME.utils.clone(this.el.getAttribute('position')),
        rotation: AFRAME.utils.clone(this.el.getAttribute('rotation')),
        timestamp: time
      };
      this.recordedPoses.push(newPoint);
      if (!this.data.visibleStroke) { return; }
      this.el.object3D.updateMatrixWorld();
      this.el.object3D.matrixWorld.decompose(position, rotation, scale);
      pointerPosition = this.getPointerPosition(position, rotation);
      this.el.components.stroke.drawPoint(position, rotation, time, pointerPosition);
    };
  })(),

  getPointerPosition: (function () {
    var pointerPosition = new THREE.Vector3();
    var offset = new THREE.Vector3(0, 0.7, 1);
    return function getPointerPosition (position, orientation) {
      var pointer = offset
        .clone()
        .applyQuaternion(orientation)
        .normalize()
        .multiplyScalar(-0.03);
      pointerPosition.copy(position).add(pointer);
      return pointerPosition;
    };
  })(),

  startRecording: function () {
    var el = this.el;
    if (this.isRecording) { return; }
    if (el.components.stroke) { el.components.stroke.reset(); }
    this.isRecording = true;
    this.recordedPoses = [];
    this.recordedEvents = [];
    el.emit('strokestarted', {entity: el, poses: this.recordedPoses});
  },

  stopRecording: function () {
    var el = this.el;
    if (!this.isRecording) { return; }
    el.emit('strokeended', {poses: this.recordedPoses});
    this.isRecording = false;
    if (!this.data.visibleStroke || this.data.persistStroke) { return; }
    el.components.stroke.reset();
  }
});

},{}],8:[function(require,module,exports){
/* global THREE, AFRAME  */
AFRAME.registerComponent('motion-capture-replayer', {
  schema: {
    enabled: {default: true},
    recorderEl: {type: 'selector'},
    loop: {default: false},
    src: {default: ''},
    spectatorCamera: {default: false}
  },

  init: function () {
    this.currentPoseTime = 0;
    this.currentEventTime = 0;
    this.currentPoseIndex = 0;
    this.currentEventIndex = 0;
    this.onStrokeStarted = this.onStrokeStarted.bind(this);
    this.onStrokeEnded = this.onStrokeEnded.bind(this);
    this.playComponent = this.playComponent.bind(this);
    this.el.addEventListener('pause', this.playComponent);
    this.discardedFrames = 0;
    this.playingEvents = [];
    this.playingPoses = [];
    this.gamepadData = null;
  },

  remove: function () {
    var el = this.el;
    var gamepadData = this.gamepadData;
    var gamepads;
    var found = -1;

    el.removeEventListener('pause', this.playComponent);
    this.stopReplaying();
    el.pause();
    el.play();

    // Remove gamepad from system.
    if (this.gamepadData) {
      gamepads = el.sceneEl.systems['motion-capture-replayer'].gamepads;
      gamepads.forEach(function (gamepad, i) {
        if (gamepad === gamepadData) { found = i; }
      });
      if (found !== -1) {
        gamepads.splice(found, 1);
      }
    }
  },

  update: function (oldData) {
    var data = this.data;
    this.updateRecorder(data.recorderEl, oldData.recorderEl);
    if (!this.el.isPlaying) { this.playComponent(); }
    if (oldData.src === data.src) { return; }
    if (data.src) { this.updateSrc(data.src); }
  },

  updateRecorder: function (newRecorderEl, oldRecorderEl) {
    if (oldRecorderEl && oldRecorderEl !== newRecorderEl) {
      oldRecorderEl.removeEventListener('strokestarted', this.onStrokeStarted);
      oldRecorderEl.removeEventListener('strokeended', this.onStrokeEnded);
    }
    if (!newRecorderEl || oldRecorderEl === newRecorderEl) { return; }
    newRecorderEl.addEventListener('strokestarted', this.onStrokeStarted);
    newRecorderEl.addEventListener('strokeended', this.onStrokeEnded);
  },

  updateSrc: function (src) {
    this.el.sceneEl.systems['motion-capture-recorder'].loadRecordingFromUrl(
      src, false, this.startReplaying.bind(this));
  },

  onStrokeStarted: function(evt) {
    this.reset();
  },

  onStrokeEnded: function(evt) {
    this.startReplayingPoses(evt.detail.poses);
  },

  play: function () {
    if (this.playingStroke) { this.playStroke(this.playingStroke); }
  },

  playComponent: function () {
    this.el.isPlaying = true;
    this.play();
  },

  /**
   * @param {object} data - Recording data.
   */
  startReplaying: function (data) {
    var el = this.el;

    this.ignoredFrames = 0;
    this.storeInitialPose();
    this.isReplaying = true;
    this.startReplayingPoses(data.poses);
    this.startReplayingEvents(data.events);

    // Add gamepad metadata to system.
    if (data.gamepad) {
      this.gamepadData = data.gamepad;
      el.sceneEl.systems['motion-capture-replayer'].gamepads.push(data.gamepad);
      el.emit('gamepadconnected');
    }

    el.emit('replayingstarted');
  },

  stopReplaying: function () {
    this.isReplaying = false;
    this.restoreInitialPose();
    this.el.emit('replayingstopped');
  },

  storeInitialPose: function () {
    var el = this.el;
    this.initialPose = {
      position: AFRAME.utils.clone(el.getAttribute('position')),
      rotation: AFRAME.utils.clone(el.getAttribute('rotation'))
    };
  },

  restoreInitialPose: function () {
    var el = this.el;
    if (!this.initialPose) { return; }
    el.setAttribute('position', this.initialPose.position);
    el.setAttribute('rotation', this.initialPose.rotation);
  },

  startReplayingPoses: function (poses) {
    this.isReplaying = true;
    this.currentPoseIndex = 0;
    if (poses.length === 0) { return; }
    this.playingPoses = poses;
    this.currentPoseTime = poses[0].timestamp;
  },

  /**
   * @param events {Array} - Array of events with timestamp, name, and detail.
   */
  startReplayingEvents: function (events) {
    var firstEvent;
    this.isReplaying = true;
    this.currentEventIndex = 0;
    if (events.length === 0) { return; }
    firstEvent = events[0];
    this.playingEvents = events;
    this.currentEventTime = firstEvent.timestamp;
    this.el.emit(firstEvent.name, firstEvent.detail);
  },

  // Reset player
  reset: function () {
    this.playingPoses = null;
    this.currentTime = undefined;
    this.currentPoseIndex = undefined;
  },

  /**
   * Called on tick.
   */
  playRecording: function (delta) {
    var currentPose;
    var currentEvent
    var playingPoses = this.playingPoses;
    var playingEvents = this.playingEvents;
    currentPose = playingPoses && playingPoses[this.currentPoseIndex]
    currentEvent = playingEvents && playingEvents[this.currentEventIndex];
    this.currentPoseTime += delta;
    this.currentEventTime += delta;
    // Determine next pose.
    // Comparing currentPoseTime to currentEvent.timestamp is not a typo.
    while ((currentPose && this.currentPoseTime >= currentPose.timestamp) ||
           (currentEvent && this.currentPoseTime >= currentEvent.timestamp)) {
      // Pose.
      if (currentPose && this.currentPoseTime >= currentPose.timestamp) {
        if (this.currentPoseIndex === playingPoses.length - 1) {
          if (this.data.loop) {
            this.currentPoseIndex = 0;
            this.currentPoseTime = playingPoses[0].timestamp;
          } else {
            this.stopReplaying();
          }
        }
        applyPose(this.el, currentPose);
        this.currentPoseIndex += 1;
        currentPose = playingPoses[this.currentPoseIndex];
      }
      // Event.
      if (currentEvent && this.currentPoseTime >= currentEvent.timestamp) {
        if (this.currentEventIndex === playingEvents.length && this.data.loop) {
          this.currentEventIndex = 0;
          this.currentEventTime = playingEvents[0].timestamp;
        }
        this.el.emit(currentEvent.name, currentEvent.detail);
        this.currentEventIndex += 1;
        currentEvent = this.playingEvents[this.currentEventIndex];
      }
    }
  },

  tick: function (time, delta) {
    // Ignore the first couple of frames that come from window.RAF on Firefox.
    if (this.ignoredFrames !== 2 && !window.debug) {
      this.ignoredFrames++;
      return;
    }

    if (!this.isReplaying) { return; }
    this.playRecording(delta);
  }
});

function applyPose (el, pose) {
  el.setAttribute('position', pose.position);
  el.setAttribute('rotation', pose.rotation);
};

},{}],9:[function(require,module,exports){
/* global THREE AFRAME  */
AFRAME.registerComponent('stroke', {
  schema: {
    enabled: {default: true},
    color: {default: '#ef2d5e', type: 'color'}
  },

  init: function () {
    var maxPoints = this.maxPoints = 3000;
    var strokeEl;
    this.idx = 0;
    this.numPoints = 0;

    // Buffers
    this.vertices = new Float32Array(maxPoints*3*3);
    this.normals = new Float32Array(maxPoints*3*3);
    this.uvs = new Float32Array(maxPoints*2*2);

    // Geometries
    this.geometry = new THREE.BufferGeometry();
    this.geometry.setDrawRange(0, 0);
    this.geometry.addAttribute('position', new THREE.BufferAttribute(this.vertices, 3).setDynamic(true));
    this.geometry.addAttribute('uv', new THREE.BufferAttribute(this.uvs, 2).setDynamic(true));
    this.geometry.addAttribute('normal', new THREE.BufferAttribute(this.normals, 3).setDynamic(true));

    this.material = new THREE.MeshStandardMaterial({
      color: this.data.color,
      roughness: 0.75,
      metalness: 0.25,
      side: THREE.DoubleSide
    });

    var mesh = new THREE.Mesh(this.geometry, this.material);
    mesh.drawMode = THREE.TriangleStripDrawMode;
    mesh.frustumCulled = false;

    // Injects stroke entity
    strokeEl = document.createElement('a-entity');
    strokeEl.setObject3D('stroke', mesh);
    this.el.sceneEl.appendChild(strokeEl);
  },

  update: function() {
    this.material.color.set(this.data.color);
  },

  drawPoint: (function () {
    var direction = new THREE.Vector3();
    var positionA = new THREE.Vector3();
    var positionB = new THREE.Vector3();
    return function (position, orientation, timestamp, pointerPosition) {
      var uv = 0;
      var numPoints = this.numPoints;
      var brushSize = 0.01;
      if (numPoints === this.maxPoints) { return; }
      for (i = 0; i < numPoints; i++) {
        this.uvs[uv++] = i / (numPoints - 1);
        this.uvs[uv++] = 0;

        this.uvs[uv++] = i / (numPoints - 1);
        this.uvs[uv++] = 1;
      }

      direction.set(1, 0, 0);
      direction.applyQuaternion(orientation);
      direction.normalize();

      positionA.copy(pointerPosition);
      positionB.copy(pointerPosition);
      positionA.add(direction.clone().multiplyScalar(brushSize / 2));
      positionB.add(direction.clone().multiplyScalar(-brushSize / 2));

      this.vertices[this.idx++] = positionA.x;
      this.vertices[this.idx++] = positionA.y;
      this.vertices[this.idx++] = positionA.z;

      this.vertices[this.idx++] = positionB.x;
      this.vertices[this.idx++] = positionB.y;
      this.vertices[this.idx++] = positionB.z;

      this.computeVertexNormals();
      this.geometry.attributes.normal.needsUpdate = true;
      this.geometry.attributes.position.needsUpdate = true;
      this.geometry.attributes.uv.needsUpdate = true;

      this.geometry.setDrawRange(0, numPoints * 2);
      this.numPoints += 1;
      return true;
    }
  })(),

  reset: function () {
    var idx = 0;
    var vertices = this.vertices;
    for (i = 0; i < this.numPoints; i++) {
      vertices[idx++] = 0;
      vertices[idx++] = 0;
      vertices[idx++] = 0;

      vertices[idx++] = 0;
      vertices[idx++] = 0;
      vertices[idx++] = 0;
    }
    this.geometry.setDrawRange(0, 0);
    this.idx = 0;
    this.numPoints = 0;
  },

  computeVertexNormals: function () {
    var pA = new THREE.Vector3();
    var pB = new THREE.Vector3();
    var pC = new THREE.Vector3();
    var cb = new THREE.Vector3();
    var ab = new THREE.Vector3();

    for (var i = 0, il = this.idx; i < il; i++) {
      this.normals[ i ] = 0;
    }

    var pair = true;
    for (i = 0, il = this.idx; i < il; i += 3) {
      if (pair) {
        pA.fromArray(this.vertices, i);
        pB.fromArray(this.vertices, i + 3);
        pC.fromArray(this.vertices, i + 6);
      } else {
        pA.fromArray(this.vertices, i + 3);
        pB.fromArray(this.vertices, i);
        pC.fromArray(this.vertices, i + 6);
      }
      pair = !pair;

      cb.subVectors(pC, pB);
      ab.subVectors(pA, pB);
      cb.cross(ab);
      cb.normalize();

      this.normals[i] += cb.x;
      this.normals[i + 1] += cb.y;
      this.normals[i + 2] += cb.z;

      this.normals[i + 3] += cb.x;
      this.normals[i + 4] += cb.y;
      this.normals[i + 5] += cb.z;

      this.normals[i + 6] += cb.x;
      this.normals[i + 7] += cb.y;
      this.normals[i + 8] += cb.z;
    }

    /*
    first and last vertice (0 and 8) belongs just to one triangle
    second and penultimate (1 and 7) belongs to two triangles
    the rest of the vertices belongs to three triangles

      1_____3_____5_____7
      /\    /\    /\    /\
     /  \  /  \  /  \  /  \
    /____\/____\/____\/____\
    0    2     4     6     8
    */

    // Vertices that are shared across three triangles
    for (i = 2 * 3, il = this.idx - 2 * 3; i < il; i++) {
      this.normals[ i ] = this.normals[ i ] / 3;
    }

    // Second and penultimate triangle, that shares just two triangles
    this.normals[ 3 ] = this.normals[ 3 ] / 2;
    this.normals[ 3 + 1 ] = this.normals[ 3 + 1 ] / 2;
    this.normals[ 3 + 2 ] = this.normals[ 3 * 1 + 2 ] / 2;

    this.normals[ this.idx - 2 * 3 ] = this.normals[ this.idx - 2 * 3 ] / 2;
    this.normals[ this.idx - 2 * 3 + 1 ] = this.normals[ this.idx - 2 * 3 + 1 ] / 2;
    this.normals[ this.idx - 2 * 3 + 2 ] = this.normals[ this.idx - 2 * 3 + 2 ] / 2;

    this.geometry.normalizeNormals();
  }
});

},{}],10:[function(require,module,exports){
module.exports.LOCALSTORAGE_RECORDINGS = 'avatarRecordings';
module.exports.DEFAULT_RECORDING_NAME = 'default';

},{}],11:[function(require,module,exports){
if (typeof AFRAME === 'undefined') {
  throw new Error('Component attempted to register before AFRAME was available.');
}

// Components.
require('./components/motion-capture-recorder.js');
require('./components/motion-capture-replayer.js');
require('./components/avatar-recorder.js');
require('./components/avatar-replayer.js');
require('./components/stroke.js');

// Systems.
require('./systems/motion-capture-replayer.js');
require('./systems/recordingdb.js');

},{"./components/avatar-recorder.js":5,"./components/avatar-replayer.js":6,"./components/motion-capture-recorder.js":7,"./components/motion-capture-replayer.js":8,"./components/stroke.js":9,"./systems/motion-capture-replayer.js":12,"./systems/recordingdb.js":13}],12:[function(require,module,exports){
AFRAME.registerSystem('motion-capture-replayer', {
  init: function () {
    var sceneEl = this.sceneEl;
    var trackedControlsComponent;
    var trackedControlsSystem;
    var trackedControlsTick;

    trackedControlsSystem = sceneEl.systems['tracked-controls'];
    trackedControlsTick = AFRAME.components['tracked-controls'].Component.prototype.tick;

    // Gamepad data stored in recording and added here by `motion-capture-replayer` component.
    this.gamepads = [];

    // Wrap `updateControllerList`.
    this.updateControllerListOriginal = trackedControlsSystem.updateControllerList.bind(
      trackedControlsSystem);
    trackedControlsSystem.updateControllerList = this.updateControllerList.bind(this);

    // Wrap `tracked-controls` tick.
    trackedControlsComponent = AFRAME.components['tracked-controls'].Component.prototype;
    trackedControlsComponent.tick = this.trackedControlsTickWrapper;
    trackedControlsComponent.trackedControlsTick = trackedControlsTick;
  },

  remove: function () {
    // restore modified objects
    var trackedControlsComponent = AFRAME.components['tracked-controls'].Component.prototype;
    var trackedControlsSystem = this.sceneEl.systems['tracked-controls'];
    trackedControlsComponent.tick = trackedControlsComponent.trackedControlsTick;
    delete trackedControlsComponent.trackedControlsTick;
    trackedControlsSystem.updateControllerList = this.updateControllerListOriginal;
  },

  trackedControlsTickWrapper: function (time, delta) {
    if (this.el.components['motion-capture-replayer']) { return; }
    this.trackedControlsTick(time, delta);
  },

  /**
   * Wrap `updateControllerList` to stub in the gamepads and emit `controllersupdated`.
   */
  updateControllerList: function () {
    var i;
    var sceneEl = this.sceneEl;
    var trackedControlsSystem = sceneEl.systems['tracked-controls'];

    this.updateControllerListOriginal();

    this.gamepads.forEach(function (gamepad) {
      if (trackedControlsSystem.controllers[gamepad.index]) { return; }
      trackedControlsSystem.controllers[gamepad.index] = gamepad;
    });

    for (i = 0; i < trackedControlsSystem.controllers.length; i++) {
      if (trackedControlsSystem.controllers[i]) { continue; }
      trackedControlsSystem.controllers[i] = {id: '___', index: -1, hand: 'finger'};
    }

    sceneEl.emit('controllersupdated', undefined, false);
  }
});

},{}],13:[function(require,module,exports){
/* global indexedDB */
var constants = require('../constants');

var DB_NAME = 'motionCaptureRecordings';
var OBJECT_STORE_NAME = 'recordings';
var VERSION = 1;

/**
 * Interface for storing and accessing recordings from Indexed DB.
 */
AFRAME.registerSystem('recordingdb', {
  init: function () {
    var request;
    var self = this;

    this.db = null;
    this.hasLoaded = false;

    request = indexedDB.open(DB_NAME, VERSION);

    request.onerror = function () {
      console.error('Error opening IndexedDB for motion capture.', request.error);
    };

    // Initialize database.
    request.onupgradeneeded = function (evt) {
      var db = self.db = evt.target.result;
      var objectStore;

      // Create object store.
      objectStore = db.createObjectStore('recordings', {
        autoIncrement: false
      });
      objectStore.createIndex('recordingName', 'recordingName', {unique: true});
      self.objectStore = objectStore;
    };

    // Got database.
    request.onsuccess = function (evt) {
      self.db = evt.target.result;
      self.hasLoaded = true;
      self.sceneEl.emit('recordingdbinitialized');
    };
  },

  /**
   * Need a new transaction for everything.
   */
  getTransaction: function () {
    var transaction = this.db.transaction([OBJECT_STORE_NAME], 'readwrite');
    return transaction.objectStore(OBJECT_STORE_NAME);
  },

  getRecordingNames: function () {
    var self = this;
    return new Promise(function (resolve) {
      var recordingNames = [];

      self.waitForDb(function () {
        self.getTransaction().openCursor().onsuccess = function (evt) {
          var cursor = evt.target.result;

          // No recordings.
          if (!cursor) {
            resolve(recordingNames.sort());
            return;
          }

          recordingNames.push(cursor.key);
          cursor.continue();
        };
      });
    });
  },

  getRecordings: function (cb) {
    var self = this;
    return new Promise(function getRecordings (resolve) {
      self.waitForDb(function () {
        self.getTransaction().openCursor().onsuccess = function (evt) {
          var cursor = evt.target.result;
          var recordings = [cursor.value];
          while (cursor.ontinue()) {
            recordings.push(cursor.value);
          }
          resolve(recordings);
        };
      });
    });
  },

  getRecording: function (name) {
    var self = this;
    return new Promise(function getRecording (resolve) {
      self.waitForDb(function () {
        self.getTransaction().get(name).onsuccess = function (evt) {
          resolve(evt.target.result);
        };
      });
    });
  },

  addRecording: function (name, data) {
    this.getTransaction().add(data, name);
  },

  deleteRecording: function (name) {
    this.getTransaction().delete(name);
  },

  /**
   * Helper to wait for store to be initialized before using it.
   */
  waitForDb: function (cb) {
    if (this.hasLoaded) {
      cb();
      return;
    }
    this.sceneEl.addEventListener('recordingdbinitialized', cb);
  }
});

},{"../constants":10}],14:[function(require,module,exports){
'use strict';

/* global AFRAME */
var extendDeep = AFRAME.utils.extendDeep;
// The mesh mixin provides common material properties for creating mesh-based primitives.
// This makes the material component a default component and maps all the base material properties.
var meshMixin = AFRAME.primitives.getMeshMixin();
AFRAME.registerPrimitive('a-locomotor', extendDeep({}, meshMixin, {
  // Preset default components. These components and component properties will be attached to the entity out-of-the-box.
  defaultComponents: {
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
    'allow-movement': 'locomotor-auto-config.move',
    'horizontal-only': 'grabbable.suppressY',
    'allow-scaling': 'locomotor-auto-config.stretch'
  }
}));

},{}],15:[function(require,module,exports){
'use strict';

/* global AFRAME */
const buttonCore = require('./prototypes/buttons-proto.js');
AFRAME.registerComponent('clickable', AFRAME.utils.extendDeep({}, buttonCore, {
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
    if (evt.defaultPrevented || !this.startButtonOk(evt)) {
      return;
    }
    this.el.addState(this.CLICKED_STATE);
    if (this.clickers.indexOf(evt.detail.hand) === -1) {
      this.clickers.push(evt.detail.hand);
      if (evt.preventDefault) {
        evt.preventDefault();
      }
    }
  },
  end: function (evt) {
    const handIndex = this.clickers.indexOf(evt.detail.hand);
    if (evt.defaultPrevented || !this.endButtonOk(evt)) {
      return;
    }
    if (handIndex !== -1) {
      this.clickers.splice(handIndex, 1);
    }
    if (this.clickers.length < 1) {
      this.el.removeState(this.CLICKED_STATE);
    }
    if (evt.preventDefault) {
      evt.preventDefault();
    }
  }
}));

},{"./prototypes/buttons-proto.js":21}],16:[function(require,module,exports){
'use strict';

/* global AFRAME */
const inherit = AFRAME.utils.extendDeep;
const buttonCore = require('./prototypes/buttons-proto.js');

AFRAME.registerComponent('drag-droppable', inherit({}, buttonCore, {
  init: function () {
    console.warn('Warning: drag-droppable is deprecated. Use draggable and droppable components instead');
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
    if (evt.preventDefault) {
      evt.preventDefault();
    }
  },
  dragStart: function (evt) {
    if (!this.startButtonOk(evt)) {
      return;
    }
    this.el.addState(this.DRAGGED_STATE);
    if (evt.preventDefault) {
      evt.preventDefault();
    }
  },
  hoverEnd: function (evt) {
    this.el.removeState(this.HOVERED_STATE);
  },
  dragEnd: function (evt) {
    if (!this.endButtonOk(evt)) {
      return;
    }
    this.el.removeState(this.DRAGGED_STATE);
    if (evt.preventDefault) {
      evt.preventDefault();
    }
  },
  dragDrop: function (evt) {
    if (!this.endButtonOk(evt)) {
      return;
    }
    if (evt.preventDefault) {
      evt.preventDefault();
    }
  }
}));

},{"./prototypes/buttons-proto.js":21}],17:[function(require,module,exports){
'use strict';

/* global AFRAME */
const inherit = AFRAME.utils.extendDeep;
const buttonCore = require('./prototypes/buttons-proto.js');

AFRAME.registerComponent('draggable', inherit({}, buttonCore, {
  init: function () {
    this.DRAGGED_STATE = 'dragged';
    this.DRAG_EVENT = 'drag-start';
    this.UNDRAG_EVENT = 'drag-end';

    this.dragStartBound = this.dragStart.bind(this);
    this.dragEndBound = this.dragEnd.bind(this);

    this.el.addEventListener(this.DRAG_EVENT, this.dragStartBound);
    this.el.addEventListener(this.UNDRAG_EVENT, this.dragEndBound);
  },
  remove: function () {
    this.el.removeEventListener(this.DRAG_EVENT, this.dragStart);
    this.el.removeEventListener(this.UNDRAG_EVENT, this.dragEnd);
  },
  dragStart: function (evt) {
    if (evt.defaultPrevented || !this.startButtonOk(evt)) {
      return;
    }
    this.el.addState(this.DRAGGED_STATE);
    if (evt.preventDefault) {
      evt.preventDefault();
    }
  },
  dragEnd: function (evt) {
    if (evt.defaultPrevented || !this.endButtonOk(evt)) {
      return;
    }
    this.el.removeState(this.DRAGGED_STATE);
    if (evt.preventDefault) {
      evt.preventDefault();
    }
  }
}));

},{"./prototypes/buttons-proto.js":21}],18:[function(require,module,exports){
'use strict';

/* global AFRAME */
function elementMatches(el, selector) {
  if (el.matches) {
    return el.matches(selector);
  }
  if (el.msMatchesSelector) {
    return el.msMatchesSelector(selector);
  }
  if (el.webkitMatchesSelector) {
    return el.webkitMatchesSelector(selector);
  }
}
AFRAME.registerComponent('droppable', {
  schema: {
    accepts: { default: '' },
    autoUpdate: { default: true },
    acceptEvent: { default: '' },
    rejectEvent: { default: '' }
  },
  multiple: true,
  init: function () {
    this.HOVERED_STATE = 'dragover';
    this.HOVER_EVENT = 'dragover-start';
    this.UNHOVER_EVENT = 'dragover-end';
    this.DRAGDROP_EVENT = 'drag-drop';

    // better for Sinon spying if original method not overwritten
    this.hoverStartBound = this.hoverStart.bind(this);
    this.hoverEndBound = this.hoverEnd.bind(this);
    this.dragDropBound = this.dragDrop.bind(this);
    this.mutateAcceptsBound = this.mutateAccepts.bind(this);

    this.acceptableEntities = [];
    this.observer = new window.MutationObserver(this.mutateAcceptsBound);
    this.observerOpts = { childList: true, subtree: true };

    this.el.addEventListener(this.HOVER_EVENT, this.hoverStartBound);
    this.el.addEventListener(this.UNHOVER_EVENT, this.hoverEndBound);
    this.el.addEventListener(this.DRAGDROP_EVENT, this.dragDropBound);
  },
  update: function () {
    if (this.data.accepts.length) {
      this.acceptableEntities = Array.prototype.slice.call(this.el.sceneEl.querySelectorAll(this.data.accepts));
    } else {
      this.acceptableEntities = null;
    }
    if (this.data.autoUpdate && this.acceptableEntities != null) {
      this.observer.observe(this.el.sceneEl, this.observerOpts);
    } else {
      this.observer.disconnect();
    }
  },
  remove: function () {
    this.el.removeEventListener(this.HOVER_EVENT, this.hoverStartBound);
    this.el.removeEventListener(this.UNHOVER_EVENT, this.hoverEndBound);
    this.el.removeEventListener(this.DRAGDROP_EVENT, this.dragDropBound);
    this.observer.disconnect();
  },
  mutateAccepts: function (mutations) {
    const query = this.data.accepts;
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(added => {
        if (elementMatches(added, query)) {
          this.acceptableEntities.push(added);
        }
      });
    });
  },
  entityAcceptable: function (entity) {
    const acceptableEntities = this.acceptableEntities;
    if (acceptableEntities == null) {
      return true;
    }
    for (let item of acceptableEntities) {
      if (item === entity) {
        return true;
      }
    }
    return false;
  },
  hoverStart: function (evt) {
    if (evt.defaultPrevented || !this.entityAcceptable(evt.detail.carried)) {
      return;
    }
    this.el.addState(this.HOVERED_STATE);
    if (evt.preventDefault) {
      evt.preventDefault();
    }
  },
  hoverEnd: function (evt) {
    if (evt.defaultPrevented) {
      return;
    }
    this.el.removeState(this.HOVERED_STATE);
  },
  dragDrop: function (evt) {
    if (evt.defaultPrevented) {
      return;
    }
    const dropped = evt.detail.dropped;
    if (!this.entityAcceptable(dropped)) {
      if (this.data.rejectEvent.length) {
        this.el.emit(this.data.rejectEvent, { el: dropped });
      }
      return;
    }
    if (this.data.acceptEvent.length) {
      this.el.emit(this.data.acceptEvent, { el: dropped });
    }
    if (evt.preventDefault) {
      evt.preventDefault();
    }
  }
});

},{}],19:[function(require,module,exports){
'use strict';

/* global AFRAME, THREE */
const inherit = AFRAME.utils.extendDeep;
const physicsCore = require('./prototypes/physics-grab-proto.js');
const buttonsCore = require('./prototypes/buttons-proto.js');
const networkedCore = require('./prototypes/networked-proto.js');
// new object with all core modules
const base = inherit({}, physicsCore, buttonsCore, networkedCore);
AFRAME.registerComponent('grabbable', inherit(base, {
  schema: {
    maxGrabbers: { type: 'int', default: NaN },
    invert: { default: false },
    suppressY: { default: false }
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
    this.grabDirection = { x: 0, y: 0, z: -1 };
    this.grabOffset = { x: 0, y: 0, z: 0 };
    // persistent object speeds up repeat setAttribute calls
    this.destPosition = { x: 0, y: 0, z: 0 };
    this.deltaPosition = new THREE.Vector3();
    this.targetPosition = new THREE.Vector3();
    this.physicsInit();

    this.el.addEventListener(this.GRAB_EVENT, e => this.start(e));
    this.el.addEventListener(this.UNGRAB_EVENT, e => this.end(e));
    this.el.addEventListener('mouseout', e => this.lostGrabber(e));
  },
  update: function () {
    this.physicsUpdate();
    this.xFactor = this.data.invert ? -1 : 1;
    this.zFactor = this.data.invert ? -1 : 1;
    this.yFactor = (this.data.invert ? -1 : 1) * !this.data.suppressY;
  },
  tick: function () {
    var entityPosition;
    if (this.grabber) {
      // reflect on z-axis to point in same direction as the laser
      this.targetPosition.copy(this.grabDirection);
      this.targetPosition.applyQuaternion(this.grabber.object3D.getWorldQuaternion()).setLength(this.grabDistance).add(this.grabber.object3D.getWorldPosition()).add(this.grabOffset);
      if (this.deltaPositionIsValid) {
        // relative position changes work better with nested entities
        this.deltaPosition.sub(this.targetPosition);
        entityPosition = this.el.getAttribute('position');
        this.destPosition.x = entityPosition.x - this.deltaPosition.x * this.xFactor;
        this.destPosition.y = entityPosition.y - this.deltaPosition.y * this.yFactor;
        this.destPosition.z = entityPosition.z - this.deltaPosition.z * this.zFactor;
        this.el.setAttribute('position', this.destPosition);
      } else {
        this.deltaPositionIsValid = true;
      }
      this.deltaPosition.copy(this.targetPosition);
    }
  },
  remove: function () {
    this.el.removeEventListener(this.GRAB_EVENT, this.start);
    this.el.removeEventListener(this.UNGRAB_EVENT, this.end);
    this.physicsRemove();
  },
  start: function (evt) {
    if (evt.defaultPrevented || !this.startButtonOk(evt)) {
      return;
    }
    // room for more grabbers?
    const grabAvailable = !Number.isFinite(this.data.maxGrabbers) || this.grabbers.length < this.data.maxGrabbers;

    if (this.grabbers.indexOf(evt.detail.hand) === -1 && grabAvailable && this.networkedOk()) {
      if (!evt.detail.hand.object3D) {
        console.warn('grabbable entities must have an object3D');
        return;
      }
      this.grabbers.push(evt.detail.hand);
      // initiate physics if available, otherwise manual
      if (!this.physicsStart(evt) && !this.grabber) {
        this.grabber = evt.detail.hand;
        this.resetGrabber();
      }
      // notify super-hands that the gesture was accepted
      if (evt.preventDefault) {
        evt.preventDefault();
      }
      this.grabbed = true;
      this.el.addState(this.GRABBED_STATE);
    }
  },
  end: function (evt) {
    const handIndex = this.grabbers.indexOf(evt.detail.hand);
    if (evt.defaultPrevented || !this.endButtonOk(evt)) {
      return;
    }
    if (handIndex !== -1) {
      this.grabbers.splice(handIndex, 1);
      this.grabber = this.grabbers[0];
    }
    this.physicsEnd(evt);
    if (!this.resetGrabber()) {
      this.grabbed = false;
      this.el.removeState(this.GRABBED_STATE);
    }
    if (evt.preventDefault) {
      evt.preventDefault();
    }
  },
  resetGrabber: function () {
    let raycaster;
    if (!this.grabber) {
      return false;
    }
    raycaster = this.grabber.getAttribute('raycaster');
    this.deltaPositionIsValid = false;
    this.grabDistance = this.el.object3D.getWorldPosition().distanceTo(this.grabber.object3D.getWorldPosition());
    if (raycaster) {
      this.grabDirection = raycaster.direction;
      this.grabOffset = raycaster.origin;
    }
    return true;
  },
  lostGrabber: function (evt) {
    let i = this.grabbers.indexOf(evt.relatedTarget);
    // if a queued, non-physics grabber leaves the collision zone, forget it
    if (i !== -1 && evt.relatedTarget !== this.grabber && !this.physicsIsConstrained(evt.relatedTarget)) {
      this.grabbers.splice(i, 1);
    }
  }
}));

},{"./prototypes/buttons-proto.js":21,"./prototypes/networked-proto.js":22,"./prototypes/physics-grab-proto.js":23}],20:[function(require,module,exports){
'use strict';

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
    if (evt.defaultPrevented) {
      return;
    }
    this.el.addState(this.HOVERED_STATE);
    if (this.hoverers.indexOf(evt.detail.hand) === -1) {
      this.hoverers.push(evt.detail.hand);
    }
    if (evt.preventDefault) {
      evt.preventDefault();
    }
  },
  end: function (evt) {
    if (evt.defaultPrevented) {
      return;
    }
    var handIndex = this.hoverers.indexOf(evt.detail.hand);
    if (handIndex !== -1) {
      this.hoverers.splice(handIndex, 1);
    }
    if (this.hoverers.length < 1) {
      this.el.removeState(this.HOVERED_STATE);
    }
  }
});

},{}],21:[function(require,module,exports){
'use strict';

// common code used in customizing reaction components by button
module.exports = function () {
  function buttonIsValid(evt, buttonList) {
    return buttonList.length === 0 || buttonList.indexOf(evt.detail.buttonEvent.type) !== -1;
  }
  return {
    schema: {
      startButtons: { default: [] },
      endButtons: { default: [] }
    },
    startButtonOk: function (evt) {
      return buttonIsValid(evt, this.data['startButtons']);
    },
    endButtonOk: function (evt) {
      return buttonIsValid(evt, this.data['endButtons']);
    }
  };
}();

},{}],22:[function(require,module,exports){
"use strict";

// integration with networked-aframe
module.exports = {
  schema: {
    takeOwnership: { default: false }
  },
  networkedOk: function () {
    if (!window.NAF || window.NAF.utils.isMine(this.el)) {
      return true;
    }
    if (this.data.takeOwnership) {
      return window.NAF.utils.takeOwnership(this.el);
    }
    return false;
  }
};

},{}],23:[function(require,module,exports){
'use strict';

// base code used by grabbable for physics interactions
module.exports = {
  schema: {
    usePhysics: { default: 'ifavailable' }
  },
  physicsInit: function () {
    this.constraints = new Map();
  },
  physicsUpdate: function () {
    if (this.data.usePhysics === 'never' && this.constraints.size) {
      this.physicsClear();
    }
  },
  physicsRemove: function () {
    this.physicsClear();
  },
  physicsStart: function (evt) {
    // initiate physics constraint if available and not already existing
    if (this.data.usePhysics !== 'never' && this.el.body && evt.detail.hand.body && !this.constraints.has(evt.detail.hand)) {
      const newConId = Math.random().toString(36).substr(2, 9);
      this.el.setAttribute('constraint__' + newConId, {
        target: evt.detail.hand
      });
      this.constraints.set(evt.detail.hand, newConId);
      return true;
    }
    // Prevent manual grab by returning true
    if (this.data.usePhysics === 'only') {
      return true;
    }
    return false;
  },
  physicsEnd: function (evt) {
    let constraintId = this.constraints.get(evt.detail.hand);
    if (constraintId) {
      this.el.removeAttribute('constraint__' + constraintId);
      this.constraints.delete(evt.detail.hand);
    }
  },
  physicsClear: function () {
    if (this.el.body) {
      for (let c of this.constraints.values()) {
        this.el.body.world.removeConstraint(c);
      }
    }
    this.constraints.clear();
  },
  physicsIsConstrained: function (el) {
    return this.constraints.has(el);
  },
  physicsIsGrabbing() {
    return this.constraints.size > 0;
  }
};

},{}],24:[function(require,module,exports){
'use strict';

/* global AFRAME, THREE */
const inherit = AFRAME.utils.extendDeep;
const buttonsCore = require('./prototypes/buttons-proto.js');
const networkedCore = require('./prototypes/networked-proto.js');
// new object with all core modules
const base = inherit({}, buttonsCore, networkedCore);
AFRAME.registerComponent('stretchable', inherit(base, {
  schema: {
    usePhysics: { default: 'ifavailable' },
    invert: { default: false },
    physicsUpdateRate: { default: 100 }
  },
  init: function () {
    this.STRETCHED_STATE = 'stretched';
    this.STRETCH_EVENT = 'stretch-start';
    this.UNSTRETCH_EVENT = 'stretch-end';
    this.stretched = false;
    this.stretchers = [];

    this.scale = new THREE.Vector3();
    this.handPos = new THREE.Vector3();
    this.otherHandPos = new THREE.Vector3();

    this.start = this.start.bind(this);
    this.end = this.end.bind(this);

    this.el.addEventListener(this.STRETCH_EVENT, this.start);
    this.el.addEventListener(this.UNSTRETCH_EVENT, this.end);
  },
  update: function (oldDat) {
    this.updateBodies = AFRAME.utils.throttleTick(this._updateBodies, this.data.physicsUpdateRate, this);
  },
  tick: function (time, timeDelta) {
    if (!this.stretched) {
      return;
    }
    this.scale.copy(this.el.getAttribute('scale'));
    this.handPos.copy(this.stretchers[0].getAttribute('position'));
    this.otherHandPos.copy(this.stretchers[1].getAttribute('position'));
    const currentStretch = this.handPos.distanceTo(this.otherHandPos);
    let deltaStretch = 1;
    if (this.previousStretch !== null && currentStretch !== 0) {
      deltaStretch = Math.pow(currentStretch / this.previousStretch, this.data.invert ? -1 : 1);
    }
    this.previousStretch = currentStretch;
    if (this.previousPhysicsStretch == null) {
      // establish correct baseline even if throttled function isn't called
      this.previousPhysicsStretch = currentStretch;
    }
    this.scale.multiplyScalar(deltaStretch);
    this.el.setAttribute('scale', this.scale);
    // scale update for all nested physics bodies (throttled)
    this.updateBodies(time, timeDelta);
  },
  remove: function () {
    this.el.removeEventListener(this.STRETCH_EVENT, this.start);
    this.el.removeEventListener(this.UNSTRETCH_EVENT, this.end);
  },
  start: function (evt) {
    if (this.stretched || this.stretchers.includes(evt.detail.hand) || !this.startButtonOk(evt) || evt.defaultPrevented || !this.networkedOk()) {
      return;
    } // already stretched or already captured this hand or wrong button
    this.stretchers.push(evt.detail.hand);
    if (this.stretchers.length === 2) {
      this.stretched = true;
      this.previousStretch = null;
      this.previousPhysicsStretch = null;
      this.el.addState(this.STRETCHED_STATE);
    }
    if (evt.preventDefault) {
      evt.preventDefault();
    } // gesture accepted
  },
  end: function (evt) {
    var stretcherIndex = this.stretchers.indexOf(evt.detail.hand);
    if (evt.defaultPrevented || !this.endButtonOk(evt)) {
      return;
    }
    if (stretcherIndex !== -1) {
      this.stretchers.splice(stretcherIndex, 1);
      this.stretched = false;
      this.el.removeState(this.STRETCHED_STATE);
      // override throttle to push last stretch to physics bodies
      this._updateBodies();
    }
    if (evt.preventDefault) {
      evt.preventDefault();
    }
  },
  _updateBodies: function () {
    if (!this.el.body || this.data.usePhysics === 'never') {
      return;
    }
    const currentStretch = this.previousStretch; // last visible geometry stretch
    let deltaStretch = 1;
    if (this.previousPhysicsStretch !== null && currentStretch > 0) {
      deltaStretch = Math.pow(currentStretch / this.previousPhysicsStretch, this.data.invert ? -1 : 1);
    }
    this.previousPhysicsStretch = currentStretch;
    if (deltaStretch === 1) {
      return;
    }
    for (let c of this.el.children) {
      this.stretchBody(c, deltaStretch);
    }
    this.stretchBody(this.el, deltaStretch);
  },
  stretchBody: function (el, deltaStretch) {
    if (!el.body) {
      return;
    }
    let physicsShape;
    let offset;
    for (let i = 0; i < el.body.shapes.length; i++) {
      physicsShape = el.body.shapes[i];
      if (physicsShape.halfExtents) {
        physicsShape.halfExtents.scale(deltaStretch, physicsShape.halfExtents);
        physicsShape.updateConvexPolyhedronRepresentation();
      } else if (physicsShape.radius) {
        physicsShape.radius *= deltaStretch;
        physicsShape.updateBoundingSphereRadius();
      } else if (!this.shapeWarned) {
        console.warn('Unable to stretch physics body: unsupported shape');
        this.shapeWarned = true;
      }
      // also move offset to match scale change
      offset = el.body.shapeOffsets[i];
      offset.scale(deltaStretch, offset);
    }
    el.body.updateBoundingRadius();
  }
}));

},{"./prototypes/buttons-proto.js":21,"./prototypes/networked-proto.js":22}],25:[function(require,module,exports){
'use strict';

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
      if (x.otherSuperHand === comp) {
        x.otherSuperHand = null;
      }
    });
  }
});

},{}]},{},[1]);
