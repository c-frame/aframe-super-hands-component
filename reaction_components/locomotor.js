/* global AFRAME */
AFRAME.registerComponent('locomotor', {
  schema: {
    autoConfig: {default: true},
    restrictY: {default: true}
  },
  init: function () {
    this.MOVE_STATE = 'moving';
    this.MOVE_EVENT = 'grab-start';
    this.STOP_EVENT = 'grab-end';
    this.mover = null;

    this.start = this.start.bind(this);
    this.end = this.end.bind(this);

    this.el.addEventListener(this.MOVE_EVENT, this.start);
    this.el.addEventListener(this.STOP_EVENT, this.end);

    if (this.data.autoConfig) {
      let stretcher = this.el.getDOMAttribute('stretchable');
      // make sure locomotor is collidable
      this.el.childNodes.forEach(el => {
        let col = el.getAttribute && el.getAttribute('sphere-collider');
        if (col && col.objects.indexOf('a-locomotor') === -1) {
          el.setAttribute('sphere-collider', {
            objects: (col.objects === '')
                ? 'a-locomotor'
                : col.objects + ', a-locomotor'
          });
        }
      });
      // make default camera child of locomotor so it can be moved
      this.el.sceneEl.addEventListener('camera-ready', e => {
        var defCam = document.querySelector('[data-aframe-default-camera]');
        if (defCam) {
          this.el.appendChild(defCam);
        }
      });
      // invert stretch if not specified
      if (stretcher === '') {
        this.el.setAttribute('stretchable', 'invert: true');
      }
    }
  },
  update: function (oldDat) {
  },
  tick: function () {
    if (this.mover) {
      const handPosition = this.mover.getAttribute('position');
      const previousPosition = this.previousPosition || handPosition;
      const deltaPosition = {
        x: handPosition.x - previousPosition.x,
        y: handPosition.y - previousPosition.y,
        z: handPosition.z - previousPosition.z
      };
      const position = this.el.getAttribute('position');
      // subtract delta to invert movement
      this.el.setAttribute('position', {
        x: position.x - deltaPosition.x,
        y: position.y - deltaPosition.y * !this.data.restrictY,
        z: position.z - deltaPosition.z
      });
      this.previousPosition = handPosition;
    }
  },
  remove: function () {
    this.el.removeEventListener(this.MOVE_EVENT, this.start);
    this.el.removeEventListener(this.STOP_EVENT, this.end);
  },
  start: function (evt) {
    this.mover = evt.detail.hand;
    this.previousPosition = null;
    if (evt.preventDefault) { evt.preventDefault(); }
  },
  end: function (evt) {
    this.mover = null;
  }
});
