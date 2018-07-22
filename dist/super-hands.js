(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

/**
 * Super Hands component for A-Frame.
 */
AFRAME.registerComponent('super-hands', {
  schema: {
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
    },
    interval: { default: 0 }
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
    this.hoverElsIntersections = [];
    this.prevCheckTime = null;
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
    this.hoverEls.length = 0;
    if (this.state.get(this.HOVER_EVENT)) {
      this._unHover(this.state.get(this.HOVER_EVENT));
    }
    this.onGrabEndButton();
    this.onStretchEndButton();
    this.onDragDropEndButton();
  },
  tick: function () {
    // closer objects and objects with no distance come later in list
    function sorter(a, b) {
      const aDist = a.distance == null ? -1 : a.distance;
      const bDist = b.distance == null ? -1 : b.distance;
      if (aDist < bDist) {
        return 1;
      }
      if (bDist < aDist) {
        return -1;
      }
      return 0;
    }
    return function (time) {
      const data = this.data;
      const prevCheckTime = this.prevCheckTime;
      if (prevCheckTime && time - prevCheckTime < data.interval) {
        return;
      }
      this.prevCheckTime = time;

      let orderChanged = false;
      this.hoverElsIntersections.sort(sorter);
      for (let i = 0; i < this.hoverElsIntersections.length; i++) {
        if (this.hoverEls[i] !== this.hoverElsIntersections[i].object.el) {
          orderChanged = true;
          this.hoverEls[i] = this.hoverElsIntersections[i].object.el;
        }
      }
      if (orderChanged) {
        this.hover();
      }
    };
  }(),
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
    const endEvt = { hand: this.el, buttonEvent: evt
      // check if end event accepted
    };if (stretched && !this.emitCancelable(stretched, this.UNSTRETCH_EVENT, endEvt)) {
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
  processHitEl: function (hitEl, intersection) {
    const dist = intersection && intersection.distance;
    const sects = this.hoverElsIntersections;
    const hoverEls = this.hoverEls;
    const hitElIndex = this.hoverEls.indexOf(hitEl);
    let hoverNeedsUpdate = false;
    if (hitElIndex === -1) {
      hoverNeedsUpdate = true;
      // insert in order of distance when available
      if (dist != null) {
        let i = 0;
        while (i < sects.length && dist < sects[i].distance) {
          i++;
        }
        hoverEls.splice(i, 0, hitEl);
        sects.splice(i, 0, intersection);
      } else {
        hoverEls.push(hitEl);
        sects.push({ object: { el: hitEl } });
      }
      this.dispatchMouseEvent(hitEl, 'mouseover', this.el);
      if (this.dragging && this.gehDragged.size) {
        // events on targets and on dragged
        this.gehDragged.forEach(dragged => {
          this.dispatchMouseEventAll('dragenter', dragged, true, true);
        });
      }
    }
    return hoverNeedsUpdate;
  },
  onHit: function (evt) {
    const hitEl = evt.detail[this.data.colliderEventProperty];
    let hoverNeedsUpdate = 0;
    if (!hitEl) {
      return;
    }
    if (Array.isArray(hitEl)) {
      for (let i = 0, sect; i < hitEl.length; i++) {
        sect = evt.detail.intersections && evt.detail.intersections[i];
        hoverNeedsUpdate += this.processHitEl(hitEl[i], sect);
      }
    } else {
      hoverNeedsUpdate += this.processHitEl(hitEl, null);
    }
    if (hoverNeedsUpdate) {
      this.hover();
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
        this.emitCancelable(this.state.get(this.DRAG_EVENT), this.DRAGOVER_EVENT, hvrevt);
        this.state.set(this.DRAGOVER_EVENT, hoverEl);
      }
    }
    // fallback to hover if not dragging or dragover wasn't successful
    if (!this.state.has(this.DRAGOVER_EVENT)) {
      hoverEl = this.findTarget(this.HOVER_EVENT, { hand: this.el }, true);
      if (hoverEl) {
        this.state.set(this.HOVER_EVENT, hoverEl);
      }
    }
  },
  /* called when controller moves out of collision range of entity */
  unHover: function (evt) {
    const clearedEls = evt.detail[this.data.colliderEndEventProperty];
    if (clearedEls) {
      if (Array.isArray(clearedEls)) {
        clearedEls.forEach(el => this._unHover(el));
      } else {
        this._unHover(clearedEls);
      }
    }
  },
  /* inner unHover steps needed regardless of cause of unHover */
  _unHover: function (el, skipNextHover) {
    let unHovered = false;
    let evt;
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
        // deprecation path: sphere-collider
        this._unWatch(clearedEls);
      }
    }
  },
  _unWatch: function (target) {
    var hoverIndex = this.hoverEls.indexOf(target);
    if (hoverIndex !== -1) {
      this.hoverEls.splice(hoverIndex, 1);
      this.hoverElsIntersections.splice(hoverIndex, 1);
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
    if (hoverIndex !== -1 && this.hoverElsIntersections[hoverIndex].distance == null) {
      this.hoverEls.splice(hoverIndex, 1);
      const sect = this.hoverElsIntersections.splice(hoverIndex, 1);
      this.hoverEls.push(el);
      this.hoverElsIntersections.push(sect[0]);
    }
  }
});

},{"./reaction_components/clickable.js":2,"./reaction_components/drag-droppable.js":3,"./reaction_components/draggable.js":4,"./reaction_components/droppable.js":5,"./reaction_components/grabbable.js":6,"./reaction_components/hoverable.js":7,"./reaction_components/stretchable.js":10,"./systems/super-hands-system.js":11}],2:[function(require,module,exports){
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

},{"./prototypes/buttons-proto.js":8}],3:[function(require,module,exports){
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

},{"./prototypes/buttons-proto.js":8}],4:[function(require,module,exports){
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

},{"./prototypes/buttons-proto.js":8}],5:[function(require,module,exports){
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

},{}],6:[function(require,module,exports){
'use strict';

/* global AFRAME, THREE */
const inherit = AFRAME.utils.extendDeep;
const physicsCore = require('./prototypes/physics-grab-proto.js');
const buttonsCore = require('./prototypes/buttons-proto.js');
// new object with all core modules
const base = inherit({}, physicsCore, buttonsCore);
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
    this.grabOffset = { x: 0, y: 0, z: 0
      // persistent object speeds up repeat setAttribute calls
    };this.destPosition = { x: 0, y: 0, z: 0 };
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
    var q = new THREE.Quaternion();
    var v = new THREE.Vector3();

    return function () {
      var entityPosition;
      if (this.grabber) {
        // reflect on z-axis to point in same direction as the laser
        this.targetPosition.copy(this.grabDirection);
        this.targetPosition.applyQuaternion(this.grabber.object3D.getWorldQuaternion(q)).setLength(this.grabDistance).add(this.grabber.object3D.getWorldPosition(v)).add(this.grabOffset);
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
    };
  }(),
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

    if (this.grabbers.indexOf(evt.detail.hand) === -1 && grabAvailable) {
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
    var objPos = new THREE.Vector3();
    var grabPos = new THREE.Vector3();
    return function () {
      let raycaster;
      if (!this.grabber) {
        return false;
      }
      raycaster = this.grabber.getAttribute('raycaster');
      this.deltaPositionIsValid = false;
      this.grabDistance = this.el.object3D.getWorldPosition(objPos).distanceTo(this.grabber.object3D.getWorldPosition(grabPos));
      if (raycaster) {
        this.grabDirection = raycaster.direction;
        this.grabOffset = raycaster.origin;
      }
      return true;
    };
  }(),
  lostGrabber: function (evt) {
    let i = this.grabbers.indexOf(evt.relatedTarget);
    // if a queued, non-physics grabber leaves the collision zone, forget it
    if (i !== -1 && evt.relatedTarget !== this.grabber && !this.physicsIsConstrained(evt.relatedTarget)) {
      this.grabbers.splice(i, 1);
    }
  }
}));

},{"./prototypes/buttons-proto.js":8,"./prototypes/physics-grab-proto.js":9}],7:[function(require,module,exports){
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

},{}],8:[function(require,module,exports){
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

},{}],9:[function(require,module,exports){
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

},{}],10:[function(require,module,exports){
'use strict';

/* global AFRAME, THREE */
const inherit = AFRAME.utils.extendDeep;
const buttonsCore = require('./prototypes/buttons-proto.js');
// new object with all core modules
const base = inherit({}, buttonsCore);
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
    this.stretchers[0].object3D.getWorldPosition(this.handPos);
    this.stretchers[1].object3D.getWorldPosition(this.otherHandPos);
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
    if (this.stretched || this.stretchers.includes(evt.detail.hand) || !this.startButtonOk(evt) || evt.defaultPrevented) {
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
    for (let c of this.el.childNodes) {
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

},{"./prototypes/buttons-proto.js":8}],11:[function(require,module,exports){
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
