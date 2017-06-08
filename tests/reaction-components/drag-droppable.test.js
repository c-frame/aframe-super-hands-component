/* global assert, process, setup, suite, test */

var entityFactory = require('../helpers').entityFactory;

suite('drag-droppable', function () {
  setup(function (done) {
    var el = this.el = entityFactory();
    el.setAttribute('drag-droppable', '');
    el.addEventListener('loaded', evt => {
      this.comp = el.components['drag-droppable'];
      done();
    });
  });
  test('component attaches without errors', function () {
    assert.isOk(this.el.components['drag-droppable']);
  });
  test('component removes without errors', function (done) {
    var el = this.el;
    el.removeComponent('drag-droppable');
    process.nextTick(function () {
      assert.notOk(el.components['drag-droppable']);
      done();
    });
  });
  test('el gains and loses dragover state', function () {
    this.el.emit('dragover-start', { hand: this.hand });
    assert.isTrue(this.el.is('dragover'));
    this.el.emit('dragover-end', { hand: this.hand });
    assert.isFalse(this.el.is('dragover'));
  });
  test('el gains and loses dragged state', function () {
    this.el.emit('drag-start', { hand: this.hand });
    assert.isTrue(this.el.is('dragged'));
    this.el.emit('drag-end', { hand: this.hand });
    assert.isFalse(this.el.is('dragged'));
  });
});
