/* global assert, process, setup, suite, test */

var helpers = require('../helpers'),
    entityFactory = helpers.entityFactory;

suite('hoverable', function () {
  setup(function (done) {
    var el = this.el = entityFactory();
    this.hand = helpers.controllerFactory();
    el.setAttribute('hoverable', '');
    el.addEventListener('loaded', evt => {
      this.comp = el.components.hoverable;
      done();
    });
  });
  test('component attaches without errors', function () {
    assert.isOk(this.el.components.hoverable);
  });
  test('component removes without errors', function (done) {
    var el = this.el;
    el.removeComponent('hoverable');
    process.nextTick(function () {
      assert.notOk(el.components.hoverable);
      done();
    });
  });
  test('el gains and loses hovered state', function () {
    this.comp.start({ detail: { hand: this.hand } });
    assert.isOk(this.el.is('hovered'));
    this.comp.end({ detail: { hand: this.hand } });
    assert.notOk(this.el.is('hovered'));
  });
  test('state consistent through hoverer overlap', function () {
    var h2 = helpers
      .controllerFactory( { 'vive-controls': 'hand: left' }, true);
    this.comp.start({ detail: { hand: this.hand } });
    this.comp.start({ detail: { hand: h2 } });
    assert.isOk(this.el.is('hovered'));
    this.comp.end({ detail: { hand: this.hand } });
    assert.isOk(this.el.is('hovered'));
    this.comp.end({ detail: { hand: h2 } });
    assert.notOk(this.el.is('hovered'));
  })
});
//GlobalEventHandlers: mouseover mouseout
suite('GlobalEventHandler integrations', function () {
  setup(function (done) {
    var el = this.el = entityFactory();
    this.hand = helpers.controllerFactory();
    el.setAttribute('hoverable', '');
    el.addEventListener('loaded', evt => {
      this.comp = el.components.hoverable;
      done();
    });
  });
  test('integration with onmouseover', function (done) {
    this.el.onmouseover = e => {
      assert.typeOf(e, 'MouseEvent');
      assert.strictEqual(e.target, this.el);
      assert.strictEqual(e.relatedTarget, this.hand);
      done();
    }
    this.comp.start({ detail: { hand: this.hand } });
  });
  test('integration with onmouseout', function (done) {
    this.el.onmouseout = e => {
      assert.typeOf(e, 'MouseEvent');
      assert.strictEqual(e.target, this.el);
      assert.strictEqual(e.relatedTarget, this.hand);
      done();
    }
    this.comp.start({ detail: { hand: this.hand } });
    this.comp.end({ detail: { hand: this.hand } });
  });
});
