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
    //this.DRAG_EVENT = 'drag-start';
    //this.UNDRAG_EVENT = 'drag-end';
    this.DRAGOVER_EVENT = 'dragover-start';
    this.UNDRAGOVER_EVENT = 'dragover-end';
    this.DRAGDROP_EVENT = 'drag-drop';
    
    // links to other systems/components
    this.otherSuperHand = null;
    
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
  },

  onGrabEndButton: function (evt) {
    var mEvt;
    if(this.carried) {
      this.carried.emit(this.UNGRAB_EVENT, { hand: this.el });
      mEvt = new MouseEvent('mouseup', { relatedTarget: this.el });
      this.carried.dispatchEvent(mEvt);
      mEvt = new MouseEvent('click', { relatedTarget: this.el });
      this.carried.dispatchEvent(mEvt);
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
  },
  onDragDropEndButton: function (evt) {
    var ddevt, mEvt,
        carried = this.dragged,
        dropTarget = this.peekHoveredEl();
    this.dragging = false; // keep _unHover() from activating another droptarget
    if(carried) {
      this.dispatchMouseEvent(carried, 'dragend', this.el);
      if(dropTarget) {
        ddevt = { hand: this.el, dropped: carried, on: dropTarget };
        this.dispatchMouseEvent(carried, 'dragleave', dropTarget);
        this.dispatchMouseEvent(dropTarget, 'dragleave', carried);
        this.dispatchMouseEvent(dropTarget, 'drop', carried);
        this.dispatchMouseEvent(carried, 'drop', dropTarget);
        dropTarget = this.findTarget(this.DRAGDROP_EVENT, ddevt, true);
        if(dropTarget) {
          this.emitCancelable(carried, this.DRAGDROP_EVENT, ddevt);
          this._unHover(dropTarget);
        }
      }
    }
    this.dragged = null;
  },
  onHit: function(evt) {
    var hitEl = evt.detail.el, used = false, hitElIndex, mEvt,
        peekTarget, useTarget, gestureRejected;
    if (!hitEl) { return; } 
    hitElIndex = this.hoverEls.indexOf(hitEl);
    if(hitElIndex === -1) {
      this.hoverEls.push(hitEl);
      hitEl.addEventListener('stateremoved', this.unWatch);
    }
    // interactions target the oldest entity in the stack, if present
    useTarget = () => {
      if (!used) {
        used = true;
        hitEl = this.hoverEls.length ? this.peekHoveredEl() : hitEl;
      }
      return hitEl;
    };
    peekTarget = () => {
      return used ? hitEl : this.peekHoveredEl() || hitEl;
    };

    if (this.grabbing && !this.carried) {
      // Global Event Handler style
      this.dispatchMouseEvent(peekTarget(), 'mousedown', this.el);
      // A-Frame style
      this.carried = this.findTarget(this.GRAB_EVENT, { hand: this.el });
    } 
    if (this.stretching && !this.stretched) {
      this.stretched = this.findTarget(this.STRETCH_EVENT, { hand: this.el });
    }
    if (this.dragging && !this.dragged) {
      /* prefer this.carried so that a drag started after a grab will work
         with carried element rather than a currently intersected drop target.
         fall back to hitEl in case a drag is initiated independent 
         of a grab */
      this.dragged = this.carried || peekTarget();
      this.dispatchMouseEvent(this.dragged, 'dragstart', this.el);
      this.hover(); // refresh hover in case already over a target
    }
    //activate hover if interactions available
    if (!(this.carried && this.stretched) || this.dragged) {
      this.hover();
    }
  },
  /* send the appropriate hovered gesture for the top entity in the stack */
  hover: function() {
    var hvrevt, hoverEl, mEvt;
    this.lastHover = null;
    hoverEl = this.peekHoveredEl();
    if(hoverEl) {
      if(this.dragging && this.dragged) {
        this.dispatchMouseEvent(this.peekHoveredEl(), 'dragenter', this.dragged);
        this.dispatchMouseEvent(this.dragged, 'dragenter', this.peekHoveredEl());
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
        this.dispatchMouseEvent(hoverEl, 'mouseover', this.el);
        hoverEl = this.findTarget(this.HOVER_EVENT, { hand: this.el }, true);
        if (hoverEl) {
          hoverEl.removeEventListener('stateremoved', this.unWatch);
          hoverEl.addEventListener('stateremoved', this.unHover);
          this.lastHover = this.HOVER_EVENT;
        }
      }
    } 
  },
  // temporary target finding function
  peekHoveredEl: function () {
    return this.hoverEls.filter(e => e !== this.carried && e !== this.dragged && e !== this.stretched)[0];
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
      this._unWatch(evt.target);
      this._unHover(evt.target);
    }
  },
  /* inner unHover steps needed regardless of cause of unHover */
  _unHover: function(el) {
    var evt, mEvt;
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
    if (this.dragging && this.dragged) {
      this.dispatchMouseEvent(target, 'dragleave', this.dragged);
      this.dispatchMouseEvent(this.dragged, 'dragleave', target);
    } else {
      this.dispatchMouseEvent(target, 'mouseout', this.el);
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
  findTarget: function (evType, detail, filterUsed) {
    var elIndex, eligibleEls = this.hoverEls;
    if(filterUsed) {
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
