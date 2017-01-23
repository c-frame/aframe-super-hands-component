/* global assert, process, setup, suite, test */

var entityFactory = require('../helpers').entityFactory;

suite('drag-droppable', function () {
  setup(function (done) {
    var el = this.el = entityFactory();
    el.setAttribute('drag-droppable', '');
    el.addEventListener('loaded', function () {
      done();
    });
  });
  test('component attaches without errors', function () {
    assert.isOk(this.el.components['drag-droppable']);
  });
  test('component removes without errors', function () {
    var el = this.el;
    el.removeComponent('drag-droppable');
    process.nextTick(function () {
      assert.notOk(el.components['drag-droppable']);
      done();
    });
  });
});
