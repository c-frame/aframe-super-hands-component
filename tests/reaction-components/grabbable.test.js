/* global assert, process, setup, suite, test */

var entityFactory = require('../helpers').entityFactory; 

suite('grabbable', function () {
  setup(function (done) {
    var el = this.el = entityFactory();
    el.setAttribute('grabbable', '');
    el.addEventListener('loaded', function () {
      done();
    });
  });
  test('component attaches without errors', function () {
    assert.isOk(this.el.components.grabbable.data.usePhysics);
  });
  test('component removes without errors', function () {
    var el = this.el;
    el.removeComponent('grabbable');
    process.nextTick(function () {
      assert.notOk(el.components.grabbable);
      done();
    });
  });
});
