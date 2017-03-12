/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	/* global AFRAME */

	if (typeof AFRAME === 'undefined') {
	  throw new Error('Component attempted to register before AFRAME was available.');
	}

	__webpack_require__(1);
	__webpack_require__(2);
	__webpack_require__(3);
	__webpack_require__(4);
	__webpack_require__(5);
	__webpack_require__(6);

	/**
	 * Super Hands component for A-Frame.
	 */
	AFRAME.registerComponent('super-hands', {
	  schema: {
	    colliderState: { default: 'collided' },
	    colliderEvent: { default: 'hit' },
	    grabStartButtons: {
	      default: ['gripdown', 'trackpaddown', 'triggerdown', 'gripclose', 'pointup', 'thumbup', 'pointingstart', 'pistolstart', 'thumbstickdown']
	    },
	    grabEndButtons: {
	      default: ['gripup', 'trackpadup', 'triggerup', 'gripopen', 'pointdown', 'thumbdown', 'pointingend', 'pistolend', 'thumbstickup']
	    },
	    stretchStartButtons: {
	      default: ['gripdown', 'trackpaddown', 'triggerdown', 'gripclose', 'pointup', 'thumbup', 'pointingstart', 'pistolstart', 'thumbstickdown']
	    },
	    stretchEndButtons: {
	      default: ['gripup', 'trackpadup', 'triggerup', 'gripopen', 'pointdown', 'thumbdown', 'pointingend', 'pistolend', 'thumbstickup']
	    },
	    dragDropStartButtons: {
	      default: ['gripdown', 'trackpaddown', 'triggerdown', 'gripclose', 'pointup', 'thumbup', 'pointingstart', 'pistolstart', 'thumbstickdown']
	    },
	    dragDropEndButtons: {
	      default: ['gripup', 'trackpadup', 'triggerup', 'gripopen', 'pointdown', 'thumbdown', 'pointingend', 'pistolend', 'thumbstickup']
	    }
	  },

	  /**
	   * Set if component needs multiple instancing.
	   */
	  multiple: false,

	  /**
	   * Called once when component is attached. Generally for initial setup.
	   */
	  init: function init() {
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
	  update: function update(oldData) {
	    // TODO: update event listeners
	    this.unRegisterListeners(oldData);
	    this.registerListeners();
	  },

	  /**
	   * Called when a component is removed (e.g., via removeAttribute).
	   * Generally undoes all modifications to the entity.
	   */
	  remove: function remove() {
	    this.system.unregisterMe(this);
	    // move listener registration to init/remove
	    // as described in according to AFRAME 0.5.0 component guide
	    this.unRegisterListeners();
	  },
	  /**
	   * Called when entity pauses.
	   * Use to stop or remove any dynamic or background behavior such as events.
	   */
	  pause: function pause() {},

	  /**
	   * Called when entity resumes.
	   * Use to continue or add any dynamic or background behavior such as events.
	   */
	  play: function play() {},
	  onGrabStartButton: function onGrabStartButton(evt) {
	    this.grabbing = true;
	  },

	  onGrabEndButton: function onGrabEndButton(evt) {
	    var mEvt;
	    if (this.carried) {
	      this.carried.emit(this.UNGRAB_EVENT, { hand: this.el });
	      mEvt = new MouseEvent('mouseup', { relatedTarget: this.el });
	      this.carried.dispatchEvent(mEvt);
	      mEvt = new MouseEvent('click', { relatedTarget: this.el });
	      this.carried.dispatchEvent(mEvt);
	      this.carried = null;
	    }
	    this.grabbing = false;
	  },
	  onStretchStartButton: function onStretchStartButton(evt) {
	    this.stretching = true;
	  },
	  onStretchEndButton: function onStretchEndButton(evt) {
	    if (this.stretched) {
	      // avoid firing event twice when both hands release
	      if (this.otherSuperHand.stretched) {
	        this.stretched.emit(this.UNSTRETCH_EVENT, { hand: this.el });
	      }
	      this.stretched = null;
	    }
	    this.stretching = false;
	  },
	  onDragDropStartButton: function onDragDropStartButton(evt) {
	    this.dragging = true;
	  },
	  onDragDropEndButton: function onDragDropEndButton(evt) {
	    var ddevt,
	        mEvt,
	        carried = this.dragged,
	        dropTarget = this.hoverEls[0];
	    this.dragging = false; // keep _unHover() from activating another droptarget
	    if (carried) {
	      mEvt = new MouseEvent('dragend', { relatedTarget: this.el });
	      carried.dispatchEvent(mEvt);
	      if (dropTarget) {
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
	  onHit: function onHit(evt) {
	    var _this = this;

	    var hitEl = evt.detail.el,
	        used = false,
	        hitElIndex,
	        mEvt,
	        peekTarget,
	        useTarget,
	        gestureAccepted;
	    if (!hitEl) {
	      return;
	    }
	    hitElIndex = this.hoverEls.indexOf(hitEl);
	    // interactions target the oldest entity in the stack, if present
	    useTarget = function useTarget() {
	      if (!used) {
	        used = true;
	        hitEl = _this.hoverEls.length ? _this.useHoveredEl() : hitEl;
	      }
	      return hitEl;
	    };
	    peekTarget = function peekTarget() {
	      return used ? hitEl : _this.peekHoveredEl() || hitEl;
	    };

	    if (this.grabbing && !this.carried) {
	      // Global Event Handler style
	      this.dispatchMouseEvent(peekTarget(), 'mousedown', this.el);
	      // A-Frame style
	      gestureAccepted = !this.emitCancelable(peekTarget(), this.GRAB_EVENT, { hand: this.el });
	      if (gestureAccepted) {
	        this.carried = useTarget();
	      }
	    }
	    if (this.stretching && !this.stretched) {
	      this.stretched = getTarget();
	      if (this.stretched === this.otherSuperHand.stretched) {
	        this.stretched.emit(this.STRETCH_EVENT, {
	          hand: this.otherSuperHand.el, secondHand: this.el
	        });
	      }
	    }
	    if (this.dragging && !this.dragged) {
	      /* prefer this.carried so that a drag started after a grab will work
	         with carried element rather than a currently intersected drop target.
	         fall back to hitEl in case a drag is initiated independent 
	         of a grab */
	      this.dragged = this.carried || getTarget();
	      mEvt = new MouseEvent('dragstart', { relatedTarget: this.el });
	      this.dragged.dispatchEvent(mEvt);
	      this.hover(); // refresh hover in case already over a target
	    }
	    // keep stack of currently intersected but not interacted entities 
	    if (!used && hitElIndex === -1 && hitEl !== this.carried && hitEl !== this.stretched && hitEl !== this.dragged) {
	      this.hoverEls.push(hitEl);
	      hitEl.addEventListener('stateremoved', this.unWatch);
	      if (this.hoverEls.length === 1) {
	        this.hover();
	      }
	    }
	  },
	  /* send the appropriate hovered gesture for the top entity in the stack */
	  hover: function hover() {
	    var hvrevt, hoverEl, mEvt;
	    if (this.hoverEls.length) {
	      hoverEl = this.hoverEls[0];
	      hoverEl.removeEventListener('stateremoved', this.unWatch);
	      hoverEl.addEventListener('stateremoved', this.unHover);
	      if (this.dragging && this.dragged) {
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
	  peekHoveredEl: function peekHoveredEl() {
	    return this.hoverEls[0];
	  },
	  /* called when the current target entity is used by another gesture */
	  useHoveredEl: function useHoveredEl() {
	    var el = this.hoverEls.shift();
	    this._unHover(el);
	    return el;
	  },
	  /* tied to 'stateremoved' event for hovered entities,
	     called when controller moves out of collision range of entity */
	  unHover: function unHover(evt) {
	    var hoverIndex;
	    if (evt.detail.state === this.data.colliderState) {
	      hoverIndex = this.hoverEls.indexOf(evt.target);
	      if (hoverIndex !== -1) {
	        this.hoverEls.splice(hoverIndex, 1);
	      }
	      this._unHover(evt.target);
	    }
	  },
	  /* inner unHover steps needed regardless of cause of unHover */
	  _unHover: function _unHover(el) {
	    var evt, mEvt;
	    el.removeEventListener('stateremoved', this.unHover);
	    if (this.lastHover === this.DRAGOVER_EVENT) {
	      evt = { hand: this.el, hovered: el, carried: this.dragged };
	      el.emit(this.UNDRAGOVER_EVENT, evt);
	      mEvt = new MouseEvent('dragleave', { relatedTarget: this.dragged });
	      el.dispatchEvent(mEvt);
	      if (this.dragged) {
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
	  unWatch: function unWatch(evt) {
	    if (evt.detail.state === this.data.colliderState) {
	      var hoverIndex = this.hoverEls.indexOf(evt.target);
	      evt.target.removeEventListener('stateremoved', this.unWatch);
	      if (hoverIndex !== -1) {
	        this.hoverEls.splice(hoverIndex, 1);
	      }
	    }
	  },
	  registerListeners: function registerListeners() {
	    var _this2 = this;

	    this.el.addEventListener(this.data.colliderEvent, this.onHit);

	    this.data.grabStartButtons.forEach(function (b) {
	      _this2.el.addEventListener(b, _this2.onGrabStartButton);
	    });
	    this.data.grabEndButtons.forEach(function (b) {
	      _this2.el.addEventListener(b, _this2.onGrabEndButton);
	    });
	    this.data.stretchStartButtons.forEach(function (b) {
	      _this2.el.addEventListener(b, _this2.onStretchStartButton);
	    });
	    this.data.stretchEndButtons.forEach(function (b) {
	      _this2.el.addEventListener(b, _this2.onStretchEndButton);
	    });
	    this.data.dragDropStartButtons.forEach(function (b) {
	      _this2.el.addEventListener(b, _this2.onDragDropStartButton);
	    });
	    this.data.dragDropEndButtons.forEach(function (b) {
	      _this2.el.addEventListener(b, _this2.onDragDropEndButton);
	    });
	  },
	  unRegisterListeners: function unRegisterListeners(data) {
	    var _this3 = this;

	    data = data || this.data;
	    if (Object.keys(data).length === 0) {
	      // Empty object passed on initalization
	      return;
	    }
	    this.el.removeEventListener(data.colliderEvent, this.onHit);

	    data.grabStartButtons.forEach(function (b) {
	      _this3.el.removeEventListener(b, _this3.onGrabStartButton);
	    });
	    data.grabEndButtons.forEach(function (b) {
	      _this3.el.removeEventListener(b, _this3.onGrabEndButton);
	    });
	    data.stretchStartButtons.forEach(function (b) {
	      _this3.el.removeEventListener(b, _this3.onStretchStartButton);
	    });
	    data.stretchEndButtons.forEach(function (b) {
	      _this3.el.removeEventListener(b, _this3.onStretchEndButton);
	    });
	    data.dragDropStartButtons.forEach(function (b) {
	      _this3.el.removeEventListener(b, _this3.onDragDropStartButton);
	    });
	    data.dragDropEndButtons.forEach(function (b) {
	      _this3.el.removeEventListener(b, _this3.onDragDropEndButton);
	    });
	  },
	  emitCancelable: function emitCancelable(target, name, detail) {
	    var data, evt;
	    detail = detail || {};
	    data = { bubbles: true, cancelable: true, detail: detail };
	    data.detail.target = data.detail.target || target;
	    evt = new CustomEvent(name, data);
	    return target.dispatchEvent(evt);
	  },
	  dispatchMouseEvent: function dispatchMouseEvent(target, name, relatedTarget) {
	    var mEvt = new MouseEvent(name, { relatedTarget: relatedTarget });
	    target.dispatchEvent(mEvt);
	  }
	});

/***/ },
/* 1 */
/***/ function(module, exports) {

	'use strict';

	AFRAME.registerSystem('super-hands', {
	  init: function init() {
	    this.superHands = [];
	  },
	  registerMe: function registerMe(comp) {
	    //when second hand registers, store links
	    if (this.superHands.length === 1) {
	      this.superHands[0].otherSuperHand = comp;
	      comp.otherSuperHand = this.superHands[0];
	    }
	    this.superHands.push(comp);
	  },
	  unregisterMe: function unregisterMe(comp) {
	    var index = this.superHands.indexOf(comp);
	    if (index !== -1) {
	      this.superHands.splice(index, 1);
	    }
	    this.superHands.forEach(function (x) {
	      if (x.otherSuperHand === comp) {
	        x.otherSuperHand = null;
	      }
	    });
	  }
	});

/***/ },
/* 2 */
/***/ function(module, exports) {

	'use strict';

	AFRAME.registerComponent('hoverable', {
	  init: function init() {
	    this.HOVERED_STATE = 'hovered';
	    this.HOVER_EVENT = 'hover-start';
	    this.UNHOVER_EVENT = 'hover-end';

	    this.hoverers = [];

	    this.start = this.start.bind(this);
	    this.end = this.end.bind(this);
	  },
	  pause: function pause() {
	    this.el.removeEventListener(this.HOVER_EVENT, this.start);
	    this.el.removeEventListener(this.UNHOVER_EVENT, this.end);
	  },
	  play: function play() {
	    this.el.addEventListener(this.HOVER_EVENT, this.start);
	    this.el.addEventListener(this.UNHOVER_EVENT, this.end);
	  },
	  start: function start(evt) {
	    this.el.addState(this.HOVERED_STATE);
	    if (this.hoverers.indexOf(evt.detail.hand) === -1) {
	      this.hoverers.push(evt.detail.hand);
	    }
	  },
	  end: function end(evt) {
	    var handIndex = this.hoverers.indexOf(evt.detail.hand);
	    if (handIndex !== -1) {
	      this.hoverers.splice(handIndex, 1);
	    }
	    if (this.hoverers.length < 1) {
	      this.el.removeState(this.HOVERED_STATE);
	    }
	  }
	});

/***/ },
/* 3 */
/***/ function(module, exports) {

	'use strict';

	AFRAME.registerComponent('grabbable', {
	  schema: {
	    usePhysics: { default: 'ifavailable' }
	  },
	  init: function init() {
	    this.GRABBED_STATE = 'grabbed';
	    this.GRAB_EVENT = 'grab-start';
	    this.UNGRAB_EVENT = 'grab-end';
	    this.constraint = null;
	    this.grabbed = false;

	    this.start = this.start.bind(this);
	    this.end = this.end.bind(this);
	  },
	  update: function update(oldDat) {
	    if (this.data.usePhysics === 'never' && this.constraint) {
	      this.el.body.world.removeConstraint(this.constraint);
	      this.constraint = null;
	    }
	  },
	  tick: function tick() {
	    if (this.grabbed && !this.constraint && this.data.usePhysics !== 'only') {
	      var handPosition = this.grabber.getAttribute('position'),
	          previousPosition = this.previousPosition || handPosition,
	          deltaPosition = {
	        x: handPosition.x - previousPosition.x,
	        y: handPosition.y - previousPosition.y,
	        z: handPosition.z - previousPosition.z
	      },
	          position = this.el.getAttribute('position');

	      this.previousPosition = handPosition;
	      this.el.setAttribute('position', {
	        x: position.x + deltaPosition.x,
	        y: position.y + deltaPosition.y,
	        z: position.z + deltaPosition.z
	      });
	    }
	  },
	  pause: function pause() {
	    this.el.removeEventListener(this.GRAB_EVENT, this.start);
	    this.el.removeEventListener(this.UNGRAB_EVENT, this.end);
	  },
	  play: function play() {
	    this.el.addEventListener(this.GRAB_EVENT, this.start);
	    this.el.addEventListener(this.UNGRAB_EVENT, this.end);
	  },
	  start: function start(evt) {
	    if (this.grabbed) {
	      return;
	    } //already grabbed
	    this.grabber = evt.detail.hand;
	    this.grabbed = true;
	    this.el.addState(this.GRABBED_STATE);
	    if (this.data.usePhysics !== 'never' && this.el.body && this.grabber.body) {
	      this.constraint = new window.CANNON.LockConstraint(this.el.body, this.grabber.body);
	      this.el.body.world.addConstraint(this.constraint);
	    } else if (this.data.usePhysics !== 'only') {
	      this.previousPosition = null;
	    }
	  },
	  end: function end(evt) {
	    if (evt.detail.hand !== this.grabber) {
	      return;
	    }
	    if (this.constraint) {
	      this.el.body.world.removeConstraint(this.constraint);
	      this.constraint = null;
	    }
	    this.grabber = null;
	    this.grabbed = false;
	    this.el.removeState(this.GRABBED_STATE);
	  }
	});

/***/ },
/* 4 */
/***/ function(module, exports) {

	'use strict';

	AFRAME.registerComponent('stretchable', {
	  schema: {
	    usePhysics: { default: 'ifavailable' }
	  },
	  init: function init() {
	    this.STRETCHED_STATE = 'stretched';
	    this.STRETCH_EVENT = 'stretch-start';
	    this.UNSTRETCH_EVENT = 'stretch-end';
	    this.stretched = false;
	    this.stretchers = [];

	    this.start = this.start.bind(this);
	    this.end = this.end.bind(this);
	  },
	  update: function update(oldDat) {},
	  tick: function tick() {
	    if (!this.stretched) {
	      return;
	    }
	    var scale = new THREE.Vector3().copy(this.el.getAttribute('scale')),
	        myGeom = this.el.getAttribute('geometry'),
	        handPos = new THREE.Vector3().copy(this.stretchers[0].getAttribute('position')),
	        otherHandPos = new THREE.Vector3().copy(this.stretchers[1].getAttribute('position')),
	        currentStretch = handPos.distanceTo(otherHandPos),
	        deltaStretch = 1;
	    if (this.previousStretch !== null && currentStretch !== 0) {
	      deltaStretch = currentStretch / this.previousStretch;
	    }
	    this.previousStretch = currentStretch;
	    scale = scale.multiplyScalar(deltaStretch);
	    this.el.setAttribute('scale', scale);
	    // force scale update for physics body
	    if (this.el.body && this.data.usePhysics !== 'never') {
	      var physicsShape = this.el.body.shapes[0];
	      if (physicsShape.halfExtents) {
	        physicsShape.halfExtents.scale(deltaStretch, physicsShape.halfExtents);
	        physicsShape.updateConvexPolyhedronRepresentation();
	      } else {
	        if (!this.shapeWarned) {
	          console.warn("Unable to stretch physics body: unsupported shape");
	          this.shapeWarned = true;
	        }
	        // todo: suport more shapes
	      }
	      this.el.body.updateBoundingRadius();
	    }
	  },
	  pause: function pause() {
	    this.el.removeEventListener(this.STRETCH_EVENT, this.start);
	    this.el.removeEventListener(this.UNSTRETCH_EVENT, this.end);
	  },
	  play: function play() {
	    this.el.addEventListener(this.STRETCH_EVENT, this.start);
	    this.el.addEventListener(this.UNSTRETCH_EVENT, this.end);
	  },
	  start: function start(evt) {
	    if (this.stretched) {
	      return;
	    } //already stretching
	    this.stretchers.push(evt.detail.hand, evt.detail.secondHand);
	    this.stretched = true;
	    this.previousStretch = null;
	    this.el.addState(this.STRETCHED_STATE);
	  },
	  end: function end(evt) {
	    if (this.stretchers.indexOf(evt.detail.hand) === -1) {
	      return;
	    }
	    this.stretchers = [];
	    this.stretched = false;
	    this.el.removeState(this.STRETCHED_STATE);
	  }
	});

/***/ },
/* 5 */
/***/ function(module, exports) {

	'use strict';

	AFRAME.registerComponent('drag-droppable', {
	  init: function init() {
	    this.HOVERED_STATE = 'dragover';
	    this.HOVER_EVENT = 'dragover-start';
	    this.UNHOVER_EVENT = 'dragover-end';
	    this.DRAGDROP_EVENT = 'drag-drop';

	    this.start = this.start.bind(this);
	    this.end = this.end.bind(this);

	    this.el.addEventListener(this.HOVER_EVENT, this.start);
	    this.el.addEventListener(this.UNHOVER_EVENT, this.end);
	  },
	  remove: function remove() {
	    this.el.removeEventListener(this.HOVER_EVENT, this.start);
	    this.el.removeEventListener(this.UNHOVER_EVENT, this.end);
	  },
	  start: function start(evt) {
	    this.el.addState(this.HOVERED_STATE);
	  },
	  end: function end(evt) {
	    this.el.removeState(this.HOVERED_STATE);
	  }
	});

/***/ },
/* 6 */
/***/ function(module, exports) {

	'use strict';

	AFRAME.registerComponent('clickable', {
	  schema: {
	    onclick: { type: 'string' }
	  },
	  init: function init() {
	    this.CLICKED_STATE = 'clicked';
	    this.CLICK_EVENT = 'grab-start';
	    this.UNCLICK_EVENT = 'grab-end';
	    this.clickers = [];

	    this.start = this.start.bind(this);
	    this.end = this.end.bind(this);
	    this.el.addEventListener(this.CLICK_EVENT, this.start);
	    this.el.addEventListener(this.UNCLICK_EVENT, this.end);
	  },
	  remove: function remove() {
	    this.el.removeEventListener(this.CLICK_EVENT, this.start);
	    this.el.removeEventListener(this.UNCLICK_EVENT, this.end);
	  },
	  start: function start(evt) {
	    this.el.addState(this.CLICKED_STATE);
	    if (this.clickers.indexOf(evt.detail.hand) === -1) {
	      this.clickers.push(evt.detail.hand);
	    }
	  },
	  end: function end(evt) {
	    var handIndex = this.clickers.indexOf(evt.detail.hand);
	    if (handIndex !== -1) {
	      this.clickers.splice(handIndex, 1);
	    }
	    if (this.clickers.length < 1) {
	      this.el.removeState(this.CLICKED_STATE);
	    }
	  }
	});

/***/ }
/******/ ]);