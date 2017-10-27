/* global assert, process, setup, suite, test */
const helpers = require('../helpers');
const entityFactory = helpers.entityFactory;

suite('progressive-controls', function () {
  suite('defaults', function () {
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
    test('extra controller not activated', function () {
      this.el.emit('controllerconnected', {name: 'gearvr-controls', component: {
        data: {}
      }});
      assert.isOk(document.querySelector('.right-controller').getAttribute('line'));
      assert.isNotOk(document.querySelector('.left-controller').getAttribute('line'));
    });
  });
  suite('mixin properties', function () {
    setup(function (done) {
      var el = this.el = entityFactory();
      helpers.mixinFactory('gz1', {geometry: 'primitive: circle'});
      helpers.mixinFactory('pt1', {line: 'color: orange'});
      helpers.mixinFactory('tch1', {'super-hands': 'colliderEvent: fakeevent'});
      el.setAttribute('progressive-controls', 'gazeMixin: gz1; pointMixin: pt1; touchMixin: tch1');
      el.sceneEl.addEventListener('loaded', evt => {
        this.comp = el.components['progressive-controls'];
        done();
      });
    });
    test('mixin properties', function () {
      assert.strictEqual(this.comp.caster.getAttribute('geometry').primitive, 'circle');
      this.comp.setLevel(1, 'right');
      assert.strictEqual(this.comp.right.getAttribute('line').color, 'orange');
      this.comp.setLevel(2, 'right');
      assert.strictEqual(this.comp.right.getAttribute('super-hands').colliderEvent, 'fakeevent');
    });
  });
});
