/* global AFRAME, THREE */
const inherit = AFRAME.utils.extendDeep
const buttonsCore = require('./prototypes/buttons-proto.js')
// new object with all core modules
const base = inherit({}, buttonsCore)
AFRAME.registerComponent('stretchable', inherit(base, {
  schema: {
    usePhysics: {default: 'ifavailable'},
    invert: {default: false},
    physicsUpdateRate: {default: 100}
  },
  init: function () {
    this.STRETCHED_STATE = 'stretched'
    this.STRETCH_EVENT = 'stretch-start'
    this.UNSTRETCH_EVENT = 'stretch-end'
    this.stretched = false
    this.stretchers = []

    this.scale = new THREE.Vector3()
    this.handPos = new THREE.Vector3()
    this.otherHandPos = new THREE.Vector3()

    this.start = this.start.bind(this)
    this.end = this.end.bind(this)

    this.el.addEventListener(this.STRETCH_EVENT, this.start)
    this.el.addEventListener(this.UNSTRETCH_EVENT, this.end)
  },
  update: function (oldDat) {
    this.updateBodies = AFRAME.utils.throttleTick(
      this._updateBodies,
      this.data.physicsUpdateRate,
      this
    )
  },
  tick: function (time, timeDelta) {
    if (!this.stretched) { return }
    this.scale.copy(this.el.getAttribute('scale'))
    this.stretchers[0].object3D.getWorldPosition(this.handPos)
    this.stretchers[1].object3D.getWorldPosition(this.otherHandPos)
    const currentStretch = this.handPos.distanceTo(this.otherHandPos)
    let deltaStretch = 1
    if (this.previousStretch !== null && currentStretch !== 0) {
      deltaStretch = Math.pow(
          currentStretch / this.previousStretch,
          (this.data.invert)
            ? -1
            : 1
      )
    }
    this.previousStretch = currentStretch
    if (this.previousPhysicsStretch == null) {
      // establish correct baseline even if throttled function isn't called
      this.previousPhysicsStretch = currentStretch
    }
    this.scale.multiplyScalar(deltaStretch)
    this.el.setAttribute('scale', this.scale)
    // scale update for all nested physics bodies (throttled)
    this.updateBodies(time, timeDelta)
  },
  remove: function () {
    this.el.removeEventListener(this.STRETCH_EVENT, this.start)
    this.el.removeEventListener(this.UNSTRETCH_EVENT, this.end)
  },
  start: function (evt) {
    if (this.stretched || this.stretchers.includes(evt.detail.hand) ||
        !this.startButtonOk(evt) || evt.defaultPrevented) {
      return
    } // already stretched or already captured this hand or wrong button
    this.stretchers.push(evt.detail.hand)
    if (this.stretchers.length === 2) {
      this.stretched = true
      this.previousStretch = null
      this.previousPhysicsStretch = null
      this.el.addState(this.STRETCHED_STATE)
    }
    if (evt.preventDefault) { evt.preventDefault() } // gesture accepted
  },
  end: function (evt) {
    var stretcherIndex = this.stretchers.indexOf(evt.detail.hand)
    if (evt.defaultPrevented || !this.endButtonOk(evt)) { return }
    if (stretcherIndex !== -1) {
      this.stretchers.splice(stretcherIndex, 1)
      this.stretched = false
      this.el.removeState(this.STRETCHED_STATE)
      // override throttle to push last stretch to physics bodies
      this._updateBodies()
    }
    if (evt.preventDefault) { evt.preventDefault() }
  },
  _updateBodies: function () {
    if (!this.el.body || this.data.usePhysics === 'never') { return }
    const currentStretch = this.previousStretch // last visible geometry stretch
    let deltaStretch = 1
    if (this.previousPhysicsStretch !== null && currentStretch > 0) {
      deltaStretch = Math.pow(
          currentStretch / this.previousPhysicsStretch,
          (this.data.invert)
            ? -1
            : 1
      )
    }
    this.previousPhysicsStretch = currentStretch
    if (deltaStretch === 1) { return }
    for (let c of this.el.childNodes) { this.stretchBody(c, deltaStretch) }
    this.stretchBody(this.el, deltaStretch)
  },
  stretchBody: function (el, deltaStretch) {
    if (!el.body) { return }
    let physicsShape
    let offset
    for (let i = 0; i < el.body.shapes.length; i++) {
      physicsShape = el.body.shapes[i]
      if (physicsShape.halfExtents) {
        physicsShape.halfExtents
            .scale(deltaStretch, physicsShape.halfExtents)
        physicsShape.updateConvexPolyhedronRepresentation()
      } else if (physicsShape.radius) {
        physicsShape.radius *= deltaStretch
        physicsShape.updateBoundingSphereRadius()
      } else if (!this.shapeWarned) {
        console.warn('Unable to stretch physics body: unsupported shape')
        this.shapeWarned = true
      }
      // also move offset to match scale change
      offset = el.body.shapeOffsets[i]
      offset.scale(deltaStretch, offset)
    }
    el.body.updateBoundingRadius()
  }
}))
