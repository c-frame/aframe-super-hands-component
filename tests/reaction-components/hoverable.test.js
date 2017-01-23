/* global assert, process, setup, suite, test */

var entityFactory = require('../helpers').entityFactory;

suite('hoverable', function () {
  setup(function (done) {
    var el = this.el = entityFactory();
    el.setAttribute('hoverable', '');
    el.addEventListener('loaded', function () {
      done();
    });
  });
  test('component attaches without errors', function () {
    assert.isOk(this.el.components.hoverable);
  });
  test('component removes without errors', function () {
    var el = this.el;
    el.removeComponent('hoverable');
    process.nextTick(function () {
      assert.notOk(el.components.hoverable);
      done();
    });
  });
});
