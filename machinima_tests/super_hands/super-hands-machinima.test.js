/* global assert, process, setup, suite, test */

var helpers = require('../helpers'), 
    entityFactory = helpers.entityFactory;

suite('super-hands lifecycle', function () {
  setup(function (done) {
    var el = this.el = entityFactory();
    el.setAttribute('super-hands', '');
    el.addEventListener('loaded', function () {
      done();
    });
  });
  test('component attaches without errors', function () {
    assert.isOk(this.el.components['super-hands'].data);
    assert.equal(this.el.components['super-hands'].data.colliderState, 
                 'collided');
  });
  test('component removes without errors', function (done) {
    var el = this.el;
    el.removeComponent('super-hands');
    process.nextTick(function () {
      assert.notOk(el.components['super-hands']);
      done();
    });
  });
});