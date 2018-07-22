/* global AFRAME, THREE */
const inherit = AFRAME.utils.extendDeep
const physicsCore = require('./prototypes/physics-grab-proto.js')
const buttonsCore = require('./prototypes/buttons-proto.js')
// new object with all core modules
const base = inherit({}, physicsCore, buttonsCore)
AFRAME.registerComponent('grabbable', inherit(base, {
  schema: {
    maxGrabbers: {type: 'int', default: NaN},
    invert: {default: false},
    suppressY: {default: false}
  },
  init: function () {
    this.GRABBED_STATE = 'grabbed'
    this.GRAB_EVENT = 'grab-start'
    this.UNGRAB_EVENT = 'grab-end'
    this.grabbed = false
    this.grabbers = []
    this.constraints = new Map()
    this.deltaPositionIsValid = false
    this.grabDistance = undefined
    this.grabDirection = {x: 0, y: 0, z: -1}
    this.grabOffset = {x: 0, y: 0, z: 0}
    // persistent object speeds up repeat setAttribute calls
    this.destPosition = {x: 0, y: 0, z: 0}
    this.deltaPosition = new THREE.Vector3()
    this.targetPosition = new THREE.Vector3()
    this.physicsInit()

    this.el.addEventListener(this.GRAB_EVENT, e => this.start(e))
    this.el.addEventListener(this.UNGRAB_EVENT, e => this.end(e))
    this.el.addEventListener('mouseout', e => this.lostGrabber(e))
  },
  update: function () {
    this.physicsUpdate()
    this.xFactor = (this.data.invert) ? -1 : 1
    this.zFactor = (this.data.invert) ? -1 : 1
    this.yFactor = ((this.data.invert) ? -1 : 1) * !this.data.suppressY
  },
  tick: (function () {
    var q = new THREE.Quaternion()
    var v = new THREE.Vector3()

    return function(){
      var entityPosition
      if (this.grabber) {
        // reflect on z-axis to point in same direction as the laser
        this.targetPosition.copy(this.grabDirection)
        this.targetPosition
            .applyQuaternion(this.grabber.object3D.getWorldQuaternion(q))
            .setLength(this.grabDistance)
            .add(this.grabber.object3D.getWorldPosition(v))
            .add(this.grabOffset)
        if (this.deltaPositionIsValid) {
          // relative position changes work better with nested entities
          this.deltaPosition.sub(this.targetPosition)
          entityPosition = this.el.getAttribute('position')
          this.destPosition.x =
              entityPosition.x - this.deltaPosition.x * this.xFactor
          this.destPosition.y =
              entityPosition.y - this.deltaPosition.y * this.yFactor
          this.destPosition.z =
              entityPosition.z - this.deltaPosition.z * this.zFactor
          this.el.setAttribute('position', this.destPosition)
        } else {
          this.deltaPositionIsValid = true
        }
        this.deltaPosition.copy(this.targetPosition)
      }
    }
})(),
  remove: function () {
    this.el.removeEventListener(this.GRAB_EVENT, this.start)
    this.el.removeEventListener(this.UNGRAB_EVENT, this.end)
    this.physicsRemove()
  },
  start: function (evt) {
    if (evt.defaultPrevented || !this.startButtonOk(evt)) {
      return
    }
    // room for more grabbers?
    const grabAvailable = !Number.isFinite(this.data.maxGrabbers) ||
        this.grabbers.length < this.data.maxGrabbers

    if (this.grabbers.indexOf(evt.detail.hand) === -1 && grabAvailable) {
      if (!evt.detail.hand.object3D) {
        console.warn('grabbable entities must have an object3D')
        return
      }
      this.grabbers.push(evt.detail.hand)
      // initiate physics if available, otherwise manual
      if (!this.physicsStart(evt) && !this.grabber) {
        this.grabber = evt.detail.hand
        this.resetGrabber()
      }
      // notify super-hands that the gesture was accepted
      if (evt.preventDefault) { evt.preventDefault() }
      this.grabbed = true
      this.el.addState(this.GRABBED_STATE)
    }
  },
  end: function (evt) {
    const handIndex = this.grabbers.indexOf(evt.detail.hand)
    if (evt.defaultPrevented || !this.endButtonOk(evt)) { return }
    if (handIndex !== -1) {
      this.grabbers.splice(handIndex, 1)
      this.grabber = this.grabbers[0]
    }
    this.physicsEnd(evt)
    if (!this.resetGrabber()) {
      this.grabbed = false
      this.el.removeState(this.GRABBED_STATE)
    }
    if (evt.preventDefault) { evt.preventDefault() }
  },
  resetGrabber: function () {
    var objPos = new THREE.Vector3()
    var grabPos = new THREE.Vector3()
    return function () {
      let raycaster
      if (!this.grabber) {
        return false
      }
      raycaster = this.grabber.getAttribute('raycaster')
      this.deltaPositionIsValid = false
      this.grabDistance = this.el.object3D.getWorldPosition(objPos).distanceTo(this.grabber.object3D.getWorldPosition(grabPos))
      if (raycaster) {
        this.grabDirection = raycaster.direction
        this.grabOffset = raycaster.origin
      }
      return true
    };
  }(),
  lostGrabber: function (evt) {
    let i = this.grabbers.indexOf(evt.relatedTarget)
    // if a queued, non-physics grabber leaves the collision zone, forget it
    if (i !== -1 && evt.relatedTarget !== this.grabber &&
        !this.physicsIsConstrained(evt.relatedTarget)) {
      this.grabbers.splice(i, 1)
    }
  }
}))
