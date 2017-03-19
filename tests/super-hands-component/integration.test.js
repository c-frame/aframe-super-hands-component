/* global assert, process, setup, suite, test */

var helpers = require('../helpers'), 
    entityFactory = helpers.entityFactory;

suite('super-hands & reaction component integration', function () {
  setup(function (done) {
    this.target1 = entityFactory();
    this.target1.setAttribute('grabbable', '');
    this.target1.setAttribute('hoverable', '');
    this.target1.setAttribute('stretchable', '');
    this.target1.setAttribute('drag-droppable', '');
    this.target2 = document.createElement('a-entity');
    this.target2.setAttribute('drag-droppable', '');
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
  test('grabbable', function () {
    this.sh1.onGrabStartButton();
    this.sh1.onHit({ detail: { el: this.target1 } });
    assert.strictEqual(this.sh1.carried, this.target1);
    assert.strictEqual(this.target1.components.grabbable.grabber, this.hand1);
    assert.ok(this.target1.is('grabbed'));
  });
  test('hoverable', function () {
    this.sh1.onHit({ detail: { el: this.target1 } });
    assert.strictEqual(this.sh1.hoverEls[0], this.target1);
    assert.strictEqual(this.target1.components.hoverable.hoverers[0], this.hand1);
  });
  test('stretchable', function () {
    this.sh1.onStretchStartButton();
    this.sh2.onStretchStartButton();
    this.sh1.onHit({ detail: { el: this.target1 } });
    this.sh2.onHit({ detail: { el: this.target1 } });
    assert.ok(this.target1.is('stretched'));
    assert.includeMembers(this.target1.components.stretchable.stretchers,
                         [this.hand1, this.hand2]);
    assert.strictEqual(this.sh1.stretched, this.target1);
    assert.strictEqual(this.sh2.stretched, this.target1);
  });
  test('drag-droppable', function () {
    this.sh1.onDragDropStartButton();
    this.sh1.onHit({ detail: { el: this.target1 } });
    this.sh1.onHit({ detail: { el: this.target2 } });
    assert.ok(this.target1.is('dragged'), 'carried dragged');
    assert.ok(this.target2.is('dragover'), 'drop target hovered');
    this.target2.emit('stateremoved', { state: 'collided' });
    assert.ok(this.target1.is('dragged'), 'carried still dragged after target lost');
    assert.isFalse(this.target2.is('dragover'), 'lost target unhovered');
    this.sh1.onHit({ detail: { el: this.target2 } });
    assert.ok(this.target2.is('dragover'), 'drop target re-acquired');
    this.sh1.onDragDropEndButton();
    assert.isFalse(this.target1.is('dragged'), 'carried released');
    assert.isFalse(this.target2.is('dragover'), 'drop target unhovered');
  });
});
suite('super-hands collider integration', function () {
  setup(function (done) {
    this.target1 = entityFactory();
    this.target1.id = 'target1';
    this.target1.setAttribute('geometry', 'primitive: sphere');
    this.target2 = document.createElement('a-entity');
    this.target2.id = 'target2';
    this.target2.setAttribute('geometry', 'primitive: sphere');
    this.target1.parentNode.appendChild(this.target2);
    this.hand1 = helpers.controllerFactory({
      'vive-controls': 'hand: right; model: false',
      geometry: 'primitive: sphere',
      'super-hands': '', 'sphere-collider': 'objects: #target1, #target2'
    }, true);
    this.hand2 = helpers.controllerFactory({
      'vive-controls': 'hand: left; model: false',
      geometry: 'primitive: sphere',
      'super-hands': '',
      'sphere-collider': 'objects: #target1, #target2'
    }, true);
    this.hand1.parentNode.addEventListener('loaded', () => {
      this.sh1 = this.hand1.components['super-hands'];
      this.col1 = this.hand1.components['sphere-collider'];
      this.sh2 = this.hand2.components['super-hands'];
      this.col2 = this.hand2.components['sphere-collider'];
      done();
    });
  });
  test('avoid excessive event dispatch', function () {
    var dragenterSpy = this.sinon.spy();
    this.target2.ondragenter = dragenterSpy;
    this.target2.setAttribute('position', '10 10 10');
    // sphere collider not respecting position attribute changes
    this.target2.getObject3D('mesh').position.set(10, 10, 10);
    this.col1.tick();
    this.sh1.onDragDropStartButton();
    assert.isFalse(dragenterSpy.called, 'not yet collided');
    this.target2.setAttribute('position', '0 0 0');
    // sphere collider not respecting position attribute changes
    this.target2.getObject3D('mesh').position.set(0, 0, 0);
    this.col1.tick();
    assert.equal(dragenterSpy.callCount, 1, 'initial dragover');
    this.col1.tick();
    assert.equal(dragenterSpy.callCount, 1, 'no duplicate dragover');
  });
});