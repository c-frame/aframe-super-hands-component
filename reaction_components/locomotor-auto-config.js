/* global AFRAME */
AFRAME.registerComponent('locomotor-auto-config', {
  schema: {
    camera: {default: true},
    stretch: {default: true},
    move: {default: true}
  },
  init: function () {
    let ready = true;
    if (!this.data.stretch) {
      this.el.removeComponent('stretchable');
    }
    if (!this.data.move) {
      this.el.removeComponent('grabbable');
    }
    // generate fake collision to be permanently in super-hands queue
    this.el.childNodes.forEach(el => {
      let sh = el.getAttribute && el.getAttribute('super-hands');
      if (sh) {
        let evtDetails = {};
        evtDetails[sh.colliderEventProperty] = this.el;
        el.emit(sh.colliderEvent, evtDetails);
        this.el.addState(sh.colliderState);
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
  ready: function () {
    this.el.emit('locomotor-ready', {});
  }
});
