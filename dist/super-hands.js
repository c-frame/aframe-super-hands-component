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
	__webpack_require__(6);
	__webpack_require__(7);
	__webpack_require__(8);
	__webpack_require__(9);
	__webpack_require__(10);
	__webpack_require__(11);

	/**
	 * Super Hands component for A-Frame.
	 */
	AFRAME.registerComponent('super-hands', {
	  schema: {
	    colliderState: { default: 'collided' },
	    colliderEvent: { default: 'hit' },
	    colliderEventProperty: { default: 'el' },
	    colliderEndEvent: { default: '' },
	    colliderEndEventProperty: { default: '' },
	    grabStartButtons: {
	      default: ['gripdown', 'trackpaddown', 'triggerdown', 'gripclose', 'pointup', 'thumbup', 'pointingstart', 'pistolstart', 'thumbstickdown', 'mousedown', 'touchstart']
	    },
	    grabEndButtons: {
	      default: ['gripup', 'trackpadup', 'triggerup', 'gripopen', 'pointdown', 'thumbdown', 'pointingend', 'pistolend', 'thumbstickup', 'mouseup', 'touchend']
	    },
	    stretchStartButtons: {
	      default: ['gripdown', 'trackpaddown', 'triggerdown', 'gripclose', 'pointup', 'thumbup', 'pointingstart', 'pistolstart', 'thumbstickdown', 'mousedown', 'touchstart']
	    },
	    stretchEndButtons: {
	      default: ['gripup', 'trackpadup', 'triggerup', 'gripopen', 'pointdown', 'thumbdown', 'pointingend', 'pistolend', 'thumbstickup', 'mouseup', 'touchend']
	    },
	    dragDropStartButtons: {
	      default: ['gripdown', 'trackpaddown', 'triggerdown', 'gripclose', 'pointup', 'thumbup', 'pointingstart', 'pistolstart', 'thumbstickdown', 'mousedown', 'touchstart']
	    },
	    dragDropEndButtons: {
	      default: ['gripup', 'trackpadup', 'triggerup', 'gripopen', 'pointdown', 'thumbdown', 'pointingend', 'pistolend', 'thumbstickup', 'mouseup', 'touchend']
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
	  update: function update(oldData) {
	    this.unRegisterListeners(oldData);
	    this.registerListeners();
	  },

	  /**
	   * Called when a component is removed (e.g., via removeAttribute).
	   * Generally undoes all modifications to the entity.
	   */
	  remove: function remove() {
	    var _this = this;

	    this.system.unregisterMe(this);
	    this.unRegisterListeners();
	    // cleanup states
	    this.hoverEls.forEach(function (h) {
	      h.removeEventListener('stateremoved', _this.unWatch);
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
	  pause: function pause() {},

	  /**
	   * Called when entity resumes.
	   * Use to continue or add any dynamic or background behavior such as events.
	   */
	  play: function play() {},
	  onGrabStartButton: function onGrabStartButton(evt) {
	    var carried = this.state.get(this.GRAB_EVENT);
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
	  onGrabEndButton: function onGrabEndButton(evt) {
	    var _this2 = this;

	    var clickables = this.hoverEls.filter(function (h) {
	      return _this2.gehClicking.has(h);
	    });
	    var grabbed = this.state.get(this.GRAB_EVENT);
	    var endEvt = { hand: this.el, buttonEvent: evt };
	    this.dispatchMouseEventAll('mouseup', this.el);
	    for (var i = 0; i < clickables.length; i++) {
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
	  onStretchStartButton: function onStretchStartButton(evt) {
	    var stretched = this.state.get(this.STRETCH_EVENT);
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
	  onStretchEndButton: function onStretchEndButton(evt) {
	    var stretched = this.state.get(this.STRETCH_EVENT);
	    var endEvt = { hand: this.el, buttonEvent: evt };
	    // check if end event accepted
	    if (stretched && !this.emitCancelable(stretched, this.UNSTRETCH_EVENT, endEvt)) {
	      this.promoteHoveredEl(stretched);
	      this.state.delete(this.STRETCH_EVENT);
	      this.hover();
	    }
	  },
	  onDragDropStartButton: function onDragDropStartButton(evt) {
	    var dragged = this.state.get(this.DRAG_EVENT);
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
	  onDragDropEndButton: function onDragDropEndButton(evt) {
	    var _this3 = this;

	    var carried = this.state.get(this.DRAG_EVENT);
	    this.dragging = false; // keep _unHover() from activating another droptarget
	    this.gehDragged.forEach(function (carried) {
	      _this3.dispatchMouseEvent(carried, 'dragend', _this3.el);
	      // fire event both ways for all intersected targets
	      _this3.dispatchMouseEventAll('drop', carried, true, true);
	      _this3.dispatchMouseEventAll('dragleave', carried, true, true);
	    });
	    this.gehDragged.clear();
	    if (carried) {
	      var ddEvt = {
	        hand: this.el,
	        dropped: carried,
	        on: null,
	        buttonEvent: evt
	      };
	      var endEvt = { hand: this.el, buttonEvent: evt };
	      var dropTarget = this.findTarget(this.DRAGDROP_EVENT, ddEvt, true);
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
	  onHit: function onHit(evt) {
	    var _this4 = this;

	    var hitEl = evt.detail[this.data.colliderEventProperty];
	    var processHitEl = function processHitEl(hitEl) {
	      var hitElIndex = void 0;
	      hitElIndex = _this4.hoverEls.indexOf(hitEl);
	      if (hitElIndex === -1) {
	        _this4.hoverEls.push(hitEl);
	        // later loss of collision will remove from hoverEls
	        hitEl.addEventListener('stateremoved', _this4.unWatch);
	        _this4.dispatchMouseEvent(hitEl, 'mouseover', _this4.el);
	        if (_this4.dragging && _this4.gehDragged.size) {
	          // events on targets and on dragged
	          _this4.gehDragged.forEach(function (dragged) {
	            _this4.dispatchMouseEventAll('dragenter', dragged, true, true);
	          });
	        }
	        _this4.hover();
	      }
	    };
	    if (!hitEl) {
	      return;
	    }
	    if (Array.isArray(hitEl)) {
	      hitEl.forEach(processHitEl);
	    } else {
	      processHitEl(hitEl);
	    }
	  },
	  /* search collided entities for target to hover/dragover */
	  hover: function hover() {
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
	  unHover: function unHover(evt) {
	    var target = evt.detail[this.data.colliderEndEventProperty];
	    if (target) {
	      this._unHover(target);
	    } else if (evt.detail.state === this.data.colliderState) {
	      this._unHover(evt.target);
	    }
	  },
	  /* inner unHover steps needed regardless of cause of unHover */
	  _unHover: function _unHover(el, skipNextHover) {
	    var unHovered = false;
	    var evt = void 0;
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
	  unWatch: function unWatch(evt) {
	    var target = evt.detail[this.data.colliderEndEventProperty];
	    if (target) {
	      this._unWatch(target);
	    } else if (evt.detail.state === this.data.colliderState) {
	      this._unWatch(evt.target);
	    }
	  },
	  _unWatch: function _unWatch(target) {
	    var _this5 = this;

	    var hoverIndex = this.hoverEls.indexOf(target);
	    target.removeEventListener('stateremoved', this.unWatch);
	    if (hoverIndex !== -1) {
	      this.hoverEls.splice(hoverIndex, 1);
	    }
	    this.gehDragged.forEach(function (dragged) {
	      _this5.dispatchMouseEvent(target, 'dragleave', dragged);
	      _this5.dispatchMouseEvent(dragged, 'dragleave', target);
	    });
	    this.dispatchMouseEvent(target, 'mouseout', this.el);
	  },
	  registerListeners: function registerListeners() {
	    var _this6 = this;

	    this.el.addEventListener(this.data.colliderEvent, this.onHit);
	    this.el.addEventListener(this.data.colliderEndEvent, this.unWatch);
	    this.el.addEventListener(this.data.colliderEndEvent, this.unHover);

	    this.data.grabStartButtons.forEach(function (b) {
	      _this6.el.addEventListener(b, _this6.onGrabStartButton);
	    });
	    this.data.grabEndButtons.forEach(function (b) {
	      _this6.el.addEventListener(b, _this6.onGrabEndButton);
	    });
	    this.data.stretchStartButtons.forEach(function (b) {
	      _this6.el.addEventListener(b, _this6.onStretchStartButton);
	    });
	    this.data.stretchEndButtons.forEach(function (b) {
	      _this6.el.addEventListener(b, _this6.onStretchEndButton);
	    });
	    this.data.dragDropStartButtons.forEach(function (b) {
	      _this6.el.addEventListener(b, _this6.onDragDropStartButton);
	    });
	    this.data.dragDropEndButtons.forEach(function (b) {
	      _this6.el.addEventListener(b, _this6.onDragDropEndButton);
	    });
	  },
	  unRegisterListeners: function unRegisterListeners(data) {
	    var _this7 = this;

	    data = data || this.data;
	    if (Object.keys(data).length === 0) {
	      // Empty object passed on initalization
	      return;
	    }
	    this.el.removeEventListener(data.colliderEvent, this.onHit);
	    this.el.removeEventListener(data.colliderEndEvent, this.unHover);
	    this.el.removeEventListener(data.colliderEndEvent, this.unWatch);

	    data.grabStartButtons.forEach(function (b) {
	      _this7.el.removeEventListener(b, _this7.onGrabStartButton);
	    });
	    data.grabEndButtons.forEach(function (b) {
	      _this7.el.removeEventListener(b, _this7.onGrabEndButton);
	    });
	    data.stretchStartButtons.forEach(function (b) {
	      _this7.el.removeEventListener(b, _this7.onStretchStartButton);
	    });
	    data.stretchEndButtons.forEach(function (b) {
	      _this7.el.removeEventListener(b, _this7.onStretchEndButton);
	    });
	    data.dragDropStartButtons.forEach(function (b) {
	      _this7.el.removeEventListener(b, _this7.onDragDropStartButton);
	    });
	    data.dragDropEndButtons.forEach(function (b) {
	      _this7.el.removeEventListener(b, _this7.onDragDropEndButton);
	    });
	  },
	  emitCancelable: function emitCancelable(target, name, detail) {
	    var data, evt;
	    detail = detail || {};
	    data = { bubbles: true, cancelable: true, detail: detail };
	    data.detail.target = data.detail.target || target;
	    evt = new window.CustomEvent(name, data);
	    return target.dispatchEvent(evt);
	  },
	  dispatchMouseEvent: function dispatchMouseEvent(target, name, relatedTarget) {
	    var mEvt = new window.MouseEvent(name, { relatedTarget: relatedTarget });
	    target.dispatchEvent(mEvt);
	  },
	  dispatchMouseEventAll: function dispatchMouseEventAll(name, relatedTarget, filterUsed, alsoReverse) {
	    var _this8 = this;

	    var els = this.hoverEls;
	    if (filterUsed) {
	      els = els.filter(function (el) {
	        return el !== _this8.state.get(_this8.GRAB_EVENT) && el !== _this8.state.get(_this8.DRAG_EVENT) && el !== _this8.state.get(_this8.STRETCH_EVENT) && !_this8.gehDragged.has(el);
	      });
	    }
	    if (alsoReverse) {
	      for (var i = 0; i < els.length; i++) {
	        this.dispatchMouseEvent(els[i], name, relatedTarget);
	        this.dispatchMouseEvent(relatedTarget, name, els[i]);
	      }
	    } else {
	      for (var _i = 0; _i < els.length; _i++) {
	        this.dispatchMouseEvent(els[_i], name, relatedTarget);
	      }
	    }
	  },
	  findTarget: function findTarget(evType, detail, filterUsed) {
	    var _this9 = this;

	    var elIndex;
	    var eligibleEls = this.hoverEls;
	    if (filterUsed) {
	      eligibleEls = eligibleEls.filter(function (el) {
	        return el !== _this9.state.get(_this9.GRAB_EVENT) && el !== _this9.state.get(_this9.DRAG_EVENT) && el !== _this9.state.get(_this9.STRETCH_EVENT);
	      });
	    }
	    for (elIndex = eligibleEls.length - 1; elIndex >= 0; elIndex--) {
	      if (!this.emitCancelable(eligibleEls[elIndex], evType, detail)) {
	        return eligibleEls[elIndex];
	      }
	    }
	    return null;
	  },
	  promoteHoveredEl: function promoteHoveredEl(el) {
	    var hoverIndex = this.hoverEls.indexOf(el);
	    if (hoverIndex !== -1) {
	      this.hoverEls.splice(hoverIndex, 1);
	      this.hoverEls.push(el);
	    }
	  }
	});

/***/ },
/* 1 */
/***/ function(module, exports) {

	'use strict';

	/* global AFRAME */
	AFRAME.registerSystem('super-hands', {
	  init: function init() {
	    this.superHands = [];
	  },
	  registerMe: function registerMe(comp) {
	    // when second hand registers, store links
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

	/* global AFRAME */
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
	    if (evt.preventDefault) {
	      evt.preventDefault();
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
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	/* global AFRAME, THREE */
	var inherit = AFRAME.utils.extendDeep;
	var physicsCore = __webpack_require__(4);
	var buttonsCore = __webpack_require__(5);
	AFRAME.registerComponent('grabbable', inherit({}, physicsCore, buttonsCore, {
	  schema: {
	    maxGrabbers: { type: 'int', default: NaN },
	    invert: { default: false },
	    suppressY: { default: false }
	  },
	  init: function init() {
	    var _this = this;

	    this.GRABBED_STATE = 'grabbed';
	    this.GRAB_EVENT = 'grab-start';
	    this.UNGRAB_EVENT = 'grab-end';
	    this.grabbed = false;
	    this.grabbers = [];
	    this.constraints = new Map();
	    this.deltaPositionIsValid = false;
	    this.grabDistance = undefined;
	    this.grabDirection = { x: 0, y: 0, z: -1 };
	    this.grabOffset = { x: 0, y: 0, z: 0 };
	    // persistent object speeds up repeat setAttribute calls
	    this.destPosition = { x: 0, y: 0, z: 0 };
	    this.deltaPosition = new THREE.Vector3();
	    this.targetPosition = new THREE.Vector3();
	    this.physicsInit();

	    this.el.addEventListener(this.GRAB_EVENT, function (e) {
	      return _this.start(e);
	    });
	    this.el.addEventListener(this.UNGRAB_EVENT, function (e) {
	      return _this.end(e);
	    });
	    this.el.addEventListener('mouseout', function (e) {
	      return _this.lostGrabber(e);
	    });
	  },
	  update: function update() {
	    this.physicsUpdate();
	    this.xFactor = this.data.invert ? -1 : 1;
	    this.zFactor = this.data.invert ? -1 : 1;
	    this.yFactor = (this.data.invert ? -1 : 1) * !this.data.suppressY;
	  },
	  tick: function tick() {
	    var entityPosition;
	    if (this.grabber) {
	      // reflect on z-axis to point in same direction as the laser
	      this.targetPosition.copy(this.grabDirection);
	      this.targetPosition.applyQuaternion(this.grabber.object3D.getWorldQuaternion()).setLength(this.grabDistance).add(this.grabber.object3D.getWorldPosition()).add(this.grabOffset);
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
	  },
	  remove: function remove() {
	    this.el.removeEventListener(this.GRAB_EVENT, this.start);
	    this.el.removeEventListener(this.UNGRAB_EVENT, this.end);
	    this.physicsRemove();
	  },
	  start: function start(evt) {
	    if (!this.startButtonOk(evt)) {
	      return;
	    }
	    // room for more grabbers?
	    var grabAvailable = !Number.isFinite(this.data.maxGrabbers) || this.grabbers.length < this.data.maxGrabbers;

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
	  end: function end(evt) {
	    var handIndex = this.grabbers.indexOf(evt.detail.hand);
	    if (!this.endButtonOk(evt)) {
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
	  resetGrabber: function resetGrabber() {
	    var raycaster = void 0;
	    if (!this.grabber) {
	      return false;
	    }
	    raycaster = this.grabber.getAttribute('raycaster');
	    this.deltaPositionIsValid = false;
	    this.grabDistance = this.el.object3D.getWorldPosition().distanceTo(this.grabber.object3D.getWorldPosition());
	    if (raycaster) {
	      this.grabDirection = raycaster.direction;
	      this.grabOffset = raycaster.origin;
	    }
	    return true;
	  },
	  lostGrabber: function lostGrabber(evt) {
	    var i = this.grabbers.indexOf(evt.relatedTarget);
	    // if a queued, non-physics grabber leaves the collision zone, forget it
	    if (i !== -1 && evt.relatedTarget !== this.grabber && !this.physicsIsConstrained(evt.relatedTarget)) {
	      this.grabbers.splice(i, 1);
	    }
	  }
	}));

/***/ },
/* 4 */
/***/ function(module, exports) {

	'use strict';

	// base code used by grabbable for physics interactions
	module.exports = {
	  schema: {
	    usePhysics: { default: 'ifavailable' }
	  },
	  physicsInit: function physicsInit() {
	    this.constraints = new Map();
	  },
	  physicsUpdate: function physicsUpdate() {
	    if (this.data.usePhysics === 'never' && this.constraints.size) {
	      this.physicsClear();
	    }
	  },
	  physicsRemove: function physicsRemove() {
	    this.physicsClear();
	  },
	  physicsStart: function physicsStart(evt) {
	    // initiate physics constraint if available and not already existing
	    if (this.data.usePhysics !== 'never' && this.el.body && evt.detail.hand.body && !this.constraints.has(evt.detail.hand)) {
	      var newCon = new window.CANNON.LockConstraint(this.el.body, evt.detail.hand.body);
	      this.el.body.world.addConstraint(newCon);
	      this.constraints.set(evt.detail.hand, newCon);
	      return true;
	    }
	    return false;
	  },
	  physicsEnd: function physicsEnd(evt) {
	    var constraint = this.constraints.get(evt.detail.hand);
	    if (constraint) {
	      this.el.body.world.removeConstraint(constraint);
	      this.constraints.delete(evt.detail.hand);
	    }
	  },
	  physicsClear: function physicsClear() {
	    if (this.el.body) {
	      var _iteratorNormalCompletion = true;
	      var _didIteratorError = false;
	      var _iteratorError = undefined;

	      try {
	        for (var _iterator = this.constraints.values()[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
	          var c = _step.value;

	          this.el.body.world.removeConstraint(c);
	        }
	      } catch (err) {
	        _didIteratorError = true;
	        _iteratorError = err;
	      } finally {
	        try {
	          if (!_iteratorNormalCompletion && _iterator.return) {
	            _iterator.return();
	          }
	        } finally {
	          if (_didIteratorError) {
	            throw _iteratorError;
	          }
	        }
	      }
	    }
	    this.constraints.clear();
	  },
	  physicsIsConstrained: function physicsIsConstrained(el) {
	    return this.constraints.has(el);
	  },
	  physicsIsGrabbing: function physicsIsGrabbing() {
	    return this.constraints.size > 0;
	  }
	};

/***/ },
/* 5 */
/***/ function(module, exports) {

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
	    startButtonOk: function startButtonOk(evt) {
	      return buttonIsValid(evt, this.data['startButtons']);
	    },
	    endButtonOk: function endButtonOk(evt) {
	      return buttonIsValid(evt, this.data['endButtons']);
	    }
	  };
	}();

/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	/* global AFRAME, THREE */
	var inherit = AFRAME.utils.extendDeep;
	var buttonCore = __webpack_require__(5);
	AFRAME.registerComponent('stretchable', inherit({}, buttonCore, {
	  schema: {
	    usePhysics: { default: 'ifavailable' },
	    invert: { default: false }
	  },
	  init: function init() {
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
	  update: function update(oldDat) {},
	  tick: function tick() {
	    if (!this.stretched) {
	      return;
	    }
	    this.scale.copy(this.el.getAttribute('scale'));
	    this.handPos.copy(this.stretchers[0].getAttribute('position'));
	    this.otherHandPos.copy(this.stretchers[1].getAttribute('position'));
	    var currentStretch = this.handPos.distanceTo(this.otherHandPos);
	    var deltaStretch = 1;
	    if (this.previousStretch !== null && currentStretch !== 0) {
	      deltaStretch = Math.pow(currentStretch / this.previousStretch, this.data.invert ? -1 : 1);
	    }
	    this.previousStretch = currentStretch;
	    this.scale.multiplyScalar(deltaStretch);
	    this.el.setAttribute('scale', this.scale);
	    // force scale update for physics body
	    if (this.el.body && this.data.usePhysics !== 'never') {
	      var physicsShape = this.el.body.shapes[0];
	      if (physicsShape.halfExtents) {
	        physicsShape.halfExtents.scale(deltaStretch, physicsShape.halfExtents);
	        physicsShape.updateConvexPolyhedronRepresentation();
	      } else if (physicsShape.radius) {
	        physicsShape.radius *= deltaStretch;
	        physicsShape.updateBoundingSphereRadius();
	        // This doesn't update the cone size - can't find right update function
	        // } else if (physicsShape.radiusTop && physicsShape.radiusBottom &&
	        //     physicsShape.height) {
	        //   physicsShape.height *= deltaStretch;
	        //   physicsShape.radiusTop *= deltaStretch;
	        //   physicsShape.radiusBottom *= deltaStretch;
	        //   physicsShape.updateBoundingSphereRadius();
	      } else if (!this.shapeWarned) {
	        console.warn('Unable to stretch physics body: unsupported shape');
	        this.shapeWarned = true;
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
	    if (this.stretched || this.stretchers.includes(evt.detail.hand) || !this.startButtonOk(evt)) {
	      return;
	    } // already stretched or already captured this hand or wrong button
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
	    if (!this.endButtonOk(evt)) {
	      return;
	    }
	    if (stretcherIndex !== -1) {
	      this.stretchers.splice(stretcherIndex, 1);
	      this.stretched = false;
	      this.el.removeState(this.STRETCHED_STATE);
	    }
	    if (evt.preventDefault) {
	      evt.preventDefault();
	    }
	  }
	}));

/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	/* global AFRAME */
	var inherit = AFRAME.utils.extendDeep;
	var buttonCore = __webpack_require__(5);

	AFRAME.registerComponent('drag-droppable', inherit({}, buttonCore, {
	  init: function init() {
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
	  remove: function remove() {
	    this.el.removeEventListener(this.HOVER_EVENT, this.hoverStart);
	    this.el.removeEventListener(this.DRAG_EVENT, this.dragStart);
	    this.el.removeEventListener(this.UNHOVER_EVENT, this.hoverEnd);
	    this.el.removeEventListener(this.UNDRAG_EVENT, this.dragEnd);
	    this.el.removeEventListener(this.DRAGDROP_EVENT, this.dragDrop);
	  },
	  hoverStart: function hoverStart(evt) {
	    this.el.addState(this.HOVERED_STATE);
	    if (evt.preventDefault) {
	      evt.preventDefault();
	    }
	  },
	  dragStart: function dragStart(evt) {
	    if (!this.startButtonOk(evt)) {
	      return;
	    }
	    this.el.addState(this.DRAGGED_STATE);
	    if (evt.preventDefault) {
	      evt.preventDefault();
	    }
	  },
	  hoverEnd: function hoverEnd(evt) {
	    this.el.removeState(this.HOVERED_STATE);
	  },
	  dragEnd: function dragEnd(evt) {
	    if (!this.endButtonOk(evt)) {
	      return;
	    }
	    this.el.removeState(this.DRAGGED_STATE);
	    if (evt.preventDefault) {
	      evt.preventDefault();
	    }
	  },
	  dragDrop: function dragDrop(evt) {
	    if (!this.endButtonOk(evt)) {
	      return;
	    }
	    if (evt.preventDefault) {
	      evt.preventDefault();
	    }
	  }
	}));

/***/ },
/* 8 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	/* global AFRAME */
	var buttonCore = __webpack_require__(5);
	AFRAME.registerComponent('clickable', AFRAME.utils.extendDeep({}, buttonCore, {
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
	    if (!this.startButtonOk(evt)) {
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
	  end: function end(evt) {
	    var handIndex = this.clickers.indexOf(evt.detail.hand);
	    if (!this.endButtonOk(evt)) {
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

/***/ },
/* 9 */
/***/ function(module, exports) {

	'use strict';

	/* global AFRAME */
	AFRAME.registerComponent('locomotor-auto-config', {
	  schema: {
	    camera: { default: true },
	    stretch: { default: true },
	    move: { default: true }
	  },
	  dependencies: ['grabbable', 'stretchable'],
	  init: function init() {
	    this.ready = false;
	    if (this.data.camera) {
	      if (!document.querySelector('a-camera, [camera]')) {
	        var cam = document.createElement('a-camera');
	        this.el.appendChild(cam);
	      }
	    }
	    this.fakeCollisions();
	    // for controllers added later
	    this.fakeCollisionsB = this.fakeCollisions.bind(this);
	    this.el.addEventListener('controllerconnected', this.fakeCollisionsB);
	  },
	  update: function update() {
	    if (this.el.getAttribute('stretchable') && !this.data.stretch) {
	      // store settings for resetting
	      this.stretchSet = this.el.getAttribute('stretchable');
	      this.el.removeAttribute('stretchable');
	    } else if (!this.el.getAttribute('stretchable') && this.data.stretch) {
	      this.el.setAttribute('stretchable', this.stretchSet);
	    }
	    if (this.el.getAttribute('grabbable') && !this.data.move) {
	      // store settings for resetting
	      this.grabSet = this.el.getAttribute('grabbable');
	      this.el.removeAttribute('grabbable');
	    } else if (!this.el.getAttribute('grabbable') && this.data.move) {
	      this.el.setAttribute('grabbable', this.grabSet);
	    }
	  },
	  remove: function remove() {
	    this.el.removeState(this.colliderState);
	    this.el.removeEventListener('controllerconnected', this.fakeCollisionsB);
	  },
	  announceReady: function announceReady() {
	    if (!this.ready) {
	      this.ready = true;
	      this.el.emit('locomotor-ready', {});
	    }
	  },
	  fakeCollisions: function fakeCollisions() {
	    var _this = this;

	    this.el.getChildEntities().forEach(function (el) {
	      var sh = el.getAttribute('super-hands');
	      if (sh) {
	        // generate fake collision to be permanently in super-hands queue
	        var evtDetails = {};
	        evtDetails[sh.colliderEventProperty] = _this.el;
	        el.emit(sh.colliderEvent, evtDetails);
	        _this.colliderState = sh.colliderState;
	        _this.el.addState(_this.colliderState);
	      }
	      _this.announceReady();
	    });
	  }
	});

/***/ },
/* 10 */
/***/ function(module, exports) {

	'use strict';

	/* global AFRAME */
	AFRAME.registerComponent('progressive-controls', {
	  schema: {
	    maxLevel: { default: 'touch', oneOf: ['gaze', 'point', 'touch'] },
	    objects: { default: '' },
	    physicsBody: { default: 'shape: sphere; sphereRadius: 0.02' },
	    touchCollider: { default: 'sphere-collider' }
	  },
	  init: function init() {
	    var _this = this;

	    this.levels = ['gaze', 'point', 'touch'];
	    this.currentLevel = 0;
	    this.superHandsRaycasterConfig = {
	      colliderEvent: 'raycaster-intersection',
	      colliderEventProperty: 'els',
	      colliderEndEvent: 'raycaster-intersection-cleared',
	      colliderEndEventProperty: 'el',
	      colliderState: ''
	    };
	    this.camera = this.el.querySelector('a-camera,[camera]') || this.el.appendChild(document.createElement('a-camera'));
	    ['left', 'right'].forEach(function (hand) {
	      // find controller by left-controller/right-controller class or create one
	      _this[hand] = _this.el.querySelector('.' + hand + '-controller') || _this.el.appendChild(document.createElement('a-entity'));
	      // add class on newly created entities
	      _this[hand].classList && _this[hand].classList.add(hand + '-controller');
	      ['daydream-controls', 'gearvr-controls', 'oculus-touch-controls', 'vive-controls', 'windows-motion-controls'].forEach(function (ctrlr) {
	        return _this[hand].setAttribute(ctrlr, 'hand: ' + hand);
	      });
	      // save initial config
	      _this[hand + 'shOriginal'] = _this[hand].getAttribute('super-hands') || {};
	      if (typeof _this[hand + 'shOriginal'] === 'string') {
	        _this[hand + 'shOriginal'] = AFRAME.utils.styleParser.parse(_this[hand + 'shOriginal']);
	      }
	    });
	    this.el.addEventListener('controllerconnected', function (e) {
	      return _this.detectLevel(e);
	    });
	    this.eventRepeaterB = this.eventRepeater.bind(this);
	    // pass mouse and touch events into the scene
	    this.addEventListeners();
	  },
	  update: function update(oldData) {
	    var level = this.currentLevel;
	    // force setLevel refresh with new params
	    this.currentLevel = -1;
	    this.setLevel(level);
	  },
	  remove: function remove() {
	    if (!this.eventsRegistered) {
	      return;
	    }
	    var canv = this.el.sceneEl.canvas;
	    canv.removeEventListener('mousedown', this.eventRepeaterB);
	    canv.removeEventListener('mouseup', this.eventRepeaterB);
	    canv.removeEventListener('touchstart', this.eventRepeaterB);
	    canv.removeEventListener('touchend', this.eventRepeaterB);
	  },
	  setLevel: function setLevel(newLevel) {
	    var _this2 = this;

	    var maxLevel = this.levels.indexOf(this.data.maxLevel);
	    var physicsAvail = !!this.el.sceneEl.getAttribute('physics');
	    var hands = [this.right, this.left];
	    newLevel = newLevel > maxLevel ? maxLevel : newLevel;
	    if (newLevel === this.currentLevel) {
	      return;
	    }
	    if (newLevel !== 0 && this.caster) {
	      this.camera.removeChild(this.caster);
	      this.caster = null;
	      this.camera.removeAttribute('super-hands');
	    }
	    switch (newLevel) {
	      case 0:
	        this.caster = this.camera.querySelector('[raycaster]');
	        if (!this.caster) {
	          this.caster = document.createElement('a-entity');
	          this.camera.appendChild(this.caster);
	          this.caster.setAttribute('geometry', 'primitive: ring;' + 'radiusOuter: 0.008; radiusInner: 0.005; segmentsTheta: 32');
	          this.caster.setAttribute('material', 'color: #000; shader: flat;');
	          this.caster.setAttribute('position', '0 0 -0.5');
	        }
	        this.caster.setAttribute('raycaster', 'objects: ' + this.data.objects);
	        this.camera.setAttribute('super-hands', this.superHandsRaycasterConfig);
	        if (physicsAvail) {
	          this.camera.setAttribute('static-body', this.data.physicsBody);
	        }
	        break;
	      case 1:
	        var ctrlrCfg = this.controllerConfig[this.controllerName] || {};
	        var rayConfig = AFRAME.utils.extend({ objects: this.data.objects, showLine: true }, ctrlrCfg.raycaster || {});
	        hands.forEach(function (h) {
	          h.setAttribute('super-hands', _this2.superHandsRaycasterConfig);
	          h.setAttribute('raycaster', rayConfig);
	          if (physicsAvail) {
	            h.setAttribute('static-body', _this2.data.physicsBody);
	          }
	        });
	        break;
	      case 2:
	        ['right', 'left'].forEach(function (h) {
	          // clobber flag to restore defaults
	          _this2[h].setAttribute('super-hands', _this2[h + 'shOriginal'], true);
	          _this2[h].setAttribute(_this2.data.touchCollider, 'objects: ' + _this2.data.objects);
	          if (physicsAvail) {
	            _this2[h].setAttribute('static-body', _this2.data.physicsBody);
	          }
	        });
	        break;
	    }
	    this.currentLevel = newLevel;
	    this.el.emit('controller-progressed', {
	      level: this.levels[this.currentLevel]
	    });
	  },
	  detectLevel: function detectLevel(evt) {
	    var DOF6 = ['vive-controls', 'oculus-touch-controls', 'windows-motion-controls'];
	    var DOF3 = ['gearvr-controls', 'daydream-controls'];
	    this.controllerName = evt.detail.name;
	    if (DOF6.indexOf(evt.detail.name) !== -1) {
	      this.setLevel(this.levels.indexOf('touch'));
	    } else if (DOF3.indexOf(evt.detail.name) !== -1) {
	      this.setLevel(this.levels.indexOf('point'));
	    } else {
	      this.setLevel(this.levels.indexOf('gaze'));
	    }
	  },
	  eventRepeater: function eventRepeater(evt) {
	    if (evt.type.startsWith('touch')) {
	      evt.preventDefault();
	      // avoid repeating touchmove because it interferes with look-controls
	      if (evt.type === 'touchmove') {
	        return;
	      }
	    }
	    this.camera.emit(evt.type, evt.detail);
	  },
	  addEventListeners: function addEventListeners() {
	    if (!this.el.sceneEl.canvas) {
	      this.el.sceneEl.addEventListener('loaded', this.addEventListeners.bind(this));
	      return;
	    }
	    this.el.sceneEl.canvas.addEventListener('mousedown', this.eventRepeaterB);
	    this.el.sceneEl.canvas.addEventListener('mouseup', this.eventRepeaterB);
	    this.el.sceneEl.canvas.addEventListener('touchstart', this.eventRepeaterB);
	    this.el.sceneEl.canvas.addEventListener('touchmove', this.eventRepeaterB);
	    this.el.sceneEl.canvas.addEventListener('touchend', this.eventRepeaterB);
	    this.eventsRegistered = true;
	  },
	  controllerConfig: {
	    'gearvr-controls': {
	      raycaster: { origin: { x: 0, y: 0.0005, z: 0 } }
	    },
	    'oculus-touch-controls': {
	      raycaster: { origin: { x: 0.001, y: 0, z: 0.065 }, direction: { x: 0, y: -0.8, z: -1 } }
	    }
	  }
	});

/***/ },
/* 11 */
/***/ function(module, exports) {

	'use strict';

	/* global AFRAME */
	var extendDeep = AFRAME.utils.extendDeep;
	// The mesh mixin provides common material properties for creating mesh-based primitives.
	// This makes the material component a default component and maps all the base material properties.
	var meshMixin = AFRAME.primitives.getMeshMixin();
	AFRAME.registerPrimitive('a-locomotor', extendDeep({}, meshMixin, {
	  // Preset default components. These components and component properties will be attached to the entity out-of-the-box.
	  defaultComponents: {
	    grabbable: {
	      usePhysics: 'never',
	      invert: true,
	      suppressY: true
	    },
	    stretchable: {
	      invert: true
	    },
	    'locomotor-auto-config': {}
	  },
	  mappings: {
	    'fetch-camera': 'locomotor-auto-config.camera',
	    'allow-movement': 'locomotor-auto-config.move',
	    'horizontal-only': 'grabbable.suppressY',
	    'allow-scaling': 'locomotor-auto-config.stretch'
	  }
	}));

/***/ }
/******/ ]);