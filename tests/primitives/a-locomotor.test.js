/* global assert, process, setup, suite, test */
const helpers = require('../helpers')
const entityFactory = helpers.entityFactory

suite('a-locomotor lifecycle', function () {
  setup(function (done) {
    var el = this.el = entityFactory()
    this.loco = document.createElement('a-locomotor')
    el.sceneEl.appendChild(this.loco)
    this.hand1 = helpers
        .controllerFactory({ 'hand-controls': 'right' }, true, this.loco)
    this.hand2 = helpers
        .controllerFactory({ 'hand-controls': 'left' }, true, this.loco)
    el.sceneEl.addEventListener('locomotor-ready', function () {
      done()
    })
  })
  test('primitive initialized without errors', function () {
    assert.isOk(document.querySelector('a-locomotor'))
  })
})

suite('a-locomotor autoconfig', function () {
  setup(function (done) {
    var el = this.el = entityFactory()
    this.loco = document.createElement('a-locomotor')
    el.sceneEl.appendChild(this.loco)
    this.hand1 = helpers.controllerFactory({
      'hand-controls': 'right',
      'sphere-collider': 'objects: .test'
    }, true, this.loco)
    this.hand2 = helpers.controllerFactory({
      'hand-controls': 'left',
      'sphere-collider': 'objects: .test'
    }, true, this.loco)
    el.sceneEl.addEventListener('locomotor-ready', function (e) {
      done()
    })
  })
  test('grabbable setup', function () {
    const grab = this.loco.components['grabbable']
    assert.isOk(grab)
    assert.isTrue(grab.data.invert)
    assert.isTrue(grab.data.suppressY)
  })
  test('stretchable setup', function () {
    const stretch = this.loco.components['stretchable']
    assert.isOk(stretch)
    assert.isTrue(stretch.data.invert)
  })
})

suite('a-locomotor autoconfig options', function () {
  setup(function (done) {
    var el = this.el = entityFactory()
    this.loco = document.createElement('a-locomotor')
    this.loco.setAttribute('fetch-camera', 'false')
    this.loco.setAttribute('add-to-colliders', 'false')
    this.loco.setAttribute('horizontal-only', 'false')
    this.loco.setAttribute('allow-movement', 'false')
    this.loco.setAttribute('allow-scaling', 'false')
    el.sceneEl.appendChild(this.loco)
    this.hand1 = helpers.controllerFactory({
      'hand-controls': 'right',
      'sphere-collider': 'objects: .test'
    }, true, this.loco)
    this.hand2 = helpers.controllerFactory({
      'hand-controls': 'left',
      'sphere-collider': 'objects: .test'
    }, true, this.loco)
    el.sceneEl.addEventListener('locomotor-ready', function () {
      done()
    })
  })
  test('disabled camera capture', function (done) {
    // initialization order differs when camera setup is disabled
    this.el.sceneEl.addEventListener('camera-ready', function () {
      assert.notStrictEqual(
        document.querySelector('[camera]').parentElement,
        this.loco
      )
      done()
    })
  })
  test('Not grabbable', function (done) {
    assert.isOk(this.loco.getAttribute('grabbable'))
    process.nextTick(() => {
      assert.isNotOk(this.loco.getAttribute('grabbable'))
      done()
    })
  })
  test('not stretchable', function (done) {
    assert.isOk(this.loco.getAttribute('stretchable'))
    process.nextTick(() => {
      assert.isNotOk(this.loco.getAttribute('stretchable'))
      done()
    })
  })
  test('resume grab/sretch', function (done) {
    this.loco.setAttribute('allow-scaling', 'true')
    this.loco.setAttribute('allow-movement', 'true')
    process.nextTick(() => {
      assert.isTrue(this.loco.getAttribute('grabbable').invert)
      assert.isTrue(this.loco.getAttribute('stretchable').invert)
      done()
    })
  })
})

suite('a-locomotor autoconfig options: horizontal-only', function () {
  setup(function (done) {
    var el = this.el = entityFactory()
    this.loco = document.createElement('a-locomotor')
    this.loco.setAttribute('horizontal-only', 'false')
    el.sceneEl.appendChild(this.loco)
    this.hand1 = helpers.controllerFactory({
      'hand-controls': 'right',
      'sphere-collider': 'objects: .test'
    }, true, this.loco)
    this.hand2 = helpers.controllerFactory({
      'hand-controls': 'left',
      'sphere-collider': 'objects: .test'
    }, true, this.loco)
    el.sceneEl.addEventListener('locomotor-ready', function () {
      done()
    })
  })
  test('Vertical movement allowed', function () {
    const grab = this.loco.components['grabbable']
    assert.isOk(grab)
    assert.isFalse(grab.data.suppressY, 'vertical movement allowed')
    assert.isTrue(grab.data.invert)
  })
})
suite('a-locomotor camera options', function () {
  setup(function () {
    this.el = entityFactory()
  })
  test('Creates a camera by default', function (done) {
    const loco = document.createElement('a-locomotor')
    this.el.sceneEl.appendChild(loco)
    this.el.sceneEl.addEventListener('camera-ready', function () {
      assert.isOk(document.querySelector('a-locomotor [camera]'))
      done()
    })
  })
  test('Does not create camera if a-camera already exists', function (done) {
    const cam = document.createElement('a-camera')
    const loco = document.createElement('a-locomotor')
    this.el.sceneEl.appendChild(cam)
    this.el.sceneEl.appendChild(loco)
    this.el.sceneEl.addEventListener('camera-ready', function () {
      assert.isNotOk(document.querySelector('a-locomotor [camera]'))
      assert.isOk(document.querySelector('a-scene>[camera]'))
      done()
    })
  })
  test('Does not create camera if [camera] already exists', function (done) {
    const cam = document.createElement('a-entity')
    const loco = document.createElement('a-locomotor')
    cam.setAttribute('camera', '')
    this.el.sceneEl.appendChild(cam)
    this.el.sceneEl.appendChild(loco)
    this.el.sceneEl.addEventListener('camera-ready', function () {
      assert.isNotOk(document.querySelector('a-locomotor [camera]'))
      assert.isOk(document.querySelector('a-scene>[camera]'))
      done()
    })
  })
})

suite('a-locomotor collision', function () {
  setup(function (done) {
    var el = this.el = entityFactory()
    this.loco = document.createElement('a-locomotor')
    el.sceneEl.appendChild(this.loco)
    this.hand1 = helpers.controllerFactory({
      'hand-controls': 'right',
      'super-hands': ''
    }, true, this.loco)
    this.hand2 = helpers.controllerFactory({
      'hand-controls': 'left',
      'super-hands': ''
    }, true, this.loco)
    el.sceneEl.addEventListener('loaded', function (e) {
      done()
    })
  })
  test('injects self into super-hands hoverEls', function () {
    assert.includeMembers(
        this.hand1.components['super-hands'].hoverEls,
        [this.loco]
    )
  })
  test('drops out of hoverEls when removed', function () {
    this.loco.removeAttribute('locomotor-auto-config')
    assert.sameMembers(
      this.hand1.components['super-hands'].hoverEls,
      []
    )
  })
})
