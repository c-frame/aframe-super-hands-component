/* global assert, process, setup, suite, test */
const helpers = require('../helpers')
const entityFactory = helpers.entityFactory

suite('droppable', function () {
  setup(function (done) {
    const el = this.el = entityFactory()
    el.setAttribute('droppable', '')
    this.carried1 = document.createElement('a-entity')
    this.carried1.id = 'carried1'
    el.sceneEl.appendChild(this.carried1)
    this.carried2 = document.createElement('a-entity')
    this.carried2.classList.add('carried2')
    el.sceneEl.appendChild(this.carried2)
    el.addEventListener('loaded', evt => {
      this.comp = el.components.droppable
      done()
    })
  })
  suite('lifecycle', function () {
    test('component attaches without errors', function () {
      assert.isOk(this.el.components.droppable)
    })
    test('component removes without errors', function (done) {
      const el = this.el
      el.removeAttribute('droppable')
      process.nextTick(function () {
        assert.notOk(el.components.droppable)
        done()
      })
    })
  })
  suite('state', function () {
    test('el gains and loses dragover state', function () {
      this.el.emit('dragover-start', { hand: this.hand })
      assert.isTrue(this.el.is('dragover'))
      this.el.emit('dragover-end', { hand: this.hand })
      assert.isFalse(this.el.is('dragover'))
    })
    test('ignores cancelled events', function () {
      const evtCancelled = { defaultPrevented: true, detail: { carried: this.carried1 } }
      const evt = { detail: { carried: this.carried1 } }
      this.comp.hoverStart(evtCancelled)
      assert.isFalse(this.el.is(this.comp.HOVERED_STATE))
      this.comp.hoverStart(evt)
      this.comp.hoverEnd(evtCancelled)
      assert.isTrue(this.el.is(this.comp.HOVERED_STATE))

      this.comp.data.acceptEvents = 'test2'
      const dropSpy = this.sinon.spy()
      this.el.addEventListener('test2', dropSpy)
      this.comp.dragDrop(evtCancelled)
      assert.isFalse(dropSpy.called)
    })
  })
  suite('discrimination', function () {
    test('dragover accepts listed entities', function () {
      const detail = { carried: this.carried1 }
      this.el.setAttribute('droppable', { accepts: '.carried2, #carried1' })
      assert.isFalse(helpers.emitCancelable(this.el, 'dragover-start', detail))
      assert.isTrue(this.el.is('dragover'))
    })
    test('dragover rejects unlisted entities', function () {
      const detail = { carried: this.carried2 }
      this.el.setAttribute('droppable', { accepts: '#carried1' })
      assert.isTrue(helpers.emitCancelable(this.el, 'dragover-start', detail))
      assert.isFalse(this.el.is('dragover'))
    })
    test('dragdrop accepts listed entities', function () {
      const detail = { dropped: this.carried2 }
      this.el.setAttribute('droppable', { accepts: '.carried2, #carried1' })
      assert.isFalse(helpers.emitCancelable(this.el, 'drag-drop', detail))
    })
    test('dragdrop rejects unlisted entities', function () {
      const detail = { dropped: this.carried1 }
      this.el.setAttribute('droppable', { accepts: '.carried2' })
      assert.isTrue(helpers.emitCancelable(this.el, 'drag-drop', detail))
    })
    test('dragdrop rejects all if no matches', function () {
      const detail = { dropped: this.carried1 }
      this.el.setAttribute('droppable', { accepts: '.nomatches' })
      assert.isTrue(helpers.emitCancelable(this.el, 'drag-drop', detail))
    })
    test('dragdrop accepts newly added entities', function (done) {
      this.el.setAttribute('droppable', { accepts: '.carried2, #carried1' })
      const newEntity = document.createElement('a-entity')
      newEntity.classList.add('carried2')
      newEntity.addEventListener('loaded', () => {
        const detail = { dropped: newEntity }
        assert.isFalse(helpers.emitCancelable(this.el, 'drag-drop', detail))
        done()
      })
      this.el.sceneEl.appendChild(newEntity)
    })
  })
  suite('accept/reject events', function () {
    test('accept event fired', function () {
      const acceptEvent = 'accepted!'
      const rejectEvent = 'denied!'
      const detail = { dropped: this.carried2 }
      const rejectSpy = this.sinon.spy()
      const acceptSpy = this.sinon.spy()
      this.el.addEventListener(rejectEvent, rejectSpy)
      this.el.addEventListener(acceptEvent, acceptSpy)
      this.el.setAttribute('droppable', {
        accepts: '.carried2, #carried1',
        acceptEvent,
        rejectEvent
      })
      helpers.emitCancelable(this.el, 'drag-drop', detail)
      assert.isTrue(acceptSpy.calledWithMatch({
        type: acceptEvent,
        detail: { el: this.carried2 }
      }), 'accept event called')
      assert.isFalse(rejectSpy.called, 'reject event not called')
    })
    test('reject event fired', function () {
      const acceptEvent = 'accepted!'
      const rejectEvent = 'denied!'
      const detail = { dropped: this.carried2 }
      const rejectSpy = this.sinon.spy()
      const acceptSpy = this.sinon.spy()
      this.el.addEventListener(rejectEvent, rejectSpy)
      this.el.addEventListener(acceptEvent, acceptSpy)
      this.el.setAttribute('droppable', {
        accepts: '#carried1',
        acceptEvent,
        rejectEvent
      })
      helpers.emitCancelable(this.el, 'drag-drop', detail)
      assert.isTrue(rejectSpy.calledWithMatch({
        type: rejectEvent,
        detail: { el: this.carried2 }
      }), 'reject event fired')
      assert.isFalse(acceptSpy.called, 'accept event not fired')
    })
  })
})
