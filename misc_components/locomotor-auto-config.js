/* global AFRAME */
AFRAME.registerComponent('locomotor-auto-config', {
  schema: {
    camera: {default: true},
    stretch: {default: true},
    move: {default: true}
  },
  dependencies: ['grabbable', 'stretchable'],
  init: function () {
    this.ready = false
    if (this.data.camera) {
      if (!document.querySelector('a-camera, [camera]')) {
        let cam = document.createElement('a-camera')
        cam.setAttribute('position', '0 1.6 0')
        this.el.appendChild(cam)
      }
    }
    this.fakeCollisions()
    // for controllers added later
    this.fakeCollisionsB = this.fakeCollisions.bind(this)
    this.el.addEventListener('controllerconnected', this.fakeCollisionsB)
  },
  update: function () {
    if (this.el.getAttribute('stretchable') && !this.data.stretch) {
      // store settings for resetting
      this.stretchSet = this.el.getAttribute('stretchable')
      this.el.removeAttribute('stretchable')
    } else if (!this.el.getAttribute('stretchable') && this.data.stretch) {
      this.el.setAttribute('stretchable', this.stretchSet)
    }
    if (this.el.getAttribute('grabbable') && !this.data.move) {
      // store settings for resetting
      this.grabSet = this.el.getAttribute('grabbable')
      this.el.removeAttribute('grabbable')
    } else if (!this.el.getAttribute('grabbable') && this.data.move) {
      this.el.setAttribute('grabbable', this.grabSet)
    }
  },
  remove: function () {
    this.el.getChildEntities().forEach(el => {
      let sh = el.getAttribute('super-hands')
      if (sh) {
        let evtDetails = {}
        evtDetails[sh.colliderEndEventProperty] = this.el
        el.emit(sh.colliderEndEvent, evtDetails)
      }
    })
    this.el.removeEventListener('controllerconnected', this.fakeCollisionsB)
  },
  announceReady: function () {
    if (!this.ready) {
      this.ready = true
      this.el.emit('locomotor-ready', {})
    }
  },
  fakeCollisions: function () {
    this.el.getChildEntities().forEach(el => {
      let sh = el.getAttribute('super-hands')
      if (sh) {
        // generate fake collision to be permanently in super-hands queue
        let evtDetails = {}
        evtDetails[sh.colliderEventProperty] = this.el
        el.emit(sh.colliderEvent, evtDetails)
        this.colliderState = sh.colliderState
        this.el.addState(this.colliderState)
      }
    })
    this.announceReady()
  }
})
