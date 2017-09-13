/* global AFRAME */
AFRAME.registerComponent('progressive-controls', {
  schema: {
    maxLevel: {default: 'touch', oneOf: ['gaze', 'point', 'touch']},
    objects: {default: ''},
    physicsBody: {default: 'shape: sphere; sphereRadius: 0.02'},
    touchCollider: {default: 'sphere-collider'}
  },
  init: function () {
    this.levels = ['gaze', 'point', 'touch'];
    this.currentLevel = 0;
    this.superHandsRaycasterConfig = {
      colliderEvent: 'raycaster-intersection',
      colliderEventProperty: 'els',
      colliderEndEvent: 'raycaster-intersection-cleared',
      colliderEndEventProperty: 'el',
      colliderState: ''
    };
    this.camera = this.el.querySelector('a-camera,[camera]') ||
        this.el.appendChild(document.createElement('a-camera'));
    ['left', 'right'].forEach(hand => {
      // find controller by left-controller/right-controller class or create one
      this[hand] = this.el.querySelector('.' + hand + '-controller') ||
          this.el.appendChild(document.createElement('a-entity'));
      // add class on newly created entities
      this[hand].classList && this[hand].classList.add(hand + '-controller');
      ['daydream-controls', 'gearvr-controls', 'oculus-touch-controls',
          'vive-controls', 'windows-motion-controls']
          .forEach(ctrlr => this[hand].setAttribute(ctrlr, 'hand: ' + hand));
      // save initial config
      this[hand + 'shOriginal'] = this[hand].getAttribute('super-hands') || {};
      if (typeof this[hand + 'shOriginal'] === 'string') {
        this[hand + 'shOriginal'] = AFRAME.utils.styleParser
            .parse(this[hand + 'shOriginal']);
      }
    });
    this.el.addEventListener('controllerconnected', e => this.detectLevel(e));
    this.eventRepeaterB = this.eventRepeater.bind(this);
    // pass mouse and touch events into the scene
    this.addEventListeners();
  },
  update: function (oldData) {
    const level = this.currentLevel;
    // force setLevel refresh with new params
    this.currentLevel = -1;
    this.setLevel(level);
  },
  remove: function () {
    if (!this.eventsRegistered) { return; }
    const canv = this.el.sceneEl.canvas;
    canv.removeEventListener('mousedown', this.eventRepeaterB);
    canv.removeEventListener('mouseup', this.eventRepeaterB);
    canv.removeEventListener('touchstart', this.eventRepeaterB);
    canv.removeEventListener('touchend', this.eventRepeaterB);
  },
  setLevel: function (newLevel) {
    const maxLevel = this.levels.indexOf(this.data.maxLevel);
    const physicsAvail = !!this.el.sceneEl.getAttribute('physics');
    const hands = [this.right, this.left];
    newLevel = newLevel > maxLevel ? maxLevel : newLevel;
    if (newLevel === this.currentLevel) { return; }
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
          this.caster.setAttribute('geometry', 'primitive: ring;' +
              'radiusOuter: 0.008; radiusInner: 0.005; segmentsTheta: 32');
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
        // borrow raycaster config from laser-controls
        const laserConfig = AFRAME.components['laser-controls']
            .Component.prototype.config[this.controllerName] || {};
        const rayConfig = AFRAME.utils.styleParser.stringify(AFRAME.utils
            .extend({objects: this.data.objects, showLine: true},
            laserConfig.raycaster || {}));
        hands.forEach(h => {
          h.setAttribute('super-hands', this.superHandsRaycasterConfig);
          h.setAttribute('raycaster', rayConfig);
          if (physicsAvail) {
            h.setAttribute('static-body', this.data.physicsBody);
          }
        });
        break;
      case 2:
        ['right', 'left'].forEach(h => {
          // clobber flag to restore defaults
          this[h].setAttribute('super-hands', this[h + 'shOriginal'], true);
          this[h].setAttribute(this.data.touchCollider,
              'objects: ' + this.data.objects);
          if (physicsAvail) {
            this[h].setAttribute('static-body', this.data.physicsBody);
          }
        });
        break;
    }
    this.currentLevel = newLevel;
    this.el.emit('controller-progressed', {
      level: this.levels[this.currentLevel]
    });
  },
  detectLevel: function (evt) {
    const DOF6 = ['vive-controls', 'oculus-touch-controls',
        'windows-motion-controls'];
    const DOF3 = ['gearvr-controls', 'daydream-controls'];
    this.controllerName = evt.detail.name;
    if (DOF6.indexOf(evt.detail.name) !== -1) {
      this.setLevel(this.levels.indexOf('touch'));
    } else if (DOF3.indexOf(evt.detail.name) !== -1) {
      this.setLevel(this.levels.indexOf('point'));
    } else {
      this.setLevel(this.levels.indexOf('gaze'));
    }
  },
  eventRepeater: function (evt) {
    this.camera.emit(evt.type, evt.detail);
  },
  addEventListeners: function () {
    if (!this.el.sceneEl.canvas) {
      this.el.sceneEl
          .addEventListener('loaded', this.addEventListeners.bind(this));
      return;
    }
    this.el.sceneEl.canvas.addEventListener('mousedown', this.eventRepeaterB);
    this.el.sceneEl.canvas.addEventListener('mouseup', this.eventRepeaterB);
    this.el.sceneEl.canvas.addEventListener('touchstart', this.eventRepeaterB);
    this.el.sceneEl.canvas.addEventListener('touchend', this.eventRepeaterB);
    this.eventsRegistered = true;
  }
});
