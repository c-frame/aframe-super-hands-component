/* global assert, process, setup, suite, test */
const helpers = require('../helpers')
const entityFactory = helpers.entityFactory
suite('clickable-lifecycle', function () {
  setup(function (done) {
    const el = this.el = entityFactory()
    el.setAttribute('clickable', '')
    el.addEventListener('loaded', function () {
      done()
    })
  })
  test('component attaches without errors', function () {
    assert.isOk(this.el.components.clickable)
  })
  test('component removes without errors', function (done) {
    const el = this.el
    el.removeAttribute('clickable')
    process.nextTick(function () {
      assert.notOk(el.components.grabbable)
      done()
    })
  })
})
suite('clickable function', function () {
  setup(function (done) {
    const el = this.el = entityFactory()
    el.setAttribute('clickable', '')
    this.hand = helpers.controllerFactory()
    this.hand2 = helpers.controllerFactory({ 'vive-controls': 'hand: left' }, true)
    el.sceneEl.addEventListener('loaded', () => {
      this.clicker = el.components.clickable
      done()
    })
  })
  test('gains and loses clicked state', function () {
    assert.isFalse(this.el.is(this.clicker.CLICKED_STATE))
    assert.equal(this.clicker.clickers.length, 0)
    this.clicker.start({ detail: { hand: this.hand } })
    assert.isTrue(this.el.is(this.clicker.CLICKED_STATE))
    assert.equal(this.clicker.clickers.length, 1)
    this.clicker.end({ detail: { hand: this.hand } })
    assert.isFalse(this.el.is(this.clicker.CLICKED_STATE))
    assert.equal(this.clicker.clickers.length, 0)
  })
  test('handles multiple clickers', function () {
    const hand2 = {}
    this.clicker.start({ detail: { hand: this.hand } })
    this.clicker.start({ detail: { hand: hand2 } })
    assert.sameMembers(this.clicker.clickers, [this.hand, hand2])
    assert.isTrue(this.el.is(this.clicker.CLICKED_STATE))
    this.clicker.end({ detail: { hand: this.hand } })
    assert.sameMembers(this.clicker.clickers, [hand2])
    assert.isTrue(this.el.is(this.clicker.CLICKED_STATE))
    this.clicker.end({ detail: { hand: hand2 } })
    assert.strictEqual(this.clicker.clickers.length, 0)
    assert.isFalse(this.el.is(this.clicker.CLICKED_STATE))
  })
  test('ignores cancelled events', function () {
    const evtCancelled = { defaultPrevented: true, detail: { hand: this.hand } }
    const evt = { detail: { hand: this.hand } }
    this.clicker.start(evtCancelled)
    assert.isFalse(this.el.is(this.clicker.CLICKED_STATE))
    this.clicker.start(evt)
    this.clicker.end(evtCancelled)
    assert.isTrue(this.el.is(this.clicker.CLICKED_STATE))
  })
})
suite('clickable button mapping', function () {
  setup(function (done) {
    const el = this.el = entityFactory()
    this.hand = helpers.controllerFactory({ 'super-hands': '' })
    el.setAttribute('clickable',
      'startButtons: triggerdown; endButtons: triggerup')
    el.addEventListener('loaded', () => {
      this.comp = el.components.clickable
      done()
    })
  })
  test('responds to correct buttons', function () {
    const dtl = { hand: this.hand, buttonEvent: { type: 'gripdown' } }
    // reject wrong button start
    assert.isOk(helpers.emitCancelable(this.el, this.comp.CLICK_EVENT, dtl))
    assert.notStrictEqual(this.comp.clickers[0], this.hand)
    assert.isNotOk(this.el.is(this.comp.CLICKED_STATE))
    // accept correct button start
    dtl.buttonEvent.type = 'triggerdown'
    assert.isNotOk(helpers.emitCancelable(this.el, this.comp.CLICK_EVENT, dtl))
    assert.strictEqual(this.comp.clickers[0], this.hand)
    assert.isOk(this.el.is(this.comp.CLICKED_STATE))
    // reject wrong button end
    assert.isOk(helpers.emitCancelable(this.el, this.comp.UNCLICK_EVENT, dtl))
    assert.strictEqual(this.comp.clickers[0], this.hand)
    assert.isOk(this.el.is(this.comp.CLICKED_STATE))
    // accpect correct button end
    dtl.buttonEvent.type = 'triggerup'
    assert.isNotOk(helpers.emitCancelable(this.el, this.comp.UNCLICK_EVENT, dtl))
    assert.notStrictEqual(this.comp.clickers[0], this.hand)
    assert.isNotOk(this.el.is(this.comp.CLICKED_STATE))
  })
})
