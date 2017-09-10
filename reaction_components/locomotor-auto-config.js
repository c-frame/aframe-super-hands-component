/* global AFRAME */
AFRAME.registerComponent('locomotor-auto-config', {
  schema: {
    camera: {default: true},
    stretch: {default: true},
    move: {default: true}
  },
  dependencies: ['grabbable', 'stretchable'],
  init: function () {
    let ready = true;
    // generate fake collision to be permanently in super-hands queue
    this.el.childNodes.forEach(el => {
      let sh = el.getAttribute && el.getAttribute('super-hands');
      if (sh) {
        let evtDetails = {};
        evtDetails[sh.colliderEventProperty] = this.el;
        el.emit(sh.colliderEvent, evtDetails);
        this.colliderState = sh.colliderState;
        this.el.addState(this.colliderState);
      }
    });
    if (this.data.camera) {
      // this step has to be done asnychronously
      ready = false;
      this.el.addEventListener('loaded', e => {
        if (!document.querySelector('a-camera, [camera]')) {
          let cam = document.createElement('a-camera');
          this.el.appendChild(cam);
        }
        this.ready();
      });
    }
    if (ready) {
      this.ready();
    }
  },
  update: function () {
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
  remove: function () {
    this.el.removeState(this.colliderState);
  },
  ready: function () {
    this.el.emit('locomotor-ready', {});
  }
});
