/* global assert, process, setup, suite, test */

var helpers = require('../helpers'),
    entityFactory = helpers.entityFactory,
    coord = AFRAME.utils.coordinates.parse;

suite('stretchable', function () {
  setup(function (done) {
    var el = this.el = entityFactory();
    this.hand1 = helpers
      .controllerFactory({ 'hand-controls': 'right' }, true);
    this.hand2 = helpers
      .controllerFactory({ 'hand-controls': 'left' }, true);
    el.setAttribute('stretchable', '');
   el.sceneEl.addEventListener('loaded', evt => {
     this.comp = el.components.stretchable;
     done();
    });
  });
  test('component attaches without errors', function () {
    assert.isOk(this.el.components.stretchable.data.usePhysics);
  });
  test('component removes without errors', function (done) {
    var el = this.el;
    el.removeComponent('stretchable');
    process.nextTick(function () {
      assert.notOk(el.components.stretchable);
      done();
    });
  });
  test('stretchers captured and state added/removed', function () {
    this.comp.start({ detail: {
      hand: this.hand1,
      secondHand: this.hand2
    }});
    assert.isOk(this.el.is('stretched'));
    assert.isOk(this.comp.stretchers[0] === this.hand1);
    assert.isOk(this.comp.stretchers[1] === this.hand2);
    this.comp.end({ detail: { hand: this.hand1 }});
    assert.notOk(this.el.is('stretched'));
  });
  test('scale updates during stretch', function () {
    var posStub1 = this.sinon.stub(this.hand1, 'getAttribute'),
        lastScale;
    posStub1.withArgs('position')
      .onFirstCall().returns(coord('0 0 0'))
      .onSecondCall().returns(coord('1 1 1'))
      .onThirdCall().returns(coord('2 2 2'));
    this.comp.start({ detail: {
      hand: this.hand1,
      secondHand: this.hand2
    }});
    this.comp.tick();
    assert.deepEqual(this.el.getAttribute('scale'), coord('1 1 1'));
    this.comp.tick();
    assert.notDeepEqual(this.el.getAttribute('scale'), coord('1 1 1'));
    lastScale = this.el.getAttribute('scale');
    this.comp.end({ detail: { hand: this.hand1 } });
    this.comp.tick();
    assert.deepEqual(this.el.getAttribute('scale'), lastScale);
  });
});

suite('stretchable-physics', function () {
  setup(function (done) {
    var el = this.el = entityFactory({}, true);
    this.hand1 = helpers
      .controllerFactory({ 'hand-controls': 'right' }, true);
    this.hand2 = helpers
      .controllerFactory({ 'hand-controls': 'left' }, true);
    el.setAttribute('stretchable', '');
    el.setAttribute('geometry', 'primitive: box');
    el.setAttribute('dynamic-body', '');
    el.addEventListener('body-loaded', evt => {
      this.comp = el.components.stretchable;
      done();
    });
  });
  test('box bodies update with scaling', function () {
    var posStub1 = this.sinon.stub(this.hand1, 'getAttribute'),
        scale = new window.CANNON.Vec3();
    posStub1.withArgs('position')
      .onFirstCall().returns(coord('0 0 0'))
      .onSecondCall().returns(coord('1 1 1'))
      .onThirdCall().returns(coord('2 2 2'));
    this.comp.start({ detail: {
      hand: this.hand1,
      secondHand: this.hand2
    }});
    this.comp.tick();
    assert.deepEqual(this.el.body.shapes[0].halfExtents, 
                     scale.set(0.5, 0.5, 0.5));
    this.comp.tick();
    assert.notDeepEqual(this.el.body.shapes[0].halfExtents, 
                        scale.set(0.5, 0.5, 0.5));
  });
  test('box bodies do not update when usePhysics = never', function () {
    var posStub1 = this.sinon.stub(this.hand1, 'getAttribute'),
        scale = new window.CANNON.Vec3();
    posStub1.withArgs('position')
      .onFirstCall().returns(coord('0 0 0'))
      .onSecondCall().returns(coord('1 1 1'))
      .onThirdCall().returns(coord('2 2 2'));
    this.el.setAttribute('stretchable', 'usePhysics: never');
    this.comp.start({ detail: {
      hand: this.hand1,
      secondHand: this.hand2
    }});
    this.comp.tick();
    assert.deepEqual(this.el.body.shapes[0].halfExtents, 
                     scale.set(0.5, 0.5, 0.5));
    this.comp.tick();
    assert.deepEqual(this.el.body.shapes[0].halfExtents, 
                        scale.set(0.5, 0.5, 0.5));
  });
});