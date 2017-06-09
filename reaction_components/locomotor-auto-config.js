/* global AFRAME */
AFRAME.registerComponent('locomotor-auto-config', {
  schema: {
    camera: {default: true},
    stretch: {default: true},
    move: {default: true},
    collider: {default: true}
  },
  init: function () {
    if (!this.data.stretch) {
      this.el.removeComponent('stretchable');
    }
    if (!this.data.move) {
      this.el.removeComponent('grabbable');
    }
    if (this.data.collider) {
      // make sure locomotor is collidable
      this.el.childNodes.forEach(el => {
        let col = el.getAttribute && el.getAttribute('sphere-collider');
        if (col && col.objects.indexOf('a-locomotor') === -1) {
          el.setAttribute('sphere-collider', {
            objects: (col.objects === '')
                // empty objects property will collide with everything
                ? col.objects
                // otherwise add self to selector string
                : col.objects + ', a-locomotor'
          });
        }
      });
    }
    if (this.data.camera) {
      // make default camera child of locomotor so it can be moved
      this.el.sceneEl.addEventListener('camera-ready', e => {
        var defCam = document.querySelector('[data-aframe-default-camera]');
        if (defCam) {
          this.el.appendChild(defCam);
        }
      });
    }
  }
});
