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
	    this.DRAG_EVENT = 'drag-start';
	    this.DRAGOVER_EVENT = 'dragover-start';
	    this.UNDRAGOVER_EVENT = 'dragover-end';
	    this.DRAGDROP_EVENT = 'drag-drop';

	    // links to other systems/components
	    this.otherSuperHand = null;

	    // state tracking - global event handlers (GEH)
	    this.gehDragged = null;

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
	    this.dispatchMouseEventAll('mouseup', this.el, true);
	    this.dispatchMouseEventAll('click', this.el, true);
	    if (this.carried) {
	      this.carried.emit(this.UNGRAB_EVENT, { hand: this.el });
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
	        dropTarget,
	        carried = this.dragged;
	    this.dragging = false; // keep _unHover() from activating another droptarget
	    if (carried) {
	      this.dispatchMouseEvent(carried, 'dragend', this.el);
	      ddevt = { hand: this.el, dropped: carried, on: null };
	      dropTarget = this.findTarget(this.DRAGDROP_EVENT, ddevt, true);
	      ddevt.on = dropTarget;
	      this.emitCancelable(carried, this.DRAGDROP_EVENT, ddevt);
	      if (dropTarget) {
	        this._unHover(dropTarget);
	      }
	    }
	    carried = this.gehDragged;
	    if (carried) {
	      this.dispatchMouseEvent(carried, 'dragend', this.el);
	      // fire event both ways for all intersected targets 
	      this.dispatchMouseEventAll('drop', carried, true, true);
	      this.dispatchMouseEventAll('dragleave', carried, true, true);
	    }
	    this.dragged = null;
	    this.gehDragged = null;
	  },
	  onHit: function onHit(evt) {
	    var _this = this;

	    var hitEl = evt.detail.el,
	        used = false,
	        hitElIndex,
	        peekTarget,
	        useTarget;
	    if (!hitEl) {
	      return;
	    }
	    hitElIndex = this.hoverEls.indexOf(hitEl);
	    if (hitElIndex === -1) {
	      this.hoverEls.push(hitEl);
	      hitEl.addEventListener('stateremoved', this.unWatch);
	      this.dispatchMouseEvent(hitEl, 'mouseover', this.el);
	    }
	    // interactions target the oldest entity in the stack, if present
	    useTarget = function useTarget() {
	      if (!used) {
	        used = true;
	        hitEl = _this.hoverEls.length ? _this.peekHoveredEl() : hitEl;
	      }
	      return hitEl;
	    };
	    peekTarget = function peekTarget() {
	      return used ? hitEl : _this.peekHoveredEl() || hitEl;
	    };

	    if (this.grabbing) {
	      // Global Event Handler style
	      this.dispatchMouseEventAll('mousedown', this.el);
	      if (!this.carried) {
	        // A-Frame style
	        this.carried = this.findTarget(this.GRAB_EVENT, { hand: this.el });
	      }
	    }
	    if (this.stretching && !this.stretched) {
	      this.stretched = this.findTarget(this.STRETCH_EVENT, { hand: this.el });
	    }
	    if (this.dragging) {
	      if (!this.dragged) {
	        /* prefer this.carried so that a drag started after a grab will work
	         with carried element rather than a currently intersected drop target.
	         fall back to queue in case a drag is initiated independent 
	         of a grab */
	        if (this.carried) {
	          this.dragged = this.emitCancelable(this.carried, this.DRAG_EVENT, { hand: this.el });
	        }
	        if (!this.dragged) {
	          this.dragged = this.findTarget(this.DRAG_EVENT, { hand: this.el });
	        }
	      }
	      if (!this.gehDragged) {
	        this.gehDragged = this.dragged || this.peekHoveredEl();
	        this.dispatchMouseEvent(this.gehDragged, 'dragstart', this.el);
	      }
	    }
	    this.hover();
	  },
	  /* send the appropriate hovered gesture for the top entity in the stack */
	  hover: function hover() {
	    var hvrevt, hoverEl;
	    this.lastHover = null;
	    if (this.dragging) {
	      // events on targets and on dragged
	      this.dispatchMouseEventAll('dragenter', this.gehDragged, true, true);
	      if (this.dragged) {
	        hvrevt = {
	          hand: this.el, hovered: hoverEl, carried: this.dragged
	        };
	        hoverEl = this.findTarget(this.DRAGOVER_EVENT, hvrevt, true);
	        if (hoverEl) {
	          hoverEl.removeEventListener('stateremoved', this.unWatch);
	          hoverEl.addEventListener('stateremoved', this.unHover);
	          this.emitCancelable(this.dragged, this.DRAGOVER_EVENT, hvrevt);
	          this.lastHover = this.DRAGOVER_EVENT;
	        }
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
	  // temporary target finding function
	  peekHoveredEl: function peekHoveredEl() {
	    var _this2 = this;

	    return this.hoverEls.filter(function (e) {
	      return e !== _this2.gehDragged && e !== _this2.carried && e !== _this2.dragged && e !== _this2.stretched;
	    })[0];
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
	    if (evt.detail.state === this.data.colliderState) {
	      this._unWatch(evt.target);
	      this._unHover(evt.target);
	    }
	  },
	  /* inner unHover steps needed regardless of cause of unHover */
	  _unHover: function _unHover(el) {
	    var evt;
	    el.removeEventListener('stateremoved', this.unHover);
	    if (this.lastHover === this.DRAGOVER_EVENT) {
	      evt = { hand: this.el, hovered: el, carried: this.dragged };
	      this.emitCancelable(el, this.UNDRAGOVER_EVENT, evt);
	      if (this.dragged) {
	        this.emitCancelable(this.dragged, this.UNDRAGOVER_EVENT, evt);
	      }
	    } else if (this.lastHover === this.HOVER_EVENT) {
	      this.emitCancelable(el, this.UNHOVER_EVENT, { hand: this.el });
	    }
	    //activate next target, if present
	    this.hover();
	  },
	  unWatch: function unWatch(evt) {
	    if (evt.detail.state === this.data.colliderState) {
	      evt.target.removeEventListener('stateremoved', this.unWatch);
	      this._unWatch(evt.target);
	    }
	  },
	  _unWatch: function _unWatch(target) {
	    var hoverIndex = this.hoverEls.indexOf(target);
	    if (hoverIndex !== -1) {
	      this.hoverEls.splice(hoverIndex, 1);
	    }
	    if (this.gehDragged) {
	      this.dispatchMouseEvent(target, 'dragleave', this.gehDragged);
	      this.dispatchMouseEvent(this.gehDragged, 'dragleave', target);
	    } else {
	      this.dispatchMouseEvent(target, 'mouseout', this.el);
	    }
	  },
	  registerListeners: function registerListeners() {
	    var _this3 = this;

	    this.el.addEventListener(this.data.colliderEvent, this.onHit);

	    this.data.grabStartButtons.forEach(function (b) {
	      _this3.el.addEventListener(b, _this3.onGrabStartButton);
	    });
	    this.data.grabEndButtons.forEach(function (b) {
	      _this3.el.addEventListener(b, _this3.onGrabEndButton);
	    });
	    this.data.stretchStartButtons.forEach(function (b) {
	      _this3.el.addEventListener(b, _this3.onStretchStartButton);
	    });
	    this.data.stretchEndButtons.forEach(function (b) {
	      _this3.el.addEventListener(b, _this3.onStretchEndButton);
	    });
	    this.data.dragDropStartButtons.forEach(function (b) {
	      _this3.el.addEventListener(b, _this3.onDragDropStartButton);
	    });
	    this.data.dragDropEndButtons.forEach(function (b) {
	      _this3.el.addEventListener(b, _this3.onDragDropEndButton);
	    });
	  },
	  unRegisterListeners: function unRegisterListeners(data) {
	    var _this4 = this;

	    data = data || this.data;
	    if (Object.keys(data).length === 0) {
	      // Empty object passed on initalization
	      return;
	    }
	    this.el.removeEventListener(data.colliderEvent, this.onHit);

	    data.grabStartButtons.forEach(function (b) {
	      _this4.el.removeEventListener(b, _this4.onGrabStartButton);
	    });
	    data.grabEndButtons.forEach(function (b) {
	      _this4.el.removeEventListener(b, _this4.onGrabEndButton);
	    });
	    data.stretchStartButtons.forEach(function (b) {
	      _this4.el.removeEventListener(b, _this4.onStretchStartButton);
	    });
	    data.stretchEndButtons.forEach(function (b) {
	      _this4.el.removeEventListener(b, _this4.onStretchEndButton);
	    });
	    data.dragDropStartButtons.forEach(function (b) {
	      _this4.el.removeEventListener(b, _this4.onDragDropStartButton);
	    });
	    data.dragDropEndButtons.forEach(function (b) {
	      _this4.el.removeEventListener(b, _this4.onDragDropEndButton);
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
	  },
	  dispatchMouseEventAll: function dispatchMouseEventAll(name, relatedTarget, filterUsed, alsoReverse) {
	    var _this5 = this;

	    var els = this.hoverEls,
	        i;
	    if (filterUsed) {
	      els = els.filter(function (el) {
	        return el !== _this5.gehDragged && el !== _this5.carried && el !== _this5.dragged && el !== _this5.stretched;
	      });
	    }
	    if (alsoReverse) {
	      for (i = 0; i < els.length; i++) {
	        this.dispatchMouseEvent(els[i], name, relatedTarget);
	        this.dispatchMouseEvent(relatedTarget, name, els[i]);
	      }
	    } else {
	      for (i = 0; i < els.length; i++) {
	        this.dispatchMouseEvent(els[i], name, relatedTarget);
	      }
	    }
	  },
	  findTarget: function findTarget(evType, detail, filterUsed) {
	    var _this6 = this;

	    var elIndex,
	        eligibleEls = this.hoverEls;
	    if (filterUsed) {
	      eligibleEls = eligibleEls.filter(function (el) {
	        return el !== _this6.carried && el !== _this6.dragged && el !== _this6.stretched;
	      });
	    }
	    for (elIndex = 0; elIndex < eligibleEls.length; elIndex++) {
	      if (!this.emitCancelable(eligibleEls[elIndex], evType, detail)) {
	        return eligibleEls[elIndex];
	      }
	    }
	    return null;
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

	    this.el.addEventListener(this.HOVER_EVENT, this.start);
	    this.el.addEventListener(this.UNHOVER_EVENT, this.end);
	  },
	  remove: function remove() {
	    this.el.removeEventListener(this.HOVER_EVENT, this.start);
	    this.el.removeEventListener(this.UNHOVER_EVENT, this.end);
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

	    this.el.addEventListener(this.GRAB_EVENT, this.start);
	    this.el.addEventListener(this.UNGRAB_EVENT, this.end);
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
	  remove: function remove() {
	    this.el.removeEventListener(this.GRAB_EVENT, this.start);
	    this.el.removeEventListener(this.UNGRAB_EVENT, this.end);
	  },
	  start: function start(evt) {
	    if (this.grabbed) {
	      return;
	    } //already grabbed
	    this.grabber = evt.detail.hand;
	    this.grabbed = true;
	    this.el.addState(this.GRABBED_STATE);
	    // notify super-hands that the gesture was accepted
	    if (evt.preventDefault) {
	      evt.preventDefault();
	    }
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

	    this.el.addEventListener(this.STRETCH_EVENT, this.start);
	    this.el.addEventListener(this.UNSTRETCH_EVENT, this.end);
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
	  remove: function remove() {
	    this.el.removeEventListener(this.STRETCH_EVENT, this.start);
	    this.el.removeEventListener(this.UNSTRETCH_EVENT, this.end);
	  },
	  start: function start(evt) {
	    if (this.stretched) {
	      return;
	    } //already stretching
	    this.stretchers.push(evt.detail.hand);
	    if (this.stretchers.length === 2) {
	      this.stretched = true;
	      this.previousStretch = null;
	      this.el.addState(this.STRETCHED_STATE);
	    }
	    if (evt.preventDefault) {
	      evt.preventDefault();
	    } // gesture accepted
	  },
	  end: function end(evt) {
	    var stretcherIndex = this.stretchers.indexOf(evt.detail.hand);
	    if (stretcherIndex === -1) {
	      return;
	    }
	    this.stretchers.splice(stretcherIndex, 1);
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
	    this.DRAGGED_STATE = 'dragged';
	    this.HOVER_EVENT = 'dragover-start';
	    this.UNHOVER_EVENT = 'dragover-end';
	    this.DRAG_EVENT = 'drag-start';
	    this.DRAGDROP_EVENT = 'drag-drop';

	    this.hoverStart = this.hoverStart.bind(this);
	    this.dragStart = this.dragStart.bind(this);
	    this.hoverEnd = this.hoverEnd.bind(this);
	    this.dragEnd = this.dragEnd.bind(this);

	    this.el.addEventListener(this.HOVER_EVENT, this.hoverStart);
	    this.el.addEventListener(this.DRAG_EVENT, this.dragStart);
	    this.el.addEventListener(this.UNHOVER_EVENT, this.hoverEnd);
	    this.el.addEventListener(this.DRAGDROP_EVENT, this.dragEnd);
	  },
	  remove: function remove() {
	    this.el.removeEventListener(this.HOVER_EVENT, this.hoverStart);
	    this.el.removeEventListener(this.DRAG_EVENT, this.dragStart);
	    this.el.removeEventListener(this.UNHOVER_EVENT, this.hoverEnd);
	    this.el.removeEventListener(this.DRAGDROP_EVENT, this.dragEnd);
	  },
	  hoverStart: function hoverStart(evt) {
	    this.el.addState(this.HOVERED_STATE);
	    evt.preventDefault();
	  },
	  dragStart: function dragStart(evt) {
	    this.el.addState(this.DRAGGED_STATE);
	    evt.preventDefault();
	  },
	  hoverEnd: function hoverEnd(evt) {
	    this.el.removeState(this.HOVERED_STATE);
	  },
	  dragEnd: function dragEnd(evt) {
	    this.el.removeState(this.DRAGGED_STATE);
	    evt.preventDefault();
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