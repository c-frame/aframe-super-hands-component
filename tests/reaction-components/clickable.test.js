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
    
  })
})
/*suite('grabbable-function without physics', function () {
  setup(function (done) {
    var el = this.el = entityFactory();
    el.setAttribute('grabbable', '');
    this.hand = { getAttribute: function () {} };
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
    myGrabbable.start({ detail: { hand: this.hand }});
    /* with render loop stubbed out, need to force ticks *//*
    myGrabbable.tick();
    myGrabbable.tick();
    assert.deepEqual(this.el.getAttribute('position'), coord('1 1 1'));
  });
    test('position does not update during grab when usePhysics set to "only"', 
         function () {
    var posStub = sinon.stub(this.hand, 'getAttribute'),
        myGrabbable = this.el.components.grabbable;
    assert.deepEqual(this.el.getAttribute('position'), coord('0 0 0'));
    posStub.withArgs('position')
      .onFirstCall().returns(coord('0 0 0'))
      .onSecondCall().returns(coord('1 1 1'));
    myGrabbable.data.usePhysics = 'only';
    myGrabbable.start({ detail: { hand: this.hand }});
    myGrabbable.tick();
    assert.deepEqual(this.el.getAttribute('position'), coord('0 0 0'));
  });
  test('updates cease on release event', function() {
    var posStub = sinon.stub(this.hand, 'getAttribute'),
        myGrabbable = this.el.components.grabbable;
    assert.deepEqual(this.el.getAttribute('position'), coord('0 0 0'));
    posStub.withArgs('position')
      .onFirstCall().returns(coord('0 0 0'))
      .onSecondCall().returns(coord('1 1 1'));
    myGrabbable.grabbed = true;
    myGrabbable.grabber = this.hand;
    this.el.addState(myGrabbable.GRABBED_STATE);
    myGrabbable.tick();
    myGrabbable.end({ detail: { hand: this.hand }});
    myGrabbable.tick();
    assert.deepEqual(this.el.getAttribute('position'), coord('0 0 0'));
    assert.notOk(this.el.is(myGrabbable.GRABBED_STATE));
    assert.notOk(myGrabbable.grabbed);
    assert.notOk(myGrabbable.grabber);
  });
  test('grabbing from a second hand is rejected', function() {
    var myGrabbable = this.el.components.grabbable,
        secondHand = {};
    myGrabbable.grabbed = true;
    myGrabbable.grabber = this.hand;
    this.el.addState(myGrabbable.GRABBED_STATE);
    myGrabbable.start({ detail: { hand: secondHand }});
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
      if(!this.hand.body) {
        this.hand.addEventListener('body-loaded', evt => done());
      } else {
        done();
      }
    });
  });
  test('constraint registered on grab', function () {
    this.comp.start({ detail: { hand: this.hand } });
    assert.isOk(this.comp.constraint);
    assert.instanceOf(this.comp.constraint, window.CANNON.LockConstraint);
    assert.notEqual(this.el.body.world.constraints.indexOf(this.comp.constraint), -1)
  });
  test('constraint not registered when usePhysics = never', function () {
    this.el.setAttribute('grabbable', 'usePhysics', 'never');
    this.comp.start({ detail: { hand: this.hand } });
    assert.notOk(this.comp.constraint);
  });
  test('constraint removed on release', function() {
    var constraint;
    this.comp.start({ detail: { hand: this.hand } });
    assert.isOk(this.comp.constraint);
    constraint = this.comp.constraint;
    this.comp.end({ detail: { hand: this.hand } });
    assert.notOk(this.comp.constraint);
    assert.equal(this.el.body.world.constraints.indexOf(constraint), -1);
  });
  test('changing usePhysics to never during grab removes constraint', function () {
    var constraint;
    this.comp.start({ detail: { hand: this.hand } });
    assert.isOk(this.comp.constraint);
    constraint = this.comp.constraint;
    this.el.setAttribute('grabbable', 'usePhysics', 'never');
    assert.notOk(this.comp.constraint);
    assert.equal(this.el.body.world.constraints.indexOf(constraint), -1);
  });
});
*/