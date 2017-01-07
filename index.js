/* global AFRAME */

if (typeof AFRAME === 'undefined') {
  throw new Error('Component attempted to register before AFRAME was available.');
}

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
      default: ['gripdown', 'trackpaddown', 'triggerdown']
    },
    grabEndButtons: {
      default: ['gripup', 'trackpadup', 'triggerup']
    },
    stretchStartButtons: {
      default: ['gripdown', 'trackpaddown', 'triggerdown']
    },
    stretchEndButtons: {
      default: ['gripup', 'trackpadup', 'triggerup']
    },
    dragDropStartButtons: {
      default: ['gripdown', 'trackpaddown', 'triggerdown']
    },
    dragDropEndButtons: {
      default: ['gripup', 'trackpadup', 'triggerup']
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
    this.GRAB_EVENT = 'grab-start';
    this.UNGRAB_EVENT = 'grab-end';
    this.STRETCH_EVENT = 'stretch-start';
    this.UNSTRETCH_EVENT = 'stretch-end';
    this.HOVER_EVENT = 'dragover-start';
    this.UNHOVER_EVENT = 'dragover-end';
    this.DRAGDROP_EVENT = 'drag-drop';
    
    // links to other systems/components
    this.otherController = null;
    
    // state tracking
    this.hoverEls = [];
    this.grabbing = false;
    this.stretching = false;
    this.dragging = false;
    this.carried = null;
    this.stretched = null;
    this.dragged = null;
    
    this.findOtherController = this.findOtherController.bind(this);
    this.unHover = this.unHover.bind(this);
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
    var carried = this.dragged, 
      hitEl, dropTarget, ddevt, uhevt;
    if(carried && this.hoverEls.length !== 0) {
      dropTarget = this.hoverEls[0]; 
      ddevt = { hand: this.el, dropped: carried, on: dropTarget };
      dropTarget.emit(this.DRAGDROP_EVENT, ddevt);
      carried.emit(this.DRAGDROP_EVENT, ddevt);
      // clear list of backup targets to prevent triggering hover
      this.hoverEls = [];
      //this.unHover({ target: dropTarget }, true);
      this.unHover({ target: dropTarget, detail: { state: this.data.colliderState } });
    }
    this.dragging = false;
    this.dragged = null;
  },
  onHit: function(evt) {
    var hitEl = evt.detail.el;
    if(!hitEl) { return; } 
    if (this.grabbing && !this.carried) { 
      this.carried = hitEl;
      hitEl.emit(this.GRAB_EVENT, { hand: this.el });
    } 
    if (this.stretching && !this.stretched) {
      this.stretched = hitEl;
      if(hitEl === this.otherController.components['super-hands'].stretched) {
        hitEl.emit(this.STRETCH_EVENT, { 
          hand: this.otherController, 
          secondHand: this.el 
        });
      }
    }
    if(this.dragging) {
      if(!this.dragged) {
        /* prefer this.carried so that a drag started after a grab will work
           with carried element rather than a currently intersected drop target.
           fall back to hitEl in case a drag is initiated independent 
           of a grab */
        this.dragged = this.carried || hitEl;
      }
      if (hitEl !== this.dragged && this.hoverEls.indexOf(hitEl) === -1) {
        this.hoverEls.push(hitEl); 
        hitEl.addEventListener('stateremoved', this.unHover);
        if (this.hoverEls.length === 1) { this.hover(); }
      } 
    }
  },
  /* notify drag-drop target that entity is held over it  */
  hover: function() {
    var hvrevt;
    if(this.hoverEls.length) {
      hvrevt = { 
        hand: this.el, hovered: this.hoverEls[0], carried: this.carried
      };
      // only activate the first element in case of multiple overlapping targets
      this.hoverEls[0].emit(this.HOVER_EVENT, hvrevt);
      this.carried.emit(this.HOVER_EVENT, hvrevt);
    } 
  },
  /* tied to 'stateremoved' event for current hovered drop target */
  unHover: function (evt, force) {
    var hoverIndex, uhevt;
    // TODO: try using force param
    //if (force || evt.detail.state === this.data.colliderState) {
    if (evt.detail.state === this.data.colliderState) {
      /* TODO?: need to check if (currentTarget === target) in case this
          is bubbled up from a child that is also a drop target? */
      uhevt = { hand: this.el, hovered: evt.target, carried: this.carried };
      hoverIndex = this.hoverEls.indexOf(evt.target);
      evt.target.removeEventListener('stateremoved', this.unHover);
      evt.target.emit(this.UNHOVER_EVENT, uhevt);
      this.dragged.emit(this.UNHOVER_EVENT, uhevt);
      if (hoverIndex > -1) { this.hoverEls.splice(hoverIndex, 1); } 
      // activate backup target if present
      this.hover();
    }
  }
});
