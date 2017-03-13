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
        dropTarget = this.hoverEls[0];
    this.dragging = false; // keep _unHover() from activating another droptarget
    if(carried) {
      mEvt = new MouseEvent('dragend', { relatedTarget: this.el });
      carried.dispatchEvent(mEvt);
      if(dropTarget) {
        ddevt = { hand: this.el, dropped: carried, on: dropTarget };
        dropTarget.emit(this.DRAGDROP_EVENT, ddevt);
        mEvt = new MouseEvent('drop', { relatedTarget: carried });
        dropTarget.dispatchEvent(mEvt);
        carried.emit(this.DRAGDROP_EVENT, ddevt);
        mEvt = new MouseEvent('drop', { relatedTarget: dropTarget });
        carried.dispatchEvent(mEvt);
        this._unHover(dropTarget);
      }
    }
    this.dragged = null;
  },
  onHit: function(evt) {
    var hitEl = evt.detail.el, used = false, hitElIndex, mEvt,
        peekTarget, useTarget, gestureRejected;
    if (!hitEl) { return; } 
    hitElIndex = this.hoverEls.indexOf(hitEl);
    // interactions target the oldest entity in the stack, if present
    useTarget = () => {
      if (!used) {
        used = true;
        hitEl = this.hoverEls.length ? this.useHoveredEl() : hitEl;
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
      gestureRejected = this
        .emitCancelable(peekTarget(), this.GRAB_EVENT, { hand: this.el });
      if (!gestureRejected) { this.carried = useTarget(); }

    } 
    if (this.stretching && !this.stretched) {
      this.stretched = peekTarget();
      if (this.stretched === this.otherSuperHand.stretched) {
        gestureRejected = this.emitCancelable(this.stretched, this.STRETCH_EVENT, { 
          hand: this.otherSuperHand.el, secondHand: this.el 
        });
        if (!gestureRejected) { useTarget(); } else { this.stretched = null; }
      }
    }
    if (this.dragging && !this.dragged) {
      /* prefer this.carried so that a drag started after a grab will work
         with carried element rather than a currently intersected drop target.
         fall back to hitEl in case a drag is initiated independent 
         of a grab */
      this.dragged = this.carried || useTarget();
      mEvt = new MouseEvent('dragstart', { relatedTarget: this.el });
      this.dragged.dispatchEvent(mEvt);
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
    var hvrevt, hoverEl, mEvt;
    if(this.hoverEls.length) {
      hoverEl = this.peekHoveredEl();
      hoverEl.removeEventListener('stateremoved', this.unWatch);
      hoverEl.addEventListener('stateremoved', this.unHover);
      if(this.dragging && this.dragged) {
        hvrevt = { 
          hand: this.el, hovered: hoverEl, carried: this.dragged
        };
        hoverEl.emit(this.DRAGOVER_EVENT, hvrevt);
        mEvt = new MouseEvent('dragenter', { relatedTarget: this.dragged });
        hoverEl.dispatchEvent(mEvt);
        this.dragged.emit(this.DRAGOVER_EVENT, hvrevt);
        mEvt = new MouseEvent('dragenter', { relatedTarget: hoverEl });
        this.dragged.dispatchEvent(mEvt);
        this.lastHover = this.DRAGOVER_EVENT;
      } else {
        hoverEl.emit(this.HOVER_EVENT, { hand: this.el });
        mEvt = new MouseEvent('mouseover', { relatedTarget: this.el });
        hoverEl.dispatchEvent(mEvt);
        this.lastHover = this.HOVER_EVENT;
      }
    } else {
      this.lastHover = null;
    } 
  },
  peekHoveredEl: function () {
    return this.hoverEls[0];
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
    var evt, mEvt;
    el.removeEventListener('stateremoved', this.unHover);
    if(this.lastHover === this.DRAGOVER_EVENT) {
      evt = { hand: this.el, hovered: el, carried: this.dragged };
      el.emit(this.UNDRAGOVER_EVENT, evt);
      mEvt = new MouseEvent('dragleave', { relatedTarget: this.dragged });
      el.dispatchEvent(mEvt);
      if(this.dragged) { 
        this.dragged.emit(this.UNDRAGOVER_EVENT, evt); 
        mEvt = new MouseEvent('dragleave', { relatedTarget: el });
        this.dragged.dispatchEvent(mEvt);
      }
    } else if (this.lastHover === this.HOVER_EVENT) {
      el.emit(this.UNHOVER_EVENT, { hand: this.el });
      mEvt = new MouseEvent('mouseout', { relatedTarget: this.el });
      el.dispatchEvent(mEvt);
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
  }
});
