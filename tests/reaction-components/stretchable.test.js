/* global assert, process, setup, suite, test, AFRAME */

var helpers = require('../helpers')
var entityFactory = helpers.entityFactory
var coord = AFRAME.utils.coordinates.parse
var uncoord = AFRAME.utils.coordinates.stringify

suite('stretchable', function () {
  setup(function (done) {
    var el = this.el = entityFactory()
    this.hand1 = helpers
      .controllerFactory({ 'hand-controls': 'right' }, true)
    this.hand2 = helpers
      .controllerFactory({ 'hand-controls': 'left' }, true)
    el.setAttribute('stretchable', '')
    el.sceneEl.addEventListener('loaded', evt => {
      this.comp = el.components.stretchable
      done()
    })
  })
  test('component attaches without errors', function () {
    assert.isOk(this.el.components.stretchable.data.usePhysics)
  })
  test('component removes without errors', function (done) {
    var el = this.el
    el.removeComponent('stretchable')
    process.nextTick(function () {
      assert.notOk(el.components.stretchable)
      done()
    })
  })
  test('stretchers captured and state added/removed', function () {
    this.comp.start({ detail: { hand: this.hand1 } })
    this.comp.start({ detail: { hand: this.hand2 } })
    assert.isOk(this.el.is('stretched'))
    assert.sameMembers(this.comp.stretchers, [this.hand1, this.hand2])
    this.comp.end({detail: {hand: this.hand1}})
    assert.notOk(this.el.is('stretched'))
  })
  test('reject duplicate stretchers', function () {
    this.comp.start({ detail: { hand: this.hand1 } })
    this.comp.start({ detail: { hand: this.hand1 } })
    assert.equal(this.comp.stretchers.length, 1)
    assert.isFalse(this.el.is('stretched'))
  })
  test('ignores cancelled events', function () {
    const evtCancelled = {defaultPrevented: true, detail: {hand: this.hand}}
    const evt = {detail: {hand: {}}}
    const evt2 = {detail: {hand: this.hand}}
    this.comp.start(evt)
    this.comp.start(evtCancelled)
    assert.isFalse(this.el.is(this.comp.STRETCHED_STATE))
    this.comp.start(evt2)
    this.comp.end(evtCancelled)
    assert.isTrue(this.el.is(this.comp.STRETCHED_STATE))
  })
  test('scale updates during stretch', function () {
    const posStub1 = this.sinon.stub(this.hand1, 'getAttribute')
    const posStub2 = this.sinon.stub(this.hand2, 'getAttribute')
    var lastScale
    posStub1.withArgs('position')
      .onFirstCall().returns(coord('0 0 0'))
      .onSecondCall().returns(coord('1 1 1'))
      .onThirdCall().returns(coord('2 2 2'))
    posStub2.withArgs('position').returns(coord('-1 -1 -1'))
    this.comp.start({ detail: { hand: this.hand1 } })
    this.comp.start({ detail: { hand: this.hand2 } })
    this.comp.tick()
    assert.strictEqual(uncoord(this.el.getAttribute('scale')), '1 1 1')
    this.comp.tick()
    assert.notStrictEqual(uncoord(this.el.getAttribute('scale')), '1 1 1')
    assert.isAbove(this.el.getAttribute('scale').x, 1)
    lastScale = this.el.getAttribute('scale')
    this.comp.end({ detail: { hand: this.hand1 } })
    this.comp.tick()
    assert.strictEqual(uncoord(this.el.getAttribute('scale')), uncoord(lastScale))
  })
  test('scale updates are invertable', function () {
    const posStub1 = this.sinon.stub(this.hand1, 'getAttribute')
    const posStub2 = this.sinon.stub(this.hand2, 'getAttribute')
    var lastScale
    this.el.setAttribute('stretchable', {invert: true})
    posStub1.withArgs('position')
      .onFirstCall().returns(coord('0 0 0'))
      .onSecondCall().returns(coord('1 1 1'))
      .onThirdCall().returns(coord('2 2 2'))
    posStub2.withArgs('position').returns(coord('-1 -1 -1'))
    this.comp.start({ detail: { hand: this.hand1 } })
    this.comp.start({ detail: { hand: this.hand2 } })
    this.comp.tick()
    assert.strictEqual(uncoord(this.el.getAttribute('scale')), '1 1 1')
    this.comp.tick()
    assert.isBelow(this.el.getAttribute('scale').x, 1)
    lastScale = this.el.getAttribute('scale')
    this.comp.end({ detail: { hand: this.hand1 } })
    this.comp.tick()
    assert.strictEqual(uncoord(this.el.getAttribute('scale')), uncoord(lastScale))
  })
})

suite('stretchable-physics', function () {
  setup(function (done) {
    var el = this.el = entityFactory({}, true)
    this.hand1 = helpers
      .controllerFactory({ 'hand-controls': 'right' }, true)
    this.hand2 = helpers
      .controllerFactory({ 'hand-controls': 'left' }, true)
    el.setAttribute('stretchable', '')
    el.setAttribute('geometry', 'primitive: box')
    el.setAttribute('dynamic-body', '')
    el.addEventListener('body-loaded', evt => {
      this.comp = el.components.stretchable
      done()
    })
  })
  test('box bodies update with scaling', function () {
    const posStub1 = this.sinon.stub(this.hand1, 'getAttribute')
    const scale = new window.CANNON.Vec3()
    posStub1.withArgs('position')
      .onFirstCall().returns(coord('0 0 0'))
      .onSecondCall().returns(coord('1 1 1'))
      .onThirdCall().returns(coord('2 2 2'))
    this.comp.start({ detail: { hand: this.hand1 } })
    this.comp.start({ detail: { hand: this.hand2 } })
    this.comp.tick()
    assert.deepEqual(this.el.body.shapes[0].halfExtents,
                     scale.set(0.5, 0.5, 0.5))
    this.comp.tick()
    assert.notDeepEqual(this.el.body.shapes[0].halfExtents,
                        scale.set(0.5, 0.5, 0.5))
  })
  test('box bodies do not update when usePhysics = never', function () {
    const posStub1 = this.sinon.stub(this.hand1, 'getAttribute')
    const scale = new window.CANNON.Vec3()
    posStub1.withArgs('position')
      .onFirstCall().returns(coord('0 0 0'))
      .onSecondCall().returns(coord('1 1 1'))
      .onThirdCall().returns(coord('2 2 2'))
    this.el.setAttribute('stretchable', 'usePhysics: never')
    this.comp.start({ detail: { hand: this.hand1 } })
    this.comp.start({ detail: { hand: this.hand2 } })
    assert.ok(this.el.is('stretched'))
    this.comp.tick()
    assert.deepEqual(this.el.body.shapes[0].halfExtents,
                     scale.set(0.5, 0.5, 0.5))
    this.comp.tick()
    assert.deepEqual(this.el.body.shapes[0].halfExtents,
                        scale.set(0.5, 0.5, 0.5))
  })
})
suite('stretchable button mapping', function () {
  setup(function (done) {
    var el = this.el = entityFactory()
    this.hand = helpers.controllerFactory({'super-hands': ''})
    el.setAttribute('stretchable',
        'startButtons: triggerdown; endButtons: triggerup')
    el.addEventListener('loaded', () => {
      this.comp = el.components.stretchable
      done()
    })
  })
  test('responds to correct buttons', function () {
    const dtl = {hand: this.hand, buttonEvent: {type: 'gripdown'}}
    // reject wrong button start
    assert.isOk(helpers.emitCancelable(this.el, this.comp.STRETCH_EVENT, dtl))
    assert.notStrictEqual(this.comp.stretchers[0], this.hand)
    // accept correct button start
    dtl.buttonEvent.type = 'triggerdown'
    assert.isNotOk(helpers.emitCancelable(this.el, this.comp.STRETCH_EVENT, dtl))
    assert.strictEqual(this.comp.stretchers[0], this.hand)
    // reject wrong button end
    assert.isOk(helpers.emitCancelable(this.el, this.comp.UNSTRETCH_EVENT, dtl))
    assert.strictEqual(this.comp.stretchers[0], this.hand)
    // accpect correct button end
    dtl.buttonEvent.type = 'triggerup'
    assert.isNotOk(helpers.emitCancelable(this.el, this.comp.UNSTRETCH_EVENT, dtl))
    assert.notStrictEqual(this.comp.stretchers[0], this.hand)
  })
})
