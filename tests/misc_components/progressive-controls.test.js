/* global assert, process, setup, suite, test */
const helpers = require('../helpers');
const entityFactory = helpers.entityFactory;

suite('progressive-controls', function () {
  setup(function (done) {
    var el = this.el = entityFactory();
    el.setAttribute('progressive-controls', '');
    el.sceneEl.addEventListener('loaded', evt => {
      this.comp = el.components['progressive-controls'];
      done();
    });
  });
  test('component attaches without errors', function () {
    assert.isOk(this.comp);
  });
  test('component removes without errors', function (done) {
    var el = this.el;
    el.removeComponent('progressive-controls');
    process.nextTick(function () {
      assert.notOk(el.components['progressive-controls']);
      done();
    });
  });
});
