/* global AFRAME */
AFRAME.registerComponent('progressive-controls', {
  schema: {
    maxLevel: {default: 'touch'},
    objects: {default: ''},
    physicsBody: {default: 'shape: sphere; sphereRadius: 0.02'},
    touchCollider: {default: 'sphere-collider'}
  },
  init: function () {
    this.levels = ['gaze', 'point', 'touch'];
    this.currentLevel = 0;
    this.superHandsCursorConfig = 'colliderEvent: mouseenter;' +
        'colliderEventProperty: intersectedEl;' +
        'colliderState: cursor-hovered;' +
        'grabStartButtons: mousedown;' +
        'grabEndButtons: mouseup;' +
        'dragDropStartButtons: mousedown;' +
        'dragDropEndButtons: mouseup;';
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
    });
    this.el.addEventListener('controllerconnected', e => this.detectLevel(e));
  },
  update: function (oldData) {
    const level = this.currentLevel;
    // force setLevel refresh with new params
    this.currentLevel = -1;
    this.setLevel(level);
  },
  setLevel: function (newLevel) {
    const maxLevel = this.levels.indexOf(this.data.maxLevel);
    const physicsAvail = !!this.el.sceneEl.getAttribute('physics');
    const hands = [this.right, this.left];
    newLevel = newLevel > maxLevel ? maxLevel : newLevel;
    if (newLevel === this.currentLevel) { return; }
    if (newLevel !== 0 && this.cursor) {
      this.camera.removeChild(this.cursor);
      this.cursor = null;
    }
    switch (newLevel) {
      case 0:
        this.cursor = this.camera.querySelector('a-cursor,[cursor]') ||
          this.camera.appendChild(document.createElement('a-cursor'));
        this.camera.setAttribute('super-hands', this.superHandsCursorConfig);
        if (physicsAvail) {
          this.camera.setAttribute('static-body', this.data.physicsBody);
        }
        this.cursor.setAttribute('raycaster', 'objects: ' + this.data.objects);
        break;
      case 1:
        // same setup as laser-controls, but without the dependence on
        // controllerconnected event happening after init
        const laserConfig = AFRAME.components['laser-controls']
            .Component.prototype.config[this.controllerName] || {};
        const rayConfig = AFRAME.utils.styleParser.stringify(AFRAME.utils
            .extend({objects: this.data.objects, showLine: true},
            laserConfig.raycaster || {}));
        const cursorConfig = AFRAME.utils.styleParser.stringify(AFRAME.utils
            .extend({fuse: false}, laserConfig.cursor || {}));
        hands.forEach(h => {
          h.setAttribute('super-hands', this.superHandsCursorConfig);
          h.setAttribute('raycaster', rayConfig);
          h.setAttribute('cursor', cursorConfig);
          if (physicsAvail) {
            h.setAttribute('static-body', this.data.physicsBody);
          }
        });
        break;
      case 2:
        [this.right, this.left].forEach(h => {
          h.setAttribute('super-hands', {}, true);
          h.setAttribute(this.data.touchCollider,
              'objects: ' + this.data.objects);
          physicsAvail && h.setAttribute('static-body', this.data.physicsBody);
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
  }
});
