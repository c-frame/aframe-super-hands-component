/* global assert, process, setup, suite, test */
var helpers = require('../helpers'),
  entityFactory = helpers.entityFactory,
  coord = AFRAME.utils.coordinates.parse;
suite('grabbable-lifecycle', function () {
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
  test('component removes without errors', function (done) {
    var el = this.el;
    el.removeComponent('grabbable');
    process.nextTick(function () {
      assert.notOk(el.components.grabbable);
      done();
    });
  });
});

suite('grabbable-function without physics', function () {
  setup(function (done) {
    var el = this.el = entityFactory();
    el.setAttribute('grabbable', '');
    this.hand = helpers.controllerFactory();
    el.parentNode.addEventListener('loaded', function () {
      done();
    });
  });
  test('initiates grab on event when not grabbed', function () {
    var myGrabbable = this.el.components.grabbable,
      hand = this.hand,
      el = this.el;
    assert.isNotOk(myGrabbable.grabbed);
    assert.notStrictEqual(myGrabbable.grabber, this.hand);
    assert.isNotOk(this.el.is(myGrabbable.GRABBED_STATE));
    myGrabbable.start({ detail: { hand: this.hand }});
    assert.isOk(myGrabbable.grabbed);
    assert.isOk(myGrabbable.grabber);
    assert.strictEqual(myGrabbable.grabber, hand);
    assert.isOk(el.is(myGrabbable.GRABBED_STATE));
  });
  test('position updates during grab', function () {
    var posStub = sinon.stub(this.hand, 'getAttribute'),
      myGrabbable = this.el.components.grabbable;
    assert.deepEqual(this.el.getAttribute('position'), coord('0 0 0'));
    posStub.withArgs('position')
      .onFirstCall().returns(coord('0 0 0'))
      .onSecondCall().returns(coord('1 1 1'));
    myGrabbable.start({detail: {hand: this.hand}});
    /* with render loop stubbed out, need to force ticks */
    myGrabbable.tick();
    myGrabbable.tick();
    assert.deepEqual(this.el.getAttribute('position'), coord('1 1 1'));
  });
  test(
    'position does not update during grab when usePhysics set to "only"',
    function () {
      var posStub = sinon.stub(this.hand, 'getAttribute'),
        myGrabbable = this.el.components.grabbable;
      assert.deepEqual(this.el.getAttribute('position'), coord('0 0 0'));
      posStub.withArgs('position')
        .onFirstCall().returns(coord('0 0 0'))
        .onSecondCall().returns(coord('1 1 1'));
      myGrabbable.data.usePhysics = 'only';
      myGrabbable.start({detail: {hand: this.hand}});
      myGrabbable.tick();
      assert.deepEqual(this.el.getAttribute('position'), coord('0 0 0'));
     });
  test('updates cease on release event', function () {
    var posStub = sinon.stub(this.hand, 'getAttribute'),
      myGrabbable = this.el.components.grabbable;
    assert.deepEqual(this.el.getAttribute('position'), coord('0 0 0'));
    posStub.withArgs('position')
      .onFirstCall().returns(coord('0 0 0'))
      .onSecondCall().returns(coord('1 1 1'));
    myGrabbable.start({ detail: {hand: this.hand }});
    myGrabbable.tick();
    myGrabbable.end({ detail: { hand: this.hand }});
    myGrabbable.tick();
    assert.deepEqual(this.el.getAttribute('position'), coord('0 0 0'));
    assert.notOk(this.el.is(myGrabbable.GRABBED_STATE));
    assert.notOk(myGrabbable.grabbed);
    assert.notOk(myGrabbable.grabber);
  });
  test('grabbing from a second hand does not change grabber', function () {
    var myGrabbable = this.el.components.grabbable,
      secondHand = {};
    myGrabbable.start({ detail: { hand: this.hand } });
    myGrabbable.start({ detail: { hand: secondHand } });
    assert.strictEqual(myGrabbable.grabber, this.hand);
  });
});

suite('grabbable-function with physics', function () {
  setup(function (done) {
    var el = this.el = entityFactory();
    this.hand = helpers.controllerFactory({
      'static-body': '',
      geometry: 'primitive: sphere'
    });
    el.setAttribute('grabbable', '');
    el.setAttribute('geometry', 'primitive: box');
    el.setAttribute('dynamic-body', '');
    el.addEventListener('body-loaded', evt => {
      this.comp = el.components.grabbable;
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
    this.el.setAttribute('grabbable', 'usePhysics', 'never');
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
    this.el.setAttribute('grabbable', 'usePhysics', 'never');
    assert.notOk(this.comp.constraints.has(this.hand));
    assert.strictEqual(this.el.body.world.constraints.indexOf(constraint), -1);
    assert.strictEqual(this.comp.constraints.size, 0);
  });
});

suite('two-handed grab w/o physics', function () {
  setup(function (done) {
    var el = this.el = entityFactory();
    this.hand1 = helpers
      .controllerFactory({ 'super-hands': ''});
    this.hand2 = helpers
      .controllerFactory({ 'super-hands': ''});
    el.setAttribute('grabbable', '');
    el.sceneEl.addEventListener('loaded', evt => {
      this.comp = el.components.grabbable;
      done();
    });
  });
  test('two-handed grab can pass object between hands', function () {
    // stub out super-hands method called from grabbable.end becase no collider active
    this.hand2.components['super-hands'].updateGrabbed = () => {
      this.comp.start({ detail: { hand: this.hand2 } });
    };
    this.comp.start({ detail: { hand: this.hand1 } });
    assert.isTrue(this.comp.grabbed, 'first hand');
    assert.strictEqual(this.comp.grabber, this.hand1, 'hand 1 grabbing');
    this.comp.start({ detail: { hand: this.hand2 } });
    this.comp.end({ detail: { hand: this.hand1 } });
    assert.isTrue(this.comp.grabbed, 'passed to 2nd hand');
    assert.strictEqual(this.comp.grabber, this.hand2, 'hand 2 grabbing');
  });
  test('two-handed grab disabled by maxGrabbers = 1', function () {
    this.el.setAttribute('grabbable', 'maxGrabbers: 1');
    this.comp.start({ detail: { hand: this.hand1 } });
    assert.sameMembers(this.comp.grabbers, [this.hand1], 'first grab accpeted');
    this.comp.start({ detail: { hand: this.hand2 } });
    assert.sameMembers(this.comp.grabbers, [this.hand1], 'second grab rejected');
  });
});

suite('two-handed grab with physics', function () {
  setup(function (done) {
    var el = this.el = entityFactory();
    this.hand1 = helpers
      .controllerFactory({
        'super-hands': '',
        'static-body': '',
        geometry: 'primitive: sphere'
      });
    this.hand2 = helpers
      .controllerFactory({
        'super-hands': '',
        'static-body': '',
        geometry: 'primitive: sphere'
      });
    el.setAttribute('grabbable', '');
    el.setAttribute('geometry', 'primitive: box');
    el.setAttribute('dynamic-body', '');
    el.addEventListener('body-loaded', evt => {
      this.comp = el.components.grabbable;
      if (!this.hand2.body) {
        this.hand2.addEventListener('body-loaded', evt => done());
      } else {
        done();
      }
    });
  });
  test('two-handed grab makes dual constraints', function () {
    this.comp.start({ detail: { hand: this.hand1 } });
    assert.isTrue(this.comp.grabbed, 'first hand');
    assert.isTrue(this.comp.constraints.has(this.hand1), '1st hand');
    this.comp.start({ detail: { hand: this.hand2 } });
    assert.isTrue(this.comp.constraints.has(this.hand1), 'still 1st hand');
    assert.isTrue(this.comp.constraints.has(this.hand2), 'also second hand');
    this.comp.end({ detail: { hand: this.hand1 } });
    assert.isTrue(this.comp.constraints.has(this.hand2), 'still second hand');
    assert.isFalse(this.comp.constraints.has(this.hand1), '1st hand free');
  });
  test('two-handed grab disabled by maxGrabbers = 1', function () {
    this.el.setAttribute('grabbable', 'maxGrabbers: 1');
    this.comp.start({ detail: { hand: this.hand1 } });
    assert.isTrue(this.comp.constraints.has(this.hand1), 'first grab accpeted');
    this.comp.start({ detail: { hand: this.hand2 } });
    assert.isFalse(this.comp.constraints.has(this.hand2), 'second grab rejected');
  });
});
