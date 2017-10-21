/* global assert, process, setup, suite, test */
const helpers = require('../helpers');
const entityFactory = helpers.entityFactory;

suite('drop-target', function () {
  setup(function (done) {
    var el = this.el = entityFactory();
    el.setAttribute('drop-target', '');
    this.carried1 = document.createElement('a-entity');
    this.carried1.id = 'carried1';
    el.sceneEl.appendChild(this.carried1);
    this.carried2 = document.createElement('a-entity');
    this.carried2.classList.add('carried2');
    el.sceneEl.appendChild(this.carried2);
    el.addEventListener('loaded', evt => {
      this.comp = el.components['drop-target'];
      done();
    });
  });
  suite('lifecycle', function () {
    test('component attaches without errors', function () {
      assert.isOk(this.el.components['drop-target']);
    });
    test('component removes without errors', function (done) {
      var el = this.el;
      el.removeComponent('drop-target');
      process.nextTick(function () {
        assert.notOk(el.components['drop-target']);
        done();
      });
    });
  });
  suite('state', function () {
    test('el gains and loses dragover state', function () {
      this.el.emit('dragover-start', { hand: this.hand });
      assert.isTrue(this.el.is('dragover'));
      this.el.emit('dragover-end', { hand: this.hand });
      assert.isFalse(this.el.is('dragover'));
    });
  });
  suite('discrimination', function () {
    test('dragover accepts listed entities', function () {
      const detail = {carried: this.carried1};
      this.el.setAttribute('drop-target', {accepts: '.carried2, #carried1'});
      assert.isFalse(helpers.emitCancelable(this.el, 'dragover-start', detail));
      assert.isTrue(this.el.is('dragover'));
    });
    test('dragover rejects unlisted entities', function () {
      const detail = {carried: this.carried2};
      this.el.setAttribute('drop-target', {accepts: '#carried1'});
      assert.isTrue(helpers.emitCancelable(this.el, 'dragover-start', detail));
      assert.isFalse(this.el.is('dragover'));
    });
    test('dragdrop accepts listed entities', function () {
      const detail = {carried: this.carried2};
      this.el.setAttribute('drop-target', {accepts: '.carried2, #carried1'});
      assert.isFalse(helpers.emitCancelable(this.el, 'drag-drop', detail));
    });
    test('dragdrop rejects unlisted entities', function () {
      const detail = {carried: this.carried1};
      this.el.setAttribute('drop-target', {accepts: '.carried2'});
      assert.isTrue(helpers.emitCancelable(this.el, 'drag-drop', detail));
    });
  });
  suite('accept/reject events', function () {
    test('accept event fired', function () {
      const acceptEvent = 'accepted!';
      const rejectEvent = 'denied!';
      const detail = {carried: this.carried2};
      const rejectSpy = this.sinon.spy();
      const acceptSpy = this.sinon.spy();
      this.el.addEventListener(rejectEvent, rejectSpy);
      this.el.addEventListener(acceptEvent, acceptSpy);
      this.el.setAttribute('drop-target', {
        accepts: '.carried2, #carried1',
        acceptEvent: acceptEvent,
        rejectEvent: rejectEvent
      });
      helpers.emitCancelable(this.el, 'drag-drop', detail);
      assert.isTrue(acceptSpy.calledWithMatch({
        type: acceptEvent,
        detail: {el: this.carried2}
      }), 'accept event called');
      assert.isFalse(rejectSpy.called, 'reject event not called');
    });
    test('reject event fired', function () {
      const acceptEvent = 'accepted!';
      const rejectEvent = 'denied!';
      const detail = {carried: this.carried2};
      const rejectSpy = this.sinon.spy();
      const acceptSpy = this.sinon.spy();
      this.el.addEventListener(rejectEvent, rejectSpy);
      this.el.addEventListener(acceptEvent, acceptSpy);
      this.el.setAttribute('drop-target', {
        accepts: '#carried1',
        acceptEvent: acceptEvent,
        rejectEvent: rejectEvent
      });
      helpers.emitCancelable(this.el, 'drag-drop', detail);
      assert.isTrue(rejectSpy.calledWithMatch({
        type: rejectEvent,
        detail: {el: this.carried2}
      }), 'reject event fired');
      assert.isFalse(acceptSpy.called, 'accept event not fired');
    });
  });
});
