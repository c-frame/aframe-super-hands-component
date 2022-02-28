/* global assert, process, setup, suite, test */
const helpers = require('../helpers')
const entityFactory = helpers.entityFactory

suite('draggable', function () {
  setup(function (done) {
    const el = this.el = entityFactory()
    el.setAttribute('draggable', '')
    el.addEventListener('loaded', evt => {
      this.comp = el.components.draggable
      done()
    })
  })
  test('component attaches without errors', function () {
    assert.isOk(this.el.components.draggable)
  })
  test('component removes without errors', function (done) {
    const el = this.el
    el.removeAttribute('draggable')
    process.nextTick(function () {
      assert.notOk(el.components.draggable)
      done()
    })
  })
  test('el gains and loses dragged state', function () {
    this.el.emit('drag-start', { hand: this.hand })
    assert.isTrue(this.el.is('dragged'))
    this.el.emit('drag-end', { hand: this.hand })
    assert.isFalse(this.el.is('dragged'))
  })
  test('ignores cancelled events', function () {
    const evtCancelled = { defaultPrevented: true, detail: { hand: this.hand } }
    const evt = { detail: { hand: this.hand } }
    this.comp.dragStart(evtCancelled)
    assert.isFalse(this.el.is(this.comp.DRAGGED_STATE))
    this.comp.dragStart(evt)
    this.comp.dragEnd(evtCancelled)
    assert.isTrue(this.el.is(this.comp.DRAGGED_STATE))
  })
})
suite('draggable button mapping', function () {
  setup(function (done) {
    const el = this.el = entityFactory()
    this.hand = helpers.controllerFactory({ 'super-hands': '' })
    el.setAttribute('draggable',
      'startButtons: triggerdown; endButtons: triggerup')
    el.addEventListener('loaded', () => {
      this.comp = el.components.draggable
      done()
    })
  })
  test('responds to correct buttons', function () {
    const dtl = { hand: this.hand, buttonEvent: { type: 'gripdown' } }
    // reject wrong button start
    assert.isOk(helpers.emitCancelable(this.el, this.comp.DRAG_EVENT, dtl))
    assert.isNotOk(this.el.is(this.comp.DRAGGED_STATE))
    // accept correct button start
    dtl.buttonEvent.type = 'triggerdown'
    assert.isNotOk(helpers.emitCancelable(this.el, this.comp.DRAG_EVENT, dtl))
    assert.isOk(this.el.is(this.comp.DRAGGED_STATE))
    // reject wrong button end
    assert.isOk(helpers.emitCancelable(this.el, this.comp.UNDRAG_EVENT, dtl))
    assert.isOk(this.el.is(this.comp.DRAGGED_STATE))
    // accpect correct button end
    dtl.buttonEvent.type = 'triggerup'
    assert.isNotOk(helpers.emitCancelable(this.el, this.comp.UNDRAG_EVENT, dtl))
    assert.isNotOk(this.el.is(this.comp.DRAGGED_STATE))
  })
})
