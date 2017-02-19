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

suite('super-hands hit processing & event emission', function () {
  setup(function (done) {
    this.target1 = entityFactory();
    this.target2 = document.createElement('a-entity');
    this.target1.parentNode.appendChild(this.target2);
    this.hand1 = helpers.controllerFactory({
      'super-hands': ''
    });
    this.hand2 = helpers.controllerFactory({
      'vive-controls': 'hand: left',
      'super-hands': ''
    }, true);
    this.hand1.parentNode.addEventListener('loaded', () => {
      this.sh1 = this.hand1.components['super-hands'];
      this.sh2 = this.hand2.components['super-hands'];
      done();
    });
  });
  test('hover event', function (done) {
    this.target1.addEventListener('hover-start', evt => {
      assert.strictEqual(evt.detail.hand, this.hand1);
      assert.includeMembers(this.sh1.hoverEls, [this.target1]);
      done();
    });
    this.sh1.onHit({ detail: { el: this.target1 } });
  });
  test('unhover event', function (done) {
    this.sh1.onHit({ detail: { el: this.target1 } });
    this.target1.addEventListener('hover-end', evt => {
      assert.strictEqual(evt.detail.hand, this.hand1);
      assert.strictEqual(this.sh1.hoverEls.indexOf(this.target1), -1);
      done();
    });
    this.sh1.useHoveredEl();
  });
  test('stacking hovered entities', function () {
    this.sh1.onHit({ detail: { el: this.target1 } });
    this.sh1.onHit({ detail: { el: this.target2 } });
    assert.equal(this.sh1.hoverEls.length, 2);
    assert.strictEqual(this.sh1.useHoveredEl(), this.target1);
    assert.equal(this.sh1.hoverEls.length, 1);
    assert.strictEqual(this.sh1.useHoveredEl(), this.target2);
    assert.equal(this.sh1.hoverEls.length, 0);
  });
  test('grab event', function (done) {
    this.sh1.onGrabStartButton();
    this.target1.addEventListener('grab-start', evt => {
      assert.strictEqual(evt.detail.hand, this.hand1);
      assert.strictEqual(this.sh1.carried, this.target1);
      done();
    });
    this.sh1.onHit({ detail: { el: this.target1 } });
  });
  test('ungrab event', function (done) {
    this.sh1.onGrabStartButton();
    this.target1.addEventListener('grab-end', evt => {
      assert.strictEqual(evt.detail.hand, this.hand1);
      process.nextTick(() => {
        assert.isNotOk(this.sh1.carried);
        assert.isFalse(this.sh1.grabbing);
        done();
      });
    });
    this.sh1.onHit({ detail: { el: this.target1 } });
    this.sh1.onGrabEndButton({});
  });
  test('finds other controller', function() {
    assert.isOk(this.sh1.otherController);
    assert.isOk(this.sh2.otherController);
    assert.strictEqual(this.sh1.otherController, this.hand2);
    assert.strictEqual(this.sh2.otherController, this.hand1);
  });
  test('stretch event', function () {
    var emitSpy = sinon.spy(this.target1, 'emit'),
        stretchSpy = emitSpy.withArgs('stretch-start'),
        unStretchSpy = emitSpy.withArgs('stretch-end');
    this.sh1.onStretchStartButton();  
    this.sh1.onHit({ detail: { el: this.target1 } });
    assert.isTrue(this.sh1.stretching);
    assert.strictEqual(this.sh1.stretched, this.target1);
    assert.isFalse(stretchSpy.called);
    this.sh2.onStretchStartButton();
    this.sh2.onHit({ detail: { el: this.target1 } });
    assert.isTrue(this.sh2.stretching);
    assert.strictEqual(this.sh2.stretched, this.target1);
    assert.isTrue(stretchSpy.called);
    assert.isFalse(unStretchSpy.called);
    this.sh1.onStretchEndButton();
    console.log('unstretch count', unStretchSpy.callCount, unStretchSpy.called);
    assert.isTrue(unStretchSpy.called);
    assert.isNotOk(this.sh1.stretching);
    assert.strictEqual(this.sh2.stretched, this.target1);
    this.sh2.onStretchEndButton();
    assert.isTrue(unStretchSpy.calledOnce);
    assert.isNotOk(this.sh2.stretching);
    
  });
});