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
require('./misc_components/locomotor-auto-config.js');
require('./misc_components/progressive-controls.js');
require('./primitives/a-locomotor.js');

/**
 * Super Hands component for A-Frame.
 */
AFRAME.registerComponent('super-hands', {
  schema: {
    colliderState: {default: 'collided'},
    colliderEvent: {default: 'hit'},
    colliderEventProperty: {default: 'el'},
    colliderEndEvent: {default: ''},
    colliderEndEventProperty: {default: ''},
    grabStartButtons: {
      default: ['gripdown', 'trackpaddown', 'triggerdown', 'gripclose',
        'pointup', 'thumbup', 'pointingstart', 'pistolstart',
        'thumbstickdown', 'mousedown', 'touchstart']
    },
    grabEndButtons: {
      default: ['gripup', 'trackpadup', 'triggerup', 'gripopen',
        'pointdown', 'thumbdown', 'pointingend', 'pistolend',
        'thumbstickup', 'mouseup', 'touchend']
    },
    stretchStartButtons: {
      default: ['gripdown', 'trackpaddown', 'triggerdown', 'gripclose',
        'pointup', 'thumbup', 'pointingstart', 'pistolstart',
        'thumbstickdown', 'mousedown', 'touchstart']
    },
    stretchEndButtons: {
      default: ['gripup', 'trackpadup', 'triggerup', 'gripopen',
        'pointdown', 'thumbdown', 'pointingend', 'pistolend',
        'thumbstickup', 'mouseup', 'touchend']
    },
    dragDropStartButtons: {
      default: ['gripdown', 'trackpaddown', 'triggerdown', 'gripclose',
        'pointup', 'thumbup', 'pointingstart', 'pistolstart',
        'thumbstickdown', 'mousedown', 'touchstart']
    },
    dragDropEndButtons: {
      default: ['gripup', 'trackpadup', 'triggerup', 'gripopen',
        'pointdown', 'thumbdown', 'pointingend', 'pistolend',
        'thumbstickup', 'mouseup', 'touchend']
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
  pause: function () {

  },

  /**
   * Called when entity resumes.
   * Use to continue or add any dynamic or background behavior such as events.
   */
  play: function () {

  },
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
    const endEvt = {hand: this.el, buttonEvent: evt};
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
    const endEvt = {hand: this.el, buttonEvent: evt};
    // check if end event accepted
    if (stretched &&
        !this.emitCancelable(stretched, this.UNSTRETCH_EVENT, endEvt)) {
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
      if (this.state.get(this.GRAB_EVENT) &&
          !this.emitCancelable(this.state.get(this.GRAB_EVENT), this.DRAG_EVENT,
              {hand: this.el, buttonEvent: evt})) {
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
      const endEvt = {hand: this.el, buttonEvent: evt};
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
    var processHitEl = (hitEl) => {
      let hitElIndex;
      hitElIndex = this.hoverEls.indexOf(hitEl);
      if (hitElIndex === -1) {
        this.hoverEls.push(hitEl);
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
    if (!hitEl) { return; }
    if (Array.isArray(hitEl)) {
      hitEl.forEach(processHitEl);
    } else {
      processHitEl(hitEl);
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
      clearedEls.forEach(el => this._unHover(el));
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
        this.emitCancelable(
          this.state.get(this.DRAG_EVENT),
          this.UNDRAGOVER_EVENT,
          evt
        );
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
      clearedEls.forEach(el => this._unWatch(el));
    } else if (evt.detail.state === this.data.colliderState) {
      this._unWatch(evt.target);
    }
  },
  _unWatch: function (target) {
    var hoverIndex = this.hoverEls.indexOf(target);
    target.removeEventListener('stateremoved', this.unWatch);
    if (hoverIndex !== -1) { this.hoverEls.splice(hoverIndex, 1); }
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
