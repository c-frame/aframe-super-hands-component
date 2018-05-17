/* global AFRAME */
const gazeDefaultId = 'progressivecontrolsgazedefault'
const pointDefaultId = 'progressivecontrolspointdefault'
const touchDefaultId = 'progressivecontrolstouchdefault'

AFRAME.registerComponent('progressive-controls', {
  schema: {
    maxLevel: {default: 'touch', oneOf: ['gaze', 'point', 'touch']},
    gazeMixin: {default: ''},
    pointMixin: {default: ''},
    touchMixin: {default: ''},
    override: {default: false},
    objects: {default: ''},
    controllerModel: {default: true}
  },
  init: function () {
    const rayEndProp = 'clearedEls'
    this.levels = ['gaze', 'point', 'touch']
    this.currentLevel = new Map()
    this.controllerName = new Map()

    // setup mixins for defaults
    const assets = this.el.sceneEl.querySelector('a-assets') ||
        this.el.sceneEl.appendChild(document.createElement('a-assets'))
    const gazeDefault = this.gazeDefault = document.createElement('a-mixin')
    const shRayConfig = AFRAME.utils.styleParser.stringify({
      colliderEvent: 'raycaster-intersection',
      colliderEventProperty: 'els',
      colliderEndEvent: 'raycaster-intersection-cleared',
      colliderEndEventProperty: rayEndProp,
      colliderState: ''
    })
    gazeDefault.setAttribute('id', gazeDefaultId)
    gazeDefault.setAttribute('geometry', 'primitive: ring;' +
        'radiusOuter: 0.008; radiusInner: 0.005; segmentsTheta: 32')
    gazeDefault.setAttribute('material', 'color: #000; shader: flat')
    gazeDefault.setAttribute('position', '0 0 -0.5')
    gazeDefault.setAttribute('raycaster', '')
    gazeDefault.setAttribute('super-hands', shRayConfig)
    const pointDefault = this.pointDefault = document.createElement('a-mixin')
    pointDefault.setAttribute('id', pointDefaultId)
    pointDefault.setAttribute('raycaster', 'showLine: true')
    pointDefault.setAttribute('super-hands', shRayConfig)
    const touchDefault = this.touchDefault = document.createElement('a-mixin')
    touchDefault.setAttribute('id', touchDefaultId)
    touchDefault.setAttribute('super-hands', '')
    touchDefault.setAttribute('sphere-collider', '')
    if (this.el.sceneEl.getAttribute('physics')) {
      const physicsBodyDefault = 'shape: sphere; sphereRadius: 0.02'
      pointDefault.setAttribute('static-body', physicsBodyDefault)
      gazeDefault.setAttribute('static-body', physicsBodyDefault)
      touchDefault.setAttribute('static-body', physicsBodyDefault)
    }
    assets.appendChild(gazeDefault)
    assets.appendChild(pointDefault)
    assets.appendChild(touchDefault)

    this.camera = this.el.querySelector('a-camera,[camera]')
    if (!this.camera) {
      this.camera = this.el.appendChild(document.createElement('a-camera'))
      // DEPRECATION path: camera y instead of userHeight in verions >= 0.8
      if (parseFloat(AFRAME.version) > 0.7) {
        this.camera.setAttribute('position', '0 1.6 0')
      }
    }
    this.caster = this.camera.querySelector('.gazecaster') ||
      this.camera.appendChild(document.createElement('a-entity'))
    ;['left', 'right'].forEach(hand => {
      // find controller by left-controller/right-controller class or create one
      this[hand] = this.el.querySelector('.' + hand + '-controller') ||
          this.el.appendChild(document.createElement('a-entity'))
      const ctrlrCompConfig = {
        hand: hand,
        model: this.data.controllerModel
      }
      ;['daydream-controls', 'gearvr-controls', 'oculus-touch-controls',
        'vive-controls', 'windows-motion-controls', 'oculus-go-controls']
          .forEach(ctrlr => this[hand].setAttribute(ctrlr, ctrlrCompConfig))
    })
    this.el.addEventListener('controllerconnected', e => this.detectLevel(e))
    this.eventRepeaterB = this.eventRepeater.bind(this)
    // pass mouse and touch events into the scene
    this.addEventListeners()
    // default level
    this.currentLevel.set('right', 0)
  },
  update: function (oldData) {
    const objs = {objects: this.data.objects}
    updateMixin(this.gazeDefault, 'raycaster', objs)
    updateMixin(this.pointDefault, 'raycaster', objs)
    updateMixin(this.touchDefault, 'sphere-collider', objs)
    for (let [hand, level] of this.currentLevel) {
      this.setLevel(level, hand, true)
    }
  },
  remove: function () {
    if (!this.eventsRegistered) { return }
    const canv = this.el.sceneEl.canvas
    canv.removeEventListener('mousedown', this.eventRepeaterB)
    canv.removeEventListener('mouseup', this.eventRepeaterB)
    canv.removeEventListener('touchstart', this.eventRepeaterB)
    canv.removeEventListener('touchend', this.eventRepeaterB)
  },
  setLevel: function (newLevel, hand, force) {
    hand = hand || 'right'
    const maxLevel = this.levels.indexOf(this.data.maxLevel)
    const currentHand = this[hand]
    const override = this.data.override
    newLevel = newLevel > maxLevel ? maxLevel : newLevel
    if (newLevel === this.currentLevel.get(hand) && !force) { return }
    if (newLevel !== 0 && this.caster) {
      // avoids error where physics system tries to tick on removed entity
      this.caster.setAttribute('mixin', '')
      this.camera.removeChild(this.caster)
      this.caster = null
    }
    switch (newLevel) {
      case this.levels.indexOf('gaze'):
        const gazeMixin = this.data.gazeMixin
        this.caster.setAttribute(
          'mixin',
          (override && gazeMixin.length ? '' : gazeDefaultId + ' ') + gazeMixin
        )
        break
      case this.levels.indexOf('point'):
        const ctrlrName = this.controllerName.get(hand)
        const ctrlrCfg = this.controllerConfig[ctrlrName]
        const pntMixin = this.data.pointMixin
        if (ctrlrCfg && ctrlrCfg.raycaster) {
          currentHand.setAttribute('raycaster', ctrlrCfg.raycaster)
        }
        currentHand.setAttribute(
          'mixin',
          (override && pntMixin.length ? '' : pointDefaultId + ' ') + pntMixin
        )
        break
      case this.levels.indexOf('touch'):
        const tchMixin = this.data.touchMixin
        currentHand.setAttribute(
          'mixin',
          (override && tchMixin.length ? '' : touchDefaultId + ' ') + tchMixin
        )
        break
    }
    this.currentLevel.set(hand, newLevel)
    this.el.emit('controller-progressed', {
      level: this.levels[newLevel],
      hand: hand
    })
  },
  detectLevel: function (evt) {
    const DOF6 = ['vive-controls', 'oculus-touch-controls',
      'windows-motion-controls']
    const DOF3 = ['gearvr-controls', 'daydream-controls', 'oculus-go-controls']
    const hand = evt.detail.component.data.hand || 'right'
    this.controllerName.set(hand, evt.detail.name)
    if (DOF6.indexOf(evt.detail.name) !== -1) {
      this.setLevel(this.levels.indexOf('touch'), hand)
    } else if (DOF3.indexOf(evt.detail.name) !== -1) {
      this.setLevel(this.levels.indexOf('point'), hand)
    }
  },
  eventRepeater: function (evt) {
    if (!this.caster) { return } // only for gaze mode
    if (evt.type.startsWith('touch')) {
      evt.preventDefault()
      // avoid repeating touchmove because it interferes with look-controls
      if (evt.type === 'touchmove') { return }
    }
    this.caster.emit(evt.type, evt.detail)
  },
  addEventListeners: function () {
    if (!this.el.sceneEl.canvas) {
      this.el.sceneEl
          .addEventListener('loaded', this.addEventListeners.bind(this))
      return
    }
    this.el.sceneEl.canvas.addEventListener('mousedown', this.eventRepeaterB)
    this.el.sceneEl.canvas.addEventListener('mouseup', this.eventRepeaterB)
    this.el.sceneEl.canvas.addEventListener('touchstart', this.eventRepeaterB)
    this.el.sceneEl.canvas.addEventListener('touchmove', this.eventRepeaterB)
    this.el.sceneEl.canvas.addEventListener('touchend', this.eventRepeaterB)
    this.eventsRegistered = true
  },
  controllerConfig: {
    'gearvr-controls': {
      raycaster: {origin: {x: 0, y: 0.0005, z: 0}}
    },
    'oculus-touch-controls': {
      raycaster: {origin: {x: 0.001, y: 0, z: 0.065}, direction: {x: 0, y: -0.8, z: -1}}
    },
    'oculus-go-controls': {
      raycaster: {origin: {x: 0, y: 0.0005, z: 0}}
    },
    'windows-motion-controls': {
      raycaster: {direction: {x: 0, y: -0.4472, z: -0.8944}}
    }
  }
})

function updateMixin (mixin, attr, additions) {
  const stringify = AFRAME.utils.styleParser.stringify
  const extend = AFRAME.utils.extend
  const old = mixin.getAttribute(attr)
  if (old) { mixin.setAttribute(attr, stringify(extend(old, additions))) }
}
