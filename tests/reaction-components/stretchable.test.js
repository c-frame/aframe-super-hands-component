/* global assert, process, setup, suite, test */

var entityFactory = require('../helpers').entityFactory;

suite('stretchable', function () {
  setup(function (done) {
    var el = this.el = entityFactory();
    el.setAttribute('stretchable', '');
    el.addEventListener('loaded', function () {
      done();
    });
  });
  test('component attaches without errors', function () {
    assert.isOk(this.el.components.stretchable.data.usePhysics);
  });
  test('component removes without errors', function () {
    var el = this.el;
    el.removeComponent('stretchable');
    process.nextTick(function () {
      assert.notOk(el.components.stretchable);
      done();
    });
  });
});
