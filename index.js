require('./reaction_components/grabbable.js');

/* global AFRAME */

if (typeof AFRAME === 'undefined') {
  throw new Error('Component attempted to register before AFRAME was available.');
}

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
    this.STRETCHED_STATE = 'stretched';
    
    this.DRAGDROP_HOVERED_STATE = 'hovered';
    this.DRAGDROP_HOVERING_STATE = 'hovering';
    
    this.GRAB_EVENT = 'grab-start';
    this.UNGRAB_EVENT = 'grab-end';
    this.STRETCH_EVENT = 'stretch-start';
    this.UNSTRETCH_EVENT = 'stretch-end';
    this.HOVER_EVENT = 'dragover-start';
    this.UNHOVER_EVENT = 'dragover-end'
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
    this.onGrabEndbutton = this.onGrabEndbutton.bind(this);
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
    
    // TODO: bind based on schema
    this.el.removeEventListener('gripdown', this.onGripClose);

    this.el.removeEventListener('trackpaddown', this.onGripClose);
    
    this.el.removeEventListener('triggerdown', this.onGripClose);
    
    
    this.el.removeEventListener('gripup', this.onGripOpen);
    this.el.removeEventListener('trackpadup', this.onGripOpen);
    this.el.removeEventListener('triggerup', this.onGripOpen);
  },

  /**
   * Called when entity resumes.
   * Use to continue or add any dynamic or background behavior such as events.
   */
  play: function () {
    this.el.sceneEl.addEventListener('controllersupdated',  
                                     this.findOtherController);
    this.el.addEventListener(this.data.colliderEvent, this.onHit);
    
    // TODO: bind based on schema
    this.el.addEventListener('gripdown', this.onGripClose);
    this.el.addEventListener('gripup', this.onGripOpen);
    this.el.addEventListener('trackpaddown', this.onGripClose);
    this.el.addEventListener('trackpadup', this.onGripOpen);
    this.el.addEventListener('triggerdown', this.onGripClose);
    this.el.addEventListener('triggerup', this.onGripOpen);
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

  onGrabEndbutton: function (evt) {
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
    var hoverEls = this.hoverEls.slice(),
      carried = this.dragged, // TODO which is it?
      hitEl, dropTarget, ddevt, uhevt;
    if(carried && hoverEls.length !== 0) {
      dropTarget = hoverEls[0]; 
      ddevt = { hand: this.el, dropped: carried, on: dropTarget };
      dropTarget.emit(this.DRAGDROP_EVENT, ddevt);
      carried.emit(this.DRAGDROP_EVENT, ddevt);
      uhevt = { hand: this.el, hovered: dropTarget, carried: carried };
      dropTarget.emit(this.UNHOVER_EVENT, uhevt);
      carried.emit(this.UNHOVER_EVENT, uhevt);
    },
    // clear list of backup targets to prevent triggering hover
    this.hoverEls = [];
    this.dragging = false;
    this.dragged = null;
  },
  onHit: function(evt) {
    var hitEl = evt.detail.el;
    // return if no valid interaction state
    if(!hitEl || hitEl === this.carried) { return; } 
    if (!this.carried) { // empty hand
      this.carried = hitEl;
      if (hitEl.is(this.GRABBED_STATE) && this.stretching) { // second hand grab (AKA stretch)
        hitEl.emit(this.STRETCH_EVENT, { hand: this.el, secondHand: this.otherController});
      } else {
        hitEl.emit(this.GRAB_EVENT, { hand: this.el });
      } 
    } else if ((!this.data.dropTargetClasses.length || 
                this.data.dropTargetClasses
                  .filter(x => hitEl.classList.contains(x)).length) &&
               this.hoverEls.indexOf(hitEl) === -1) { 
      // hand full and hitEl is a valid, new drag-drop target
      this.hoverEls.push(hitEl); 
      hitEl.addEventListener('stateremoved', this.unHover);
      if (this.hoverEls.length === 1) { this.hover(); }
    } 
  },
  /* notify drag-drop target that entity is held over it  */
  hover: function() {
    if(this.hoverEls.length) {
      // only add to first element in case of multiple overlapping targets
      this.hoverEls[0].addState(this.DRAGDROP_HOVERED_STATE);
      this.carried.addState(this.DRAGDROP_HOVERING_STATE);
    } else {
      this.carried.removeState(this.DRAGDROP_HOVERING_STATE);
    }
  },
  /* tied to 'stateremoved' event for current hovered drop target */
  unHover: function (evt) {
    var hoverIndex;
    if (evt.detail.state == this.data.colliderState || 
        evt.detail.state == this.DRAGDROP_HOVERED_STATE) {
      /* TODO?: need to check if (currentTarget === target) in case this
          is bubbled up from a child that is also a drop target? */
      hoverIndex = this.hoverEls.indexOf(evt.target);
      evt.target.removeEventListener('stateremoved', this.unHover);
      evt.target.removeState(this.DRAGDROP_HOVERED_STATE);
      if (hoverIndex > -1) { this.hoverEls.splice(hoverIndex, 1); } 
      // activate backup target if present
      this.hover();
    }
  }
});
