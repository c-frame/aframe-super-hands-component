/* global AFRAME */

if (typeof AFRAME === 'undefined') {
  throw new Error('Component attempted to register before AFRAME was available.');
}

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
    
    this.findOtherController = this.findOtherController.bind(this);
    this.unHover = this.unHover.bind(this);
    this.unWatch = this.unWatch.bind(this);
    this.onHit = this.onHit.bind(this);
    this.onGrabStartButton = this.onGrabStartButton.bind(this);
    this.onGrabEndButton = this.onGrabEndButton.bind(this);
    this.onStretchStartButton = this.onStretchStartButton.bind(this);
    this.onStretchEndButton = this.onStretchEndButton.bind(this);
    this.onDragDropStartButton = this.onDragDropStartButton.bind(this);
    this.onDragDropEndButton = this.onDragDropEndButton.bind(this);
    this.findOtherController();
  },

  /**
   * Called when component is attached and when component data changes.
   * Generally modifies the entity based on the data.
   */
  update: function (oldData) {
    // TODO: update event listeners
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
 
  },
  /**
   * Called when entity pauses.
   * Use to stop or remove any dynamic or background behavior such as events.
   */
  pause: function () {
    this.el.sceneEl.removeEventListener('controllersupdated',  
                                        this.findOtherController);
    this.el.removeEventListener(this.data.colliderEvent, this.onHit);
    
    this.data.grabStartButtons.forEach( b => {
      this.el.removeEventListener(b, this.onGrabStartButton);
    });
    this.data.grabEndButtons.forEach( b => {
      this.el.removeEventListener(b, this.onGrabEndButton);
    });
    this.data.stretchStartButtons.forEach( b => {
      this.el.removeEventListener(b, this.onStretchStartButton);
    });
    this.data.stretchEndButtons.forEach( b => {
      this.el.removeEventListener(b, this.onStretchEndButton);
    });
    this.data.dragDropStartButtons.forEach( b => {
      this.el.removeEventListener(b, this.onDragDropStartButton);
    });
    this.data.dragDropEndButtons.forEach( b => {
      this.el.removeEventListener(b, this.onDragDropEndButton);
    });
  },

  /**
   * Called when entity resumes.
   * Use to continue or add any dynamic or background behavior such as events.
   */
  play: function () {
    this.el.sceneEl.addEventListener('controllersupdated',  
                                     this.findOtherController);
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
      this.stretched.emit(this.UNSTRETCH_EVENT, { hand: this.el });
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
  }
});
