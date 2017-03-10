/* global assert, process, setup, suite, test */
var helpers = require('../helpers'),
    entityFactory = helpers.entityFactory,
    coord = AFRAME.utils.coordinates.parse;
suite('clickable-lifecycle', function () {
  setup(function (done) {
    var el = this.el = entityFactory();
    el.setAttribute('clickable', '');
    el.addEventListener('loaded', function () {
      done();
    });
  });
  test('component attaches without errors', function () {
    assert.isOk(this.el.components.clickable);
  });
  test('component removes without errors', function (done) {
    var el = this.el;
    el.removeComponent('clickable');
    process.nextTick(function () {
      assert.notOk(el.components.grabbable);
      done();
    });
  });
});
suite('clickable function', function () {
  setup(function (done) {
    var el = this.el = entityFactory();
    el.setAttribute('clickable', '');
    this.hand = helpers.controllerFactory();
    this.hand2 = helpers.controllerFactory({ 'vive-controls': 'hand: left' }, true);
    el.sceneEl.addEventListener('loaded', () => {
      this.clicker = el.components.clickable;
      done();
    });
  });
  test('gains and loses clicked state', function () {
    assert.isFalse(this.el.is(this.clicker.CLICKED_STATE));
    assert.equal(this.clicker.clickers.length, 0);
    this.clicker.start({ detail: { hand: this.hand } });
    assert.isTrue(this.el.is(this.clicker.CLICKED_STATE));
    assert.equal(this.clicker.clickers.length, 1);
    this.clicker.end({ detail: { hand: this.hand } });
    assert.isFalse(this.el.is(this.clicker.CLICKED_STATE));
    assert.equal(this.clicker.clickers.length, 0);
  });
  test('handles multiple clickers', function () {
    
  });

});

suite('clickable GlobelEventHandler integration', function () {
  setup(function (done) {
    var el = this.el = entityFactory();
    el.setAttribute('clickable', '');
    this.hand = helpers.controllerFactory();
    //this.hand2 = helpers.controllerFactory({ 'vive-controls': 'hand: left' }, true);
    el.sceneEl.addEventListener('loaded', () => {
      this.clicker = el.components.clickable;
      done();
    });
  });
  test('integrates with GlobalEventHandler onmousedown', function (done) {
    this.el.onmousedown = e => {
      assert.typeOf(e, 'MouseEvent');
      assert.strictEqual(e.target, this.el);
      assert.strictEqual(e.relatedTarget, this.hand);
      done();
    };
    this.clicker.start({ detail: { hand: this.hand } });
  });
  test('integrates with GlobalEventHandler onmouseup', function (done) {
    this.el.onmouseup = e => {
      assert.typeOf(e, 'MouseEvent');
      assert.strictEqual(e.target, this.el);
      assert.strictEqual(e.relatedTarget, this.hand);
      done();
    };
    this.clicker.end({ detail: { hand: this.hand } });
  });
  test('integrates with GlobalEventHandler onclick', function (done) {
    this.el.onclick = e => {
      assert.typeOf(e, 'MouseEvent');
      assert.strictEqual(e.target, this.el);
      assert.strictEqual(e.relatedTarget, this.hand);
      done();
    };
    this.clicker.start({ detail: { hand: this.hand } });
    this.clicker.end({ detail: { hand: this.hand } });
  });
});
