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
    this.DRAGOVER_EVENT = 'dragover-start';
    this.UNDRAGOVER_EVENT = 'dragover-end';
    this.DRAGDROP_EVENT = 'drag-drop';
    
    // links to other systems/components
    this.otherSuperHand = null;
    
    // state tracking - global event handlers (GEH)
    this.gehDragged = [];
    
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
  },

  onGrabEndButton: function (evt) {
    this.dispatchMouseEventAll('mouseup', this.el, true);
    this.dispatchMouseEventAll('click', this.el, true);
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
      this.gehDragged = this.hoverEls.slice();
      this.dispatchMouseEventAll('dragstart', this.el);
    }
  },
  onDragDropEndButton: function (evt) {
    var ddevt, dropTarget,
        carried = this.dragged;
    this.dragging = false; // keep _unHover() from activating another droptarget
    if(carried) {
      this.dispatchMouseEvent(carried, 'dragend', this.el);
      ddevt = { hand: this.el, dropped: carried, on: null };
      dropTarget = this.findTarget(this.DRAGDROP_EVENT, ddevt, true);
      ddevt.on = dropTarget;
      this.emitCancelable(carried, this.DRAGDROP_EVENT, ddevt);
      if(dropTarget) {
        this._unHover(dropTarget);
      }
    }
    this.gehDragged.forEach(carried => {
      this.dispatchMouseEvent(carried, 'dragend', this.el);
      // fire event both ways for all intersected targets 
      this.dispatchMouseEventAll('drop', carried, true, true);
      this.dispatchMouseEventAll('dragleave', carried, true, true);
    });
    this.dragged = null;
    this.gehDragged = [];
  },
  onHit: function(evt) {
    var hitEl = evt.detail.el, used = false, hitElIndex;
    if (!hitEl) { return; } 
    hitElIndex = this.hoverEls.indexOf(hitEl);
    if(hitElIndex === -1) {
      this.hoverEls.push(hitEl);
      hitEl.addEventListener('stateremoved', this.unWatch);
      this.dispatchMouseEvent(hitEl, 'mouseover', this.el);
      if(this.dragging && this.gehDragged.length) {
        // events on targets and on dragged
        this.gehDragged.forEach(dragged => {
          this.dispatchMouseEventAll('dragenter', dragged, true, true);
        });
      }
    }
    if (this.grabbing && !this.carried) {
      // A-Frame style
      this.carried = this.findTarget(this.GRAB_EVENT, { hand: this.el });
    } 
    if (this.stretching && !this.stretched) {
      this.stretched = this.findTarget(this.STRETCH_EVENT, { hand: this.el });
    }
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
    this.hover();
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
        .filter(el => !this.gehDragged.includes(el) && el !== this.carried && 
                el !== this.dragged && el !== this.stretched);
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
