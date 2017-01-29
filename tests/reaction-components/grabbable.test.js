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
  test.only('initiates grab on event when not grabbed', function (done) {
    var myGrabbable = this.el.components.grabbable,
        hand = this.hand, 
        el = this.el,
        startSpy = sinon.spy(myGrabbable, 'start');
    assert.isNotOk(myGrabbable.grabbed);
    assert.notStrictEqual(myGrabbable.grabber, this.hand);
    assert.isNotOk(this.el.is(myGrabbable.GRABBED_STATE));
    this.el.emit(myGrabbable.GRAB_EVENT, { hand: hand });
    function cb() {
      if(!startSpy.called) {
        setTimeout(cb, 0);
        return;
      }
      assert.isOk(startSpy.called, 'grabbable.start was called');
      assert.isOk(myGrabbable.grabbed);
      assert.isOk(myGrabbable.grabber);
      assert.strictEqual(myGrabbable.grabber, hand);
      assert.isOk(el.is(myGrabbable.GRABBED_STATE));
      done();
    }
    cb();
  });
  test('position updates during grab', function (done) {
    var posStub = sinon.stub(this.hand, 'getAttribute'),
        myGrabbable = this.el.components.grabbable;
    assert.deepEqual(this.el.getAttribute('position'), coord('0 0 0'));
    posStub.withArgs('position')
      .onFirstCall().returns(coord('0 0 0'))
      .onSecondCall().returns(coord('1 1 1'));
    this.el.emit(myGrabbable.GRAB_EVENT, { hand: this.hand });
    process.nextTick( () => {
      /* need two ticks to make an update happen, and I couldn't cause that with 
         setTimeout or nested nextTick,
         so just call the second tick directly */
      myGrabbable.tick();
      assert.deepEqual(this.el.getAttribute('position'), coord('1 1 1'));
      done();
    });
  });
    test('position does not update during grab when usePhysics set to "only"', function (done) {
    var posStub = sinon.stub(this.hand, 'getAttribute'),
        myGrabbable = this.el.components.grabbable;
    assert.deepEqual(this.el.getAttribute('position'), coord('0 0 0'));
    posStub.withArgs('position')
      .onFirstCall().returns(coord('0 0 0'))
      .onSecondCall().returns(coord('1 1 1'));
    myGrabbable.data.usePhysics = 'only';
    this.el.emit(myGrabbable.GRAB_EVENT, { hand: this.hand });
    process.nextTick( () => {
      /* need two ticks to make an update happen, and I couldn't cause that with 
         setTimeout or nested nextTick,
         so just call the second tick directly */
      myGrabbable.tick();
      assert.deepEqual(this.el.getAttribute('position'), coord('0 0 0'));
      done();
    });
  });
  test('updates cease on release event', function(done) {
    var posStub = sinon.stub(this.hand, 'getAttribute'),
        myGrabbable = this.el.components.grabbable;
    assert.deepEqual(this.el.getAttribute('position'), coord('0 0 0'));
    posStub.withArgs('position')
      .onFirstCall().returns(coord('0 0 0'))
      .onSecondCall().returns(coord('1 1 1'));
    myGrabbable.grabbed = true;
    myGrabbable.grabber = this.hand;
    this.el.addState(myGrabbable.GRABBED_STATE);
    this.el.emit(myGrabbable.UNGRAB_EVENT, { hand: this.hand });
    process.nextTick( () => {
      /* need two ticks to make an update happen, and I couldn't cause that with 
         setTimeout or nested nextTick,
         so just call the second tick directly */
      myGrabbable.tick();
      assert.deepEqual(this.el.getAttribute('position'), coord('0 0 0'));
      assert.notOk(this.el.is(myGrabbable.GRABBED_STATE));
      assert.notOk(myGrabbable.grabbed);
      assert.notOk(myGrabbable.grabber);
      done();
    });
  });
  test('grabbing from a second hand is rejected', function(done) {
    var myGrabbable = this.el.components.grabbable,
        secondHand = {};
    myGrabbable.grabbed = true;
    myGrabbable.grabber = this.hand;
    this.el.addState(myGrabbable.GRABBED_STATE);
    this.el.emit(myGrabbable.GRAB_EVENT, { hand: secondHand });
    process.nextTick( () => {
      assert.strictEqual(myGrabbable.grabber, this.hand);
      done();
    });
  });
  
});

