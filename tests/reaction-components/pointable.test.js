/* global assert, process, setup, suite, test */
const helpers = require('../helpers');
const entityFactory = helpers.entityFactory;
suite('pointable-lifecycle', function () {
  setup(function (done) {
    var el = this.el = entityFactory();
    el.setAttribute('pointable', '');
    el.addEventListener('loaded', function () {
      done();
    });
  });
  test('component attaches without errors', function () {
    assert.isOk(this.el.components.pointable);
  });
  test('component removes without errors', function (done) {
    var el = this.el;
    el.removeComponent('pointable');
    process.nextTick(function () {
      assert.notOk(el.components.pointable);
      done();
    });
  });
});

suite('pointable-function', function () {
  setup(function (done) {
    var el = this.el = entityFactory();
    el.setAttribute('pointable', '');
    this.hand = helpers.controllerFactory();
    el.parentNode.addEventListener('loaded', function () {
      done();
    });
  });
  test('initiates grab on event when not grabbed', function () {
    const myPointable = this.el.components.pointable;
    const hand = this.hand;
    const el = this.el;
    assert.isNotOk(myPointable.grabbed);
    assert.notStrictEqual(myPointable.grabber, this.hand);
    assert.isNotOk(this.el.is(myPointable.GRABBED_STATE));
    myPointable.start({detail: {hand: this.hand}});
    assert.isOk(myPointable.grabbed);
    assert.isOk(myPointable.grabber);
    assert.strictEqual(myPointable.grabber, hand);
    assert.isOk(el.is(myPointable.GRABBED_STATE));
  });
  test('grabbing from a second hand does not change grabber', function () {
    const myPointable = this.el.components.pointable;
    const secondHand = {object3D: {}};
    myPointable.start({detail: {hand: this.hand}});
    myPointable.start({detail: {hand: secondHand}});
    assert.strictEqual(myPointable.grabber, this.hand);
  });
});

suite('pointable-function with physics', function () {
  setup(function (done) {
    var el = this.el = entityFactory();
    this.hand = helpers.controllerFactory({
      'static-body': '',
      geometry: 'primitive: sphere'
    });
    el.setAttribute('pointable', '');
    el.setAttribute('geometry', 'primitive: box');
    el.setAttribute('dynamic-body', '');
    el.addEventListener('body-loaded', evt => {
      this.comp = el.components.pointable;
      if (!this.hand.body) {
        this.hand.addEventListener('body-loaded', evt => done());
      } else {
        done();
      }
    });
  });
  test('constraint registered on grab', function () {
    this.comp.start({ detail: { hand: this.hand } });
    let c = this.comp.constraints.get(this.hand);
    assert.isOk(c);
    assert.instanceOf(c, window.CANNON.LockConstraint);
    assert.notEqual(this.el.body.world.constraints.indexOf(c), -1);
  });
  test('constraint not registered when usePhysics = never', function () {
    this.el.setAttribute('pointable', 'usePhysics', 'never');
    this.comp.start({ detail: { hand: this.hand } });
    assert.strictEqual(this.comp.constraints.size, 0);
  });
  test('constraint removed on release', function () {
    var constraint;
    this.comp.start({ detail: { hand: this.hand } });
    assert.isOk(this.comp.constraints.has(this.hand));
    constraint = this.comp.constraints.get(this.hand);
    this.comp.end({ detail: { hand: this.hand } });
    assert.notOk(this.comp.constraints.has(this.hand));
    assert.equal(this.el.body.world.constraints.indexOf(constraint), -1);
  });
  test('changing usePhysics to never during grab removes constraint', function () {
    var constraint;
    this.comp.start({ detail: { hand: this.hand } });
    assert.isOk(this.comp.constraints.has(this.hand));
    constraint = this.comp.constraints.get(this.hand);
    this.el.setAttribute('pointable', 'usePhysics', 'never');
    assert.notOk(this.comp.constraints.has(this.hand));
    assert.strictEqual(this.el.body.world.constraints.indexOf(constraint), -1);
    assert.strictEqual(this.comp.constraints.size, 0);
  });
});


suite('two-handed grab', function () {
  setup(function (done) {
    var el = this.el = entityFactory();
    this.hand1 = helpers
      .controllerFactory({'super-hands': ''});
    this.hand2 = helpers
      .controllerFactory({'super-hands': ''});
    el.setAttribute('pointable', '');
    el.sceneEl.addEventListener('loaded', evt => {
      this.comp = el.components.pointable;
      done();
    });
  });
  test('two-handed grab can pass object between hands', function () {
    this.comp.start({ detail: { hand: this.hand1 } });
    assert.isTrue(this.comp.grabbed, 'first hand');
    assert.strictEqual(this.comp.grabber, this.hand1, 'hand 1 grabbing');
    this.comp.start({ detail: { hand: this.hand2 } });
    this.comp.end({ detail: { hand: this.hand1 } });
    assert.isTrue(this.comp.grabbed, 'passed to 2nd hand');
    assert.strictEqual(this.comp.grabber, this.hand2, 'hand 2 grabbing');
  });
  test('two-handed grab disabled by maxGrabbers = 1', function () {
    this.el.setAttribute('pointable', 'maxGrabbers: 1');
    this.comp.start({ detail: { hand: this.hand1 } });
    assert.sameMembers(this.comp.grabbers, [this.hand1], 'first grab accpeted');
    this.comp.start({ detail: { hand: this.hand2 } });
    assert.sameMembers(this.comp.grabbers, [this.hand1], 'second grab rejected');
  });
});
