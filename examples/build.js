(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

require('../index.js');
require('aframe-motion-capture-components');
/* used in examples to allow a desktop playback without HMD
   defined here to keep example files clear of clutter */
window.playDemoRecording = function (spectate) {
  var l = document.querySelector('a-link, a-entity[link]');
  var s = document.querySelector('a-scene');
  l.setAttribute('visible', 'false');
  s.addEventListener('replayingstopped', function (e) {
    var c = document.querySelector('[camera]');
    window.setTimeout(function () {
      console.log('reset camera');
      c.setAttribute('position', '0 1.6 2');
      c.setAttribute('rotation', '0 0 0');
    });
  });
  s.setAttribute('avatar-replayer', {
    src: './demo-recording.json',
    spectatorMode: spectate === undefined ? true : spectate,
    spectatorPosition: { x: 0, y: 1.6, z: 2 }
  });
};

},{"../index.js":2,"aframe-motion-capture-components":9}],2:[function(require,module,exports){
'use strict';

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
require('./primitives/a-locomotor.js');

/**
 * Super Hands component for A-Frame.
 */
AFRAME.registerComponent('super-hands', {
  schema: {
    colliderState: { default: 'collided' },
    colliderEvent: { default: 'hit' },
    colliderEventProperty: { default: 'el' },
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
    var _this = this;

    var clickables = this.hoverEls.filter(function (h) {
      return _this.gehClicking.has(h);
    });
    var grabbed = this.state.get(this.GRAB_EVENT);
    var endEvt = { hand: this.el, buttonEvent: evt };
    this.dispatchMouseEventAll('mouseup', this.el, true);
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
    var _this2 = this;

    var carried = this.state.get(this.DRAG_EVENT);
    this.dragging = false; // keep _unHover() from activating another droptarget
    this.gehDragged.forEach(function (carried) {
      _this2.dispatchMouseEvent(carried, 'dragend', _this2.el);
      // fire event both ways for all intersected targets
      _this2.dispatchMouseEventAll('drop', carried, true, true);
      _this2.dispatchMouseEventAll('dragleave', carried, true, true);
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
    var _this3 = this;

    var hitEl = evt.detail[this.data.colliderEventProperty];
    var hitElIndex;
    if (!hitEl) {
      return;
    }
    hitElIndex = this.hoverEls.indexOf(hitEl);
    if (hitElIndex === -1) {
      this.hoverEls.push(hitEl);
      // later loss of collision will remove from hoverEls
      hitEl.addEventListener('stateremoved', this.unWatch);
      this.dispatchMouseEvent(hitEl, 'mouseover', this.el);
      if (this.dragging && this.gehDragged.size) {
        // events on targets and on dragged
        this.gehDragged.forEach(function (dragged) {
          _this3.dispatchMouseEventAll('dragenter', dragged, true, true);
        });
      }
      this.hover();
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
    if (evt.detail.state === this.data.colliderState) {
      this._unHover(evt.target);
    }
  },
  /* inner unHover steps needed regardless of cause of unHover */
  _unHover: function _unHover(el, skipNextHover) {
    var evt;
    el.removeEventListener('stateremoved', this.unHover);
    if (el === this.state.get(this.DRAGOVER_EVENT)) {
      this.state.delete(this.DRAGOVER_EVENT);
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
      this.emitCancelable(el, this.UNHOVER_EVENT, { hand: this.el });
    }
    // activate next target, if present
    if (!skipNextHover) {
      this.hover();
    }
  },
  unWatch: function unWatch(evt) {
    if (evt.detail.state === this.data.colliderState) {
      this._unWatch(evt.target);
    }
  },
  _unWatch: function _unWatch(target) {
    var _this4 = this;

    var hoverIndex = this.hoverEls.indexOf(target);
    target.removeEventListener('stateremoved', this.unWatch);
    if (hoverIndex !== -1) {
      this.hoverEls.splice(hoverIndex, 1);
    }
    this.gehDragged.forEach(function (dragged) {
      _this4.dispatchMouseEvent(target, 'dragleave', dragged);
      _this4.dispatchMouseEvent(dragged, 'dragleave', target);
    });
    this.dispatchMouseEvent(target, 'mouseout', this.el);
  },
  registerListeners: function registerListeners() {
    var _this5 = this;

    this.el.addEventListener(this.data.colliderEvent, this.onHit);

    this.data.grabStartButtons.forEach(function (b) {
      _this5.el.addEventListener(b, _this5.onGrabStartButton);
    });
    this.data.grabEndButtons.forEach(function (b) {
      _this5.el.addEventListener(b, _this5.onGrabEndButton);
    });
    this.data.stretchStartButtons.forEach(function (b) {
      _this5.el.addEventListener(b, _this5.onStretchStartButton);
    });
    this.data.stretchEndButtons.forEach(function (b) {
      _this5.el.addEventListener(b, _this5.onStretchEndButton);
    });
    this.data.dragDropStartButtons.forEach(function (b) {
      _this5.el.addEventListener(b, _this5.onDragDropStartButton);
    });
    this.data.dragDropEndButtons.forEach(function (b) {
      _this5.el.addEventListener(b, _this5.onDragDropEndButton);
    });
  },
  unRegisterListeners: function unRegisterListeners(data) {
    var _this6 = this;

    data = data || this.data;
    if (Object.keys(data).length === 0) {
      // Empty object passed on initalization
      return;
    }
    this.el.removeEventListener(data.colliderEvent, this.onHit);

    data.grabStartButtons.forEach(function (b) {
      _this6.el.removeEventListener(b, _this6.onGrabStartButton);
    });
    data.grabEndButtons.forEach(function (b) {
      _this6.el.removeEventListener(b, _this6.onGrabEndButton);
    });
    data.stretchStartButtons.forEach(function (b) {
      _this6.el.removeEventListener(b, _this6.onStretchStartButton);
    });
    data.stretchEndButtons.forEach(function (b) {
      _this6.el.removeEventListener(b, _this6.onStretchEndButton);
    });
    data.dragDropStartButtons.forEach(function (b) {
      _this6.el.removeEventListener(b, _this6.onDragDropStartButton);
    });
    data.dragDropEndButtons.forEach(function (b) {
      _this6.el.removeEventListener(b, _this6.onDragDropEndButton);
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
    var _this7 = this;

    var els = this.hoverEls;
    if (filterUsed) {
      els = els.filter(function (el) {
        return el !== _this7.state.get(_this7.GRAB_EVENT) && el !== _this7.state.get(_this7.DRAG_EVENT) && el !== _this7.state.get(_this7.STRETCH_EVENT) && !_this7.gehDragged.has(el);
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
    var _this8 = this;

    var elIndex;
    var eligibleEls = this.hoverEls;
    if (filterUsed) {
      eligibleEls = eligibleEls.filter(function (el) {
        return el !== _this8.state.get(_this8.GRAB_EVENT) && el !== _this8.state.get(_this8.DRAG_EVENT) && el !== _this8.state.get(_this8.STRETCH_EVENT);
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

},{"./misc_components/locomotor-auto-config.js":3,"./primitives/a-locomotor.js":11,"./reaction_components/clickable.js":12,"./reaction_components/drag-droppable.js":13,"./reaction_components/grabbable.js":14,"./reaction_components/hoverable.js":15,"./reaction_components/stretchable.js":18,"./systems/super-hands-system.js":19}],3:[function(require,module,exports){
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
    var _this = this;

    var ready = true;
    // generate fake collision to be permanently in super-hands queue
    this.el.childNodes.forEach(function (el) {
      var sh = el.getAttribute && el.getAttribute('super-hands');
      if (sh) {
        var evtDetails = {};
        evtDetails[sh.colliderEventProperty] = _this.el;
        el.emit(sh.colliderEvent, evtDetails);
        _this.colliderState = sh.colliderState;
        _this.el.addState(_this.colliderState);
      }
    });
    if (this.data.camera) {
      // this step has to be done asnychronously
      ready = false;
      this.el.addEventListener('loaded', function (e) {
        if (!document.querySelector('a-camera, [camera]')) {
          var cam = document.createElement('a-camera');
          _this.el.appendChild(cam);
        }
        _this.ready();
      });
    }
    if (ready) {
      this.ready();
    }
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
  },
  ready: function ready() {
    this.el.emit('locomotor-ready', {});
  }
});

},{}],4:[function(require,module,exports){
/* global THREE, AFRAME  */
var log = AFRAME.utils.debug('aframe-motion-capture:avatar-recorder:info');
var warn = AFRAME.utils.debug('aframe-motion-capture:avatar-recorder:warn');

var LOCALSTORAGE_KEY = 'avatar-recording';

/**
 * @member {object} recordingData - Where all the recording data is stored in memory.
 */
AFRAME.registerComponent('avatar-recorder', {
  schema: {
    autoRecord: {default: false},
    autoPlay: {default: true},
    spectatorPlay: {default: false},
    spectatorPosition: {default: '0 1.6 0', type: 'vec3'},
    localStorage: {default: true},
    saveFile: {default: true},
    loop: {default: true}
  },

  init: function () {
    this.trackedControllerEls = {};
    this.onKeyDown = this.onKeyDown.bind(this);
    this.tick = AFRAME.utils.throttle(this.throttledTick, 100, this);
  },

  replayRecording: function () {
    var data = this.data;
    var el = this.el;

    var recordingData = JSON.parse(localStorage.getItem(LOCALSTORAGE_KEY)) || this.recordingData;
    if (!recordingData) { return; }
    log('Replaying recording.');
    el.setAttribute('avatar-replayer', {
      loop: data.loop,
      spectatorMode: data.spectatorPlay,
      spectatorPosition: data.spectatorPosition
    });
    el.components['avatar-replayer'].startReplaying(recordingData);
  },

  stopReplaying: function () {
    var avatarPlayer = this.el.components['avatar-replayer'];
    if (!avatarPlayer) { return; }
    log('Stopped replaying.');
    avatarPlayer.stopReplaying();
    this.el.setAttribute('avatar-replayer', 'spectatorMode', false);
  },

  /**
   * Poll for tracked controllers.
   */
  throttledTick: function () {
    var self = this;
    var trackedControllerEls = this.el.querySelectorAll('[tracked-controls]');
    this.trackedControllerEls = {};
    trackedControllerEls.forEach(function (trackedControllerEl) {
      if (!trackedControllerEl.id) {
        warn('Found tracked controllers with no id. It will not be recorded');
        return;
      }
      trackedControllerEl.setAttribute('motion-capture-recorder', {
        autoRecord: false,
        visibleStroke: false
      });
      self.trackedControllerEls[trackedControllerEl.id] = trackedControllerEl;
      if (self.isRecording) {
        trackedControllerEl.components['motion-capture-recorder'].startRecording();
      }
    });
  },

  play: function () {
    var self = this;

    if (this.data.autoPlay) {
      // Add timeout to let the scene load a bit before replaying.
      setTimeout(function () {
        self.replayRecording();
      }, 500);
    }
    window.addEventListener('keydown', this.onKeyDown);
  },

  pause: function () {
    window.removeEventListener('keydown', this.onKeyDown);
  },

  /**
   * Keyboard shortcuts.
   */
  onKeyDown: function (evt) {
    var key = evt.keyCode;
    var KEYS = {space: 32, c: 67, p: 80, u: 85};

    switch (key) {
      // <space>: Toggle recording.
      case KEYS.space: {
        this.toggleRecording();
        break;
      }

      // p: Toggle recording.
      case KEYS.p: {
        this.toggleReplaying();
        break;
      }

      // c: Clear localStorage.
      case KEYS.c: {
        log('Recording cleared from localStorage.');
        this.recordingData = null;
        localStorage.removeItem(LOCALSTORAGE_KEY);
        break;
      }

      // u: Upload recording.
      case KEYS.u: {
        this.uploadRecording();
        break;
      }
    }
  },

  toggleReplaying: function () {
    var avatarPlayer = this.el.components['avatar-replayer'];
    if (!avatarPlayer) {
      this.el.setAttribute('avatar-replayer', '');
      avatarPlayer = this.el.components['avatar-replayer'];
    }

    if (avatarPlayer.isReplaying) {
      this.stopReplaying();
    } else {
      this.replayRecording();
    }
  },

  toggleRecording: function () {
    if (this.isRecording) {
      this.stopRecording();
    } else {
      this.startRecording();
    }
  },

  setupCamera: function () {
    var el = this.el;
    var self = this;
    var setup;
    // Grab camera.
    if (el.camera && el.camera.el) {
      prepareCamera(el.camera.el);
      return;
    }
    el.addEventListener('camera-set-active', setup)
    setup = function (evt) { prepareCamera(evt.detail.cameraEl); };

    function prepareCamera (cameraEl) {
      if (self.cameraEl) { self.cameraEl.removeAttribute('motion-capture-recorder'); }
      self.cameraEl = cameraEl;
      self.cameraEl.setAttribute('motion-capture-recorder', {
        autoRecord: false,
        visibleStroke: false
      });
      el.removeEventListener('camera-set-active', setup);
    }
  },

  startRecording: function () {
    var trackedControllerEls = this.trackedControllerEls;
    var keys;
    if (this.isRecording) { return; }
    keys = Object.keys(trackedControllerEls);
    log('Starting recording!');
    this.stopReplaying();
    this.setupCamera();
    this.isRecording = true;
    this.cameraEl.components['motion-capture-recorder'].startRecording();
    keys.forEach(function (id) {
      trackedControllerEls[id].components['motion-capture-recorder'].startRecording();
    });
  },

  stopRecording: function () {
    var trackedControllerEls = this.trackedControllerEls;
    var keys = Object.keys(trackedControllerEls);
    if (!this.isRecording) { return; }
    log('Stopped recording.');
    this.isRecording = false;
    this.cameraEl.components['motion-capture-recorder'].stopRecording();
    keys.forEach(function (id) {
      trackedControllerEls[id].components['motion-capture-recorder'].stopRecording();
    });
    this.saveRecording();
    if (this.data.autoPlay) { this.replayRecording(); }
  },

  getJSONData: function () {
    var data = {};
    var trackedControllerEls = this.trackedControllerEls;
    var keys = Object.keys(trackedControllerEls);
    if (this.isRecording) { return; }
    this.isRecording = false;
    data.camera = this.cameraEl.components['motion-capture-recorder'].getJSONData();
    keys.forEach(function (id) {
      data[id] = trackedControllerEls[id].components['motion-capture-recorder'].getJSONData();
    });
    this.recordingData = data;
    return data;
  },

  saveRecording: function () {
    var data = this.getJSONData()
    if (this.data.localStorage) {
      log('Recording saved to localStorage.');
      this.saveToLocalStorage(data);
    }
    if (this.data.saveFile) {
      log('Recording saved to file.');
      this.saveRecordingFile(data);
    }
  },

  saveToLocalStorage: function (data) {
    localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(data));
  },

  saveRecordingFile: function (data) {
    var jsonData = JSON.stringify(data);
    var type = this.data.binaryFormat ? 'application/octet-binary' : 'application/json';
    var blob = new Blob([jsonData], {type: type});
    var url = URL.createObjectURL(blob);
    var fileName = 'recording-' + document.title.toLowerCase().replace(/ /g, '-') + '.json';
    var aEl = document.createElement('a');
    aEl.href = url;
    aEl.setAttribute('download', fileName);
    aEl.innerHTML = 'downloading...';
    aEl.style.display = 'none';
    document.body.appendChild(aEl);
    setTimeout(function () {
      aEl.click();
      document.body.removeChild(aEl);
    }, 1);
  },

  /**
   * Upload recording to file.io.
   */
  uploadRecording: function () {
    var request;

    if (!this.recordingData) {
      log('Cannot upload without a recording in memory.');
      return;
    }

    log('Uploading recording to myjson.com.');
    request = new XMLHttpRequest();
    request.open('POST', window.location.protocol + '//api.myjson.com/bins', true);
    request.setRequestHeader('Content-type', 'application/json; charset=utf-8');
    request.onload = function () {
      var aEl;
      var url = JSON.parse(this.responseText).uri;
      log('Recording uploaded to', url);
      aEl = document.createElement('a');
      aEl.innerHTML = url;
      aEl.setAttribute('href', url);
      aEl.style.position = 'fixed';
      aEl.style.display = 'block';
      aEl.style.zIndex = 99999;
      aEl.style.background = '#111';
      aEl.style.color = '#FAFAFA';
      aEl.style.padding = '15px';
      aEl.style.left = 0;
      aEl.style.top = 0;
      document.body.appendChild(aEl);
    }
    request.send(JSON.stringify(this.recordingData));
  }
});

},{}],5:[function(require,module,exports){
/* global THREE, AFRAME  */
var error = AFRAME.utils.debug('aframe-motion-capture:avatar-replayer:error');
var log = AFRAME.utils.debug('aframe-motion-capture:avatar-replayer:info');
var warn = AFRAME.utils.debug('aframe-motion-capture:avatar-replayer:warn');

AFRAME.registerComponent('avatar-replayer', {
  schema: {
    src: {default: ''},
    loop: {default: false},
    spectatorMode: {default: false},
    spectatorPosition: {default: '0 1.6 2', type: 'vec3'}
  },

  init: function () {
    var sceneEl = this.el;
    this.setupCameras = this.setupCameras.bind(this);
    // Prepare camera.
    if (sceneEl.camera) {
      this.setupCameras();
    } else {
      this.el.addEventListener('camera-set-active', this.setupCameras);
    }
    this.el.addEventListener('replayingstopped', this.restoreCamera.bind(this));
    this.onKeyDown = this.onKeyDown.bind(this);
  },

  remove: function () {
    this.stopReplaying();
  },

  restoreCamera: function() {
    this.currentCameraEl.setAttribute('camera', 'active', true);
  },

  setupCameras: function () {
    this.currentCameraEl = this.el.camera.el;
    this.currentCameraEl.removeAttribute('data-aframe-default-camera');
    this.el.removeEventListener('camera-set-active', this.setupCameras);
    this.initSpectatorCamera();
  },

  play: function () {
    window.addEventListener('keydown', this.onKeyDown);
  },

  pause: function () {
    window.removeEventListener('keydown', this.onKeyDown);
  },

  /**
   * tab = toggle spectator camera
   */
  onKeyDown: function (evt) {
    var key = evt.keyCode;
    if (key !== 9) { return; }
    switch (key) {
      case 9: {
        this.toggleSpectatorCamera();
        break;
      }
    }
  },

  toggleSpectatorCamera: function () {
    this.el.setAttribute('avatar-replayer', 'spectatorMode', !this.data.spectatorMode);
  },

  update: function (oldData) {
    var data = this.data;
    if (oldData.src === data.src) { return; }
    this.replayRecordingFromSource(oldData);
  },

  initSpectatorCamera: function () {
    var spectatorCameraEl = this.spectatorCameraEl =
      this.el.querySelector('#spectatorCamera') || document.createElement('a-entity');
    var spectatorCameraRigEl = this.spectatorCameraRigEl =
      this.el.querySelector('#spectatorCameraRig') || document.createElement('a-entity');
    if (this.el.querySelector('#spectatorCameraRig')
        || !this.data.spectatorMode) { return; }
    spectatorCameraEl.id = 'spectatorCamera';
    spectatorCameraRigEl.id = 'spectatorCameraRig';
    spectatorCameraEl.setAttribute('camera', '');
    spectatorCameraEl.setAttribute('look-controls', '');
    spectatorCameraEl.setAttribute('wasd-controls', '');
    spectatorCameraRigEl.appendChild(spectatorCameraEl);
    this.el.appendChild(this.spectatorCameraRigEl);
  },

  /**
   * Check for recording sources and play.
   */
  replayRecordingFromSource: function (oldSrc) {
    var data = this.data;
    var localStorageData;
    var queryParamSrc;
    var src;

    // Allow override to display replayer from query param.
    if (new URLSearchParams(window.location.search).get('avatar-replayer-disabled') !== null) {
      return;
    }

    // From localStorage.
    localStorageData = JSON.parse(localStorage.getItem('avatar-recording'));
    if (localStorageData) {
      log('Replaying from localStorage.');
      this.startReplaying(localStorageData);
      return;
    }

    // From file.
    queryParamSrc = this.getSrcFromSearchParam();
    src = data.src || queryParamSrc;
    if (!src || oldSrc === data.src) { return; }

    if (data.src) {
      log('Replaying from component `src`', src);
    } else if (queryParamSrc) {
      log('Replaying from query parameter `avatar-recording`', src);
    }

    this.loadRecordingFromUrl(src, false, this.startReplaying.bind(this));
  },

  /**
   * Defined for test stubbing.
   */
  getSrcFromSearchParam: function () {
    return new URLSearchParams(window.location.search).get('avatar-recording');
  },

  /**
   * Set player on camera and controllers (marked by ID).
   *
   * @params {object} data - {
   *   camera: {poses: [], events: []},
   *   [c1ID]: {poses: [], events: []},
   *   [c2ID]: {poses: [], events: []}
   * }
   */
  startReplaying: function (replayData) {
    var data = this.data;
    var self = this;
    var puppetEl = this.puppetEl;
    var sceneEl = this.el;

    if (this.isReplaying) { return; }

    // Wait for camera.
    if (!this.el.camera) {
      this.el.addEventListener('camera-set-active', function () {
        self.startReplaying(replayData);
      });
      return;
    }

    this.replayData = replayData;
    this.isReplaying = true;

    if (puppetEl) { puppetEl.removeAttribute('motion-capture-replayer'); }
    Object.keys(replayData).forEach(function setPlayer (key) {
      var puppetEl;

      if (key === 'camera') {
        // Grab camera.
        log('Setting motion-capture-replayer on camera.');
        puppetEl = self.puppetEl = self.data.spectatorMode ? self.currentCameraEl : sceneEl.camera.el;
      } else {
        // Grab other entities.
        log('Setting motion-capture-replayer on ' + key + '.');
        puppetEl = sceneEl.querySelector('#' + key);
        if (!puppetEl) {
          error('No element found with ID ' + key + '.');
          return;
        }
      }

      log('Setting motion-capture-replayer on ' + key + '.');
      puppetEl.setAttribute('motion-capture-replayer', {loop: data.loop});
      puppetEl.components['motion-capture-replayer'].startReplaying(replayData[key]);
    });
    this.configureCamera();
  },

  configureCamera: function () {
    var data = this.data;
    var currentCameraEl = this.currentCameraEl;
    var spectatorCameraEl = this.spectatorCameraEl;
    if (!spectatorCameraEl.hasLoaded) {
      spectatorCameraEl.addEventListener('loaded', this.configureCamera.bind(this));
      return;
    }
    if (data.spectatorMode) {
      this.spectatorCameraRigEl.setAttribute('position', data.spectatorPosition);
      spectatorCameraEl.setAttribute('camera', 'active', true);
    } else {
      currentCameraEl.setAttribute('camera', 'active', true);
    }
    this.configureHeadGeometry();
  },

  configureHeadGeometry: function() {
    var currentCameraEl = this.currentCameraEl;
    if (currentCameraEl.getObject3D('mesh')) { return; }
    if (!this.data.spectatorMode) { return; }
    currentCameraEl.setAttribute('geometry', {primitive: 'box', height: 0.3, width: 0.3, depth: 0.2});
    currentCameraEl.setAttribute('material', {color: 'pink'});
  },

  stopReplaying: function () {
    var keys;
    var self = this;
    if (!this.isReplaying || !this.replayData) { return; }
    this.isReplaying = false;
    keys = Object.keys(this.replayData);
    keys.forEach(function (key) {
      if (key === 'camera') {
        self.puppetEl.removeComponent('motion-capture-replayer');
      } else {
        el = document.querySelector('#' + key);
        if (!el) { warn('No element with id ' + key); }
        el.removeComponent('motion-capture-replayer');
      }
    });
  },

  loadRecordingFromUrl: function (url, binary, callback) {
    var loader = new THREE.FileLoader(this.manager);
    var self = this;
    var data;
    loader.crossOrigin = 'anonymous';
    if (binary === true) { loader.setResponseType('arraybuffer'); }
    loader.load(url, function (buffer) {
      if (binary === true) {
        data = self.loadStrokeBinary(buffer);
      } else {
        data = JSON.parse(buffer);
      }
      if (callback) { callback(data); }
    });
  }
});

},{}],6:[function(require,module,exports){
/* global AFRAME, THREE */

var EVENTS = {
  axismove: {id: 0, props: ['id', 'axis']},
  buttonchanged: {id: 1, props: ['id', 'state']},
  buttondown: {id: 2, props: ['id', 'state']},
  buttonup: {id: 3, props: ['id', 'state']},
  touchstart: {id: 4, props: ['id', 'state']},
  touchend: {id: 5, props: ['id', 'state']}
};

var EVENTS_DECODE = {
  0: 'axismove',
  1: 'buttonchanged',
  2: 'buttondown',
  3: 'buttonup',
  4: 'touchstart',
  5: 'touchend'
};

AFRAME.registerComponent('motion-capture-recorder', {
  schema: {
    autoRecord: {default: false},
    enabled: {default: true},
    hand: {default: 'right'},
    recordingControls: {default: false},
    persistStroke: {default: false},
    visibleStroke: {default: true}
  },

  init: function () {
    this.drawing = false;
    this.recordedEvents = [];
    this.recordedPoses = [];
    this.addEventListeners();
  },

  addEventListeners: function () {
    var el = this.el;
    this.recordEvent = this.recordEvent.bind(this);
    el.addEventListener('axismove', this.recordEvent);
    el.addEventListener('buttonchanged', this.onTriggerChanged.bind(this));
    el.addEventListener('buttonchanged', this.recordEvent);
    el.addEventListener('buttonup', this.recordEvent);
    el.addEventListener('buttondown', this.recordEvent);
    el.addEventListener('touchstart', this.recordEvent);
    el.addEventListener('touchend', this.recordEvent);
  },

  recordEvent: function (evt) {
    var detail;
    if (!this.isRecording) { return; }

    // Filter out `target`, not serializable.
    if ('detail' in evt && 'state' in evt.detail && 'target' in evt.detail.state) {
      delete evt.detail.state.target;
    }

    detail = {};
    EVENTS[evt.type].props.forEach(function buildDetail (propName) {
      // Convert GamepadButton to normal JS object.
      if (propName === 'state') {
        var stateProp;
        detail.state = {};
        for (stateProp in evt.detail.state) {
          detail.state[stateProp] = evt.detail.state[stateProp];
        }
        return;
      }
      detail[propName] = evt.detail[propName];
    });

    this.recordedEvents.push({
      name: evt.type,
      detail: detail,
      timestamp: this.lastTimestamp
    });
  },

  onTriggerChanged: function (evt) {
    var data = this.data;
    var value;
    if (!data.enabled || data.autoRecord) { return; }
    // Not Trigger
    if (evt.detail.id !== 1 || !this.data.recordingControls) { return; }
    value = evt.detail.state.value;
    if (value <= 0.1) {
      if (this.isRecording) { this.stopRecording(); }
      return;
    }
    if (!this.isRecording) { this.startRecording(); }
  },

  getJSONData: function () {
    var data;
    var trackedControlsComponent = this.el.components['tracked-controls'];
    var controller = trackedControlsComponent && trackedControlsComponent.controller;
    if (!this.recordedPoses) { return; }
    data = {
      poses: this.getStrokeJSON(this.recordedPoses),
      events: this.recordedEvents
    };
    if (controller) {
      data.gamepad = {
        id: controller.id,
        hand: controller.hand,
        index: controller.index
      };
    }
    return data;
  },

  getStrokeJSON: function (stroke) {
    var point;
    var points = [];
    for (var i = 0; i < stroke.length; i++) {
      point = stroke[i];
      points.push({
        position: point.position,
        rotation: point.rotation,
        timestamp: point.timestamp
      });
    }
    return points;
  },

  saveCapture: function (binary) {
    var jsonData = JSON.stringify(this.getJSONData());
    var type = binary ? 'application/octet-binary' : 'application/json';
    var blob = new Blob([jsonData], {type: type});
    var url = URL.createObjectURL(blob);
    var fileName = 'motion-capture-' + document.title + '-' + Date.now() + '.json';
    var aEl = document.createElement('a');
    aEl.setAttribute('class', 'motion-capture-download');
    aEl.href = url;
    aEl.setAttribute('download', fileName);
    aEl.innerHTML = 'downloading...';
    aEl.style.display = 'none';
    document.body.appendChild(aEl);
    setTimeout(function () {
      aEl.click();
      document.body.removeChild(aEl);
    }, 1);
  },

  update: function () {
    var el = this.el;
    var data = this.data;
    if (this.data.autoRecord) {
      this.startRecording();
    } else {
      // Don't try to record camera with controllers.
      if (el.components.camera) { return; }

      if (data.recordingControls) {
        el.setAttribute('vive-controls', {hand: data.hand});
        el.setAttribute('oculus-touch-controls', {hand: data.hand});
      }
      el.setAttribute('stroke', '');
    }
  },

  tick: (function () {
    var position = new THREE.Vector3();
    var rotation = new THREE.Quaternion();
    var scale = new THREE.Vector3();

    return function (time, delta) {
      var newPoint;
      var pointerPosition;
      this.lastTimestamp = time;
      if (!this.data.enabled || !this.isRecording) { return; }
      newPoint = {
        position: this.el.getAttribute('position'),
        rotation: this.el.getAttribute('rotation'),
        timestamp: time
      };
      this.recordedPoses.push(newPoint);
      if (!this.data.visibleStroke) { return; }
      this.el.object3D.updateMatrixWorld();
      this.el.object3D.matrixWorld.decompose(position, rotation, scale);
      pointerPosition = this.getPointerPosition(position, rotation);
      this.el.components.stroke.drawPoint(position, rotation, time, pointerPosition);
    };
  })(),

  getPointerPosition: (function () {
    var pointerPosition = new THREE.Vector3();
    var offset = new THREE.Vector3(0, 0.7, 1);
    return function getPointerPosition (position, orientation) {
      var pointer = offset
        .clone()
        .applyQuaternion(orientation)
        .normalize()
        .multiplyScalar(-0.03);
      pointerPosition.copy(position).add(pointer);
      return pointerPosition;
    };
  })(),

  startRecording: function () {
    var el = this.el;
    if (this.isRecording) { return; }
    if (el.components.stroke) { el.components.stroke.reset(); }
    this.isRecording = true;
    this.recordedPoses = [];
    this.recordedEvents = [];
    el.emit('strokestarted', {entity: el, poses: this.recordedPoses});
  },

  stopRecording: function () {
    var el = this.el;
    if (!this.isRecording) { return; }
    el.emit('strokeended', {poses: this.recordedPoses});
    this.isRecording = false;
    if (!this.data.visibleStroke || this.data.persistStroke) { return; }
    el.components.stroke.reset();
  }
});

},{}],7:[function(require,module,exports){
/* global THREE, AFRAME  */
AFRAME.registerComponent('motion-capture-replayer', {
  schema: {
    enabled: {default: true},
    recorderEl: {type: 'selector'},
    loop: {default: false},
    src: {default: ''},
    spectatorCamera: {default: false}
  },

  init: function () {
    this.currentPoseTime = 0;
    this.currentEventTime = 0;
    this.currentPoseIndex = 0;
    this.currentEventIndex = 0;
    this.onStrokeStarted = this.onStrokeStarted.bind(this);
    this.onStrokeEnded = this.onStrokeEnded.bind(this);
    this.playComponent = this.playComponent.bind(this);
    this.el.addEventListener('pause', this.playComponent);
    this.discardedFrames = 0;
    this.playingEvents = [];
    this.playingPoses = [];
  },

  remove: function () {
    this.el.removeEventListener('pause', this.playComponent);
    this.stopReplaying();
    this.el.pause();
    this.el.play();
  },

  update: function (oldData) {
    var data = this.data;
    this.updateRecorder(data.recorderEl, oldData.recorderEl);
    if (!this.el.isPlaying) { this.playComponent(); }
    if (oldData.src === data.src) { return; }
    if (data.src) { this.updateSrc(data.src); }
  },

  updateRecorder: function (newRecorderEl, oldRecorderEl) {
    if (oldRecorderEl && oldRecorderEl !== newRecorderEl) {
      oldRecorderEl.removeEventListener('strokestarted', this.onStrokeStarted);
      oldRecorderEl.removeEventListener('strokeended', this.onStrokeEnded);
    }
    if (!newRecorderEl || oldRecorderEl === newRecorderEl) { return; }
    newRecorderEl.addEventListener('strokestarted', this.onStrokeStarted);
    newRecorderEl.addEventListener('strokeended', this.onStrokeEnded);
  },

  updateSrc: function (src) {
    this.el.sceneEl.systems['motion-capture-recorder'].loadRecordingFromUrl(src, false, this.startReplaying.bind(this));
  },

  onStrokeStarted: function(evt) {
    this.reset();
  },

  onStrokeEnded: function(evt) {
    this.startReplayingPoses(evt.detail.poses);
  },

  play: function () {
    if (this.playingStroke) { this.playStroke(this.playingStroke); }
  },

  playComponent: function () {
    this.el.isPlaying = true;
    this.play();
  },

  startReplaying: function (data) {
    this.ignoredFrames = 0;
    this.storeInitialPose();
    this.isReplaying = true;
    this.startReplayingPoses(data.poses);
    this.startReplayingEvents(data.events);
    if (data.gamepad) {
      this.el.sceneEl.systems['motion-capture-replayer'].gamepads.push(data.gamepad);
      this.el.emit('gamepadconnected');
    }
    this.el.emit('replayingstarted');
  },

  stopReplaying: function () {
    this.isReplaying = false;
    this.restoreInitialPose();
    this.el.emit('replayingstopped');
  },

  storeInitialPose: function () {
    var el = this.el;
    this.initialPose = {
      position: el.getAttribute('position'),
      rotation: el.getAttribute('rotation')
    };
  },

  restoreInitialPose: function () {
    var el = this.el;
    if (!this.initialPose) { return; }
    el.setAttribute('position', this.initialPose.position);
    el.setAttribute('rotation', this.initialPose.rotation);
  },

  startReplayingPoses: function (poses) {
    this.isReplaying = true;
    this.currentPoseIndex = 0;
    if (poses.length === 0) { return; }
    this.playingPoses = poses;
    this.currentPoseTime = poses[0].timestamp;
  },

  startReplayingEvents: function (events) {
    var firstEvent;
    this.isReplaying = true;
    this.currentEventIndex = 0;
    if (events.length === 0) { return; }
    firstEvent = events[0];
    this.playingEvents = events;
    this.currentEventTime = firstEvent.timestamp;
    this.el.emit(firstEvent.name, firstEvent);
  },

  // Reset player
  reset: function () {
    this.playingPoses = null;
    this.currentTime = undefined;
    this.currentPoseIndex = undefined;
  },

  /**
   * Called on tick.
   */
  playRecording: function (delta) {
    var currentPose;
    var currentEvent
    var playingPoses = this.playingPoses;
    var playingEvents = this.playingEvents;
    currentPose = playingPoses && playingPoses[this.currentPoseIndex]
    currentEvent = playingEvents && playingEvents[this.currentEventIndex];
    this.currentPoseTime += delta;
    this.currentEventTime += delta;
    // determine next pose
    while ((currentPose && this.currentPoseTime >= currentPose.timestamp) ||
           (currentEvent && this.currentPoseTime >= currentEvent.timestamp)) {
      // pose
      if (currentPose && this.currentPoseTime >= currentPose.timestamp) {
        if (this.currentPoseIndex === playingPoses.length - 1) {
          if (this.data.loop) {
            this.currentPoseIndex = 0;
            this.currentPoseTime = playingPoses[0].timestamp;
          } else {
            this.stopReplaying();
          }
        }
        applyPose(this.el, currentPose);
        this.currentPoseIndex += 1;
        currentPose = playingPoses[this.currentPoseIndex];
      }
      // event
      if (currentEvent && this.currentPoseTime >= currentEvent.timestamp) {
        if (this.currentEventIndex === playingEvents.length && this.data.loop) {
          this.currentEventIndex = 0;
          this.currentEventTime = playingEvents[0].timestamp;
        }
        this.el.emit(currentEvent.name, currentEvent.detail);
        this.currentEventIndex += 1;
        currentEvent = this.playingEvents[this.currentEventIndex];
      }
    }
  },

  tick:  function (time, delta) {
    // Ignore the first couple of frames that come from window.RAF on Firefox.
    if (this.ignoredFrames !== 2 && !window.debug) {
      this.ignoredFrames++;
      return;
    }

    if (!this.isReplaying) { return; }
    this.playRecording(delta);
  }
});

function applyPose (el, pose) {
  el.setAttribute('position', pose.position);
  el.setAttribute('rotation', pose.rotation);
};

},{}],8:[function(require,module,exports){
/* global THREE AFRAME  */
AFRAME.registerComponent('stroke', {
  schema: {
    enabled: {default: true},
    color: {default: '#ef2d5e', type: 'color'}
  },

  init: function () {
    var maxPoints = this.maxPoints = 3000;
    var strokeEl;
    this.idx = 0;
    this.numPoints = 0;

    // Buffers
    this.vertices = new Float32Array(maxPoints*3*3);
    this.normals = new Float32Array(maxPoints*3*3);
    this.uvs = new Float32Array(maxPoints*2*2);

    // Geometries
    this.geometry = new THREE.BufferGeometry();
    this.geometry.setDrawRange(0, 0);
    this.geometry.addAttribute('position', new THREE.BufferAttribute(this.vertices, 3).setDynamic(true));
    this.geometry.addAttribute('uv', new THREE.BufferAttribute(this.uvs, 2).setDynamic(true));
    this.geometry.addAttribute('normal', new THREE.BufferAttribute(this.normals, 3).setDynamic(true));

    this.material = new THREE.MeshStandardMaterial({
      color: this.data.color,
      roughness: 0.75,
      metalness: 0.25,
      side: THREE.DoubleSide
    });

    var mesh = new THREE.Mesh(this.geometry, this.material);
    mesh.drawMode = THREE.TriangleStripDrawMode;
    mesh.frustumCulled = false;

    // Injects stroke entity
    strokeEl = document.createElement('a-entity');
    strokeEl.setObject3D('stroke', mesh);
    this.el.sceneEl.appendChild(strokeEl);
  },

  update: function() {
    this.material.color.set(this.data.color);
  },

  drawPoint: (function () {
    var direction = new THREE.Vector3();
    var positionA = new THREE.Vector3();
    var positionB = new THREE.Vector3();
    return function (position, orientation, timestamp, pointerPosition) {
      var uv = 0;
      var numPoints = this.numPoints;
      var brushSize = 0.01;
      if (numPoints === this.maxPoints) { return; }
      for (i = 0; i < numPoints; i++) {
        this.uvs[uv++] = i / (numPoints - 1);
        this.uvs[uv++] = 0;

        this.uvs[uv++] = i / (numPoints - 1);
        this.uvs[uv++] = 1;
      }

      direction.set(1, 0, 0);
      direction.applyQuaternion(orientation);
      direction.normalize();

      positionA.copy(pointerPosition);
      positionB.copy(pointerPosition);
      positionA.add(direction.clone().multiplyScalar(brushSize / 2));
      positionB.add(direction.clone().multiplyScalar(-brushSize / 2));

      this.vertices[this.idx++] = positionA.x;
      this.vertices[this.idx++] = positionA.y;
      this.vertices[this.idx++] = positionA.z;

      this.vertices[this.idx++] = positionB.x;
      this.vertices[this.idx++] = positionB.y;
      this.vertices[this.idx++] = positionB.z;

      this.computeVertexNormals();
      this.geometry.attributes.normal.needsUpdate = true;
      this.geometry.attributes.position.needsUpdate = true;
      this.geometry.attributes.uv.needsUpdate = true;

      this.geometry.setDrawRange(0, numPoints * 2);
      this.numPoints += 1;
      return true;
    }
  })(),

  reset: function () {
    var idx = 0;
    var vertices = this.vertices;
    for (i = 0; i < this.numPoints; i++) {
      vertices[idx++] = 0;
      vertices[idx++] = 0;
      vertices[idx++] = 0;

      vertices[idx++] = 0;
      vertices[idx++] = 0;
      vertices[idx++] = 0;
    }
    this.geometry.setDrawRange(0, 0);
    this.idx = 0;
    this.numPoints = 0;
  },

  computeVertexNormals: function () {
    var pA = new THREE.Vector3();
    var pB = new THREE.Vector3();
    var pC = new THREE.Vector3();
    var cb = new THREE.Vector3();
    var ab = new THREE.Vector3();

    for (var i = 0, il = this.idx; i < il; i++) {
      this.normals[ i ] = 0;
    }

    var pair = true;
    for (i = 0, il = this.idx; i < il; i += 3) {
      if (pair) {
        pA.fromArray(this.vertices, i);
        pB.fromArray(this.vertices, i + 3);
        pC.fromArray(this.vertices, i + 6);
      } else {
        pA.fromArray(this.vertices, i + 3);
        pB.fromArray(this.vertices, i);
        pC.fromArray(this.vertices, i + 6);
      }
      pair = !pair;

      cb.subVectors(pC, pB);
      ab.subVectors(pA, pB);
      cb.cross(ab);
      cb.normalize();

      this.normals[i] += cb.x;
      this.normals[i + 1] += cb.y;
      this.normals[i + 2] += cb.z;

      this.normals[i + 3] += cb.x;
      this.normals[i + 4] += cb.y;
      this.normals[i + 5] += cb.z;

      this.normals[i + 6] += cb.x;
      this.normals[i + 7] += cb.y;
      this.normals[i + 8] += cb.z;
    }

    /*
    first and last vertice (0 and 8) belongs just to one triangle
    second and penultimate (1 and 7) belongs to two triangles
    the rest of the vertices belongs to three triangles

      1_____3_____5_____7
      /\    /\    /\    /\
     /  \  /  \  /  \  /  \
    /____\/____\/____\/____\
    0    2     4     6     8
    */

    // Vertices that are shared across three triangles
    for (i = 2 * 3, il = this.idx - 2 * 3; i < il; i++) {
      this.normals[ i ] = this.normals[ i ] / 3;
    }

    // Second and penultimate triangle, that shares just two triangles
    this.normals[ 3 ] = this.normals[ 3 ] / 2;
    this.normals[ 3 + 1 ] = this.normals[ 3 + 1 ] / 2;
    this.normals[ 3 + 2 ] = this.normals[ 3 * 1 + 2 ] / 2;

    this.normals[ this.idx - 2 * 3 ] = this.normals[ this.idx - 2 * 3 ] / 2;
    this.normals[ this.idx - 2 * 3 + 1 ] = this.normals[ this.idx - 2 * 3 + 1 ] / 2;
    this.normals[ this.idx - 2 * 3 + 2 ] = this.normals[ this.idx - 2 * 3 + 2 ] / 2;

    this.geometry.normalizeNormals();
  }
});

},{}],9:[function(require,module,exports){
if (typeof AFRAME === 'undefined') {
  throw new Error('Component attempted to register before AFRAME was available.');
}

// Components
require('./components/motion-capture-recorder.js');
require('./components/motion-capture-replayer.js');
require('./components/avatar-recorder.js');
require('./components/avatar-replayer.js');
require('./components/stroke.js');

// Systems
require('./systems/motion-capture-replayer.js');

},{"./components/avatar-recorder.js":4,"./components/avatar-replayer.js":5,"./components/motion-capture-recorder.js":6,"./components/motion-capture-replayer.js":7,"./components/stroke.js":8,"./systems/motion-capture-replayer.js":10}],10:[function(require,module,exports){
AFRAME.registerSystem('motion-capture-replayer', {
  init: function () {
    var sceneEl = this.sceneEl;
    var trackedControlsSystem = sceneEl.systems['tracked-controls'];
    var trackedControlsTick = AFRAME.components['tracked-controls'].Component.prototype.tick;
    this.gamepads = [];
    this.updateControllerListOriginal = trackedControlsSystem.updateControllerList.bind(trackedControlsSystem);
    sceneEl.systems['tracked-controls'].updateControllerList = this.updateControllerList.bind(this);
    AFRAME.components['tracked-controls'].Component.prototype.tick = this.trackedControlsTickWrapper;
    AFRAME.components['tracked-controls'].Component.prototype.trackedControlsTick = trackedControlsTick;
  },

  trackedControlsTickWrapper: function (time, delta) {
    if (this.el.components['motion-capture-replayer']) { return; }
    this.trackedControlsTick(time, delta);
  },

  updateControllerList: function () {
    var sceneEl = this.sceneEl;
    var i;
    var trackedControlsSystem = sceneEl.systems['tracked-controls'];
    this.updateControllerListOriginal();
    this.gamepads.forEach(function (gamepad) {
      if (trackedControlsSystem.controllers[gamepad.index]) { return; }
      trackedControlsSystem.controllers[gamepad.index] = gamepad;
    });
    for (i = 0; i < trackedControlsSystem.controllers.length; ++i) {
      if (!trackedControlsSystem.controllers[i]) {
        trackedControlsSystem.controllers[i] = {id: '___', index: -1, hand: 'finger'};
      }
    }
  }
});
},{}],11:[function(require,module,exports){
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

},{}],12:[function(require,module,exports){
'use strict';

/* global AFRAME */
var buttonCore = require('./prototypes/buttons-proto.js');
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

},{"./prototypes/buttons-proto.js":16}],13:[function(require,module,exports){
'use strict';

/* global AFRAME */
var inherit = AFRAME.utils.extendDeep;
var buttonCore = require('./prototypes/buttons-proto.js');

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

},{"./prototypes/buttons-proto.js":16}],14:[function(require,module,exports){
'use strict';

/* global AFRAME, THREE */
var inherit = AFRAME.utils.extendDeep;
var physicsCore = require('./prototypes/physics-grab-proto.js');
var buttonsCore = require('./prototypes/buttons-proto.js');
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
  tick: function () {
    var deltaPosition = new THREE.Vector3();
    var targetPosition = new THREE.Vector3();
    var destPosition = { x: 0, y: 0, z: 0 };
    return function () {
      var entityPosition;
      if (this.grabber) {
        // reflect on z-axis to point in same direction as the laser
        targetPosition.copy(this.grabDirection);
        targetPosition.applyQuaternion(this.grabber.object3D.getWorldQuaternion()).setLength(this.grabDistance).add(this.grabber.object3D.getWorldPosition()).add(this.grabOffset);
        if (this.deltaPositionIsValid) {
          // relative position changes work better with nested entities
          deltaPosition.sub(targetPosition);
          entityPosition = this.el.getAttribute('position');
          destPosition.x = entityPosition.x - deltaPosition.x * this.xFactor;
          destPosition.y = entityPosition.y - deltaPosition.y * this.yFactor;
          destPosition.z = entityPosition.z - deltaPosition.z * this.zFactor;
          this.el.setAttribute('position', destPosition);
        } else {
          this.deltaPositionIsValid = true;
        }
        deltaPosition.copy(targetPosition);
      }
    };
  }(),
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

},{"./prototypes/buttons-proto.js":16,"./prototypes/physics-grab-proto.js":17}],15:[function(require,module,exports){
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

},{}],16:[function(require,module,exports){
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

},{}],17:[function(require,module,exports){
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

},{}],18:[function(require,module,exports){
'use strict';

/* global AFRAME, THREE */
var inherit = AFRAME.utils.extendDeep;
var buttonCore = require('./prototypes/buttons-proto.js');
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

    this.start = this.start.bind(this);
    this.end = this.end.bind(this);

    this.el.addEventListener(this.STRETCH_EVENT, this.start);
    this.el.addEventListener(this.UNSTRETCH_EVENT, this.end);
  },
  update: function update(oldDat) {},
  tick: function () {
    var scale = new THREE.Vector3();
    var handPos = new THREE.Vector3();
    var otherHandPos = new THREE.Vector3();
    return function () {
      if (!this.stretched) {
        return;
      }
      scale.copy(this.el.getAttribute('scale'));
      handPos.copy(this.stretchers[0].getAttribute('position'));
      otherHandPos.copy(this.stretchers[1].getAttribute('position'));
      var currentStretch = handPos.distanceTo(otherHandPos);
      var deltaStretch = 1;
      if (this.previousStretch !== null && currentStretch !== 0) {
        deltaStretch = Math.pow(currentStretch / this.previousStretch, this.data.invert ? -1 : 1);
      }
      this.previousStretch = currentStretch;
      scale.multiplyScalar(deltaStretch);
      this.el.setAttribute('scale', scale);
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
    };
  }(),
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

},{"./prototypes/buttons-proto.js":16}],19:[function(require,module,exports){
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

},{}]},{},[1]);
