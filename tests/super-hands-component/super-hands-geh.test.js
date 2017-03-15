/* global assert, process, setup, suite, test */

var helpers = require('../helpers'), 
    entityFactory = helpers.entityFactory;

suite('super-hands GlobalEventHandler integration', function () {
  setup(function (done) {
    this.target1 = entityFactory();
    this.target1.id = 'target1';
    this.target2 = document.createElement('a-entity');
    this.target2.id = 'target2';
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
  test('mouseover', function (done) {
    this.target1.onmouseover = e => {
      assert.typeOf(e, 'MouseEvent');
      assert.strictEqual(e.target, this.target1);
      assert.strictEqual(e.relatedTarget, this.hand1);
      done();
    };
    this.sh1.onHit({ detail: { el: this.target1 } });
  });
  test('mouseout', function (done) {
    this.sh1.onHit({ detail: { el: this.target1 } });
    this.target1.onmouseout = e => {
      assert.typeOf(e, 'MouseEvent');
      assert.strictEqual(e.target, this.target1);
      assert.strictEqual(e.relatedTarget, this.hand1);
      done();
    };
    this.sh1.unHover({ 
      target: this.target1, 
      detail: { state: 'collided' } 
    });
  });
  test('dragenter - carried', function (done) {
    this.target1.ondragenter = e => {
      assert.typeOf(e, 'MouseEvent');
      assert.strictEqual(e.target, this.target1);
      assert.strictEqual(e.relatedTarget, this.target2);
      done();
    };
    this.sh1.onDragDropStartButton();
    this.sh1.onHit({ detail: { el: this.target1 } });
    this.sh1.onHit({ detail: { el: this.target2 } });
  });
  test('dragenter - hovered', function (done) {
    this.target2.ondragenter = e => {
      assert.typeOf(e, 'MouseEvent');
      assert.strictEqual(e.target, this.target2);
      assert.strictEqual(e.relatedTarget, this.target1);
      done();
    };
    this.sh1.onDragDropStartButton();
    this.sh1.onHit({ detail: { el: this.target1 } });
    this.sh1.onHit({ detail: { el: this.target2 } });
  });
  test('dragleave by move - carried', function (done) {
    this.sh1.onDragDropStartButton();
    this.sh1.onHit({ detail: { el: this.target1 } });
    this.sh1.onHit({ detail: { el: this.target2 } });
    this.target1.ondragleave = e => {
      assert.typeOf(e, 'MouseEvent');
      assert.strictEqual(e.target, this.target1);
      assert.strictEqual(e.relatedTarget, this.target2);
      done();
    };
    this.target2.addState('collided');
    this.target2.removeState('collided');
  });
  test('dragleave by move- hovered', function (done) {
    this.sh1.onDragDropStartButton();
    this.sh1.onHit({ detail: { el: this.target1 } });
    this.sh1.onHit({ detail: { el: this.target2 } });
    this.target2.ondragleave = e => {
      assert.typeOf(e, 'MouseEvent');
      assert.strictEqual(e.target, this.target2);
      assert.strictEqual(e.relatedTarget, this.target1);
      done();
    };
    this.target2.addState('collided');
    this.target2.removeState('collided');
  });
  test('dragleave by drop - carried', function (done) {
    this.sh1.onDragDropStartButton();
    this.sh1.onHit({ detail: { el: this.target1 } });
    this.sh1.onHit({ detail: { el: this.target2 } });
    this.target1.ondragleave = e => {
      assert.typeOf(e, 'MouseEvent');
      assert.strictEqual(e.target, this.target1);
      assert.strictEqual(e.relatedTarget, this.target2);
      done();
    };
    this.sh1.onDragDropEndButton();
  });
  test('dragleave by drop - hovered', function (done) {
    this.sh1.onDragDropStartButton();
    this.sh1.onHit({ detail: { el: this.target1 } });
    this.sh1.onHit({ detail: { el: this.target2 } });
    this.target2.ondragleave = e => {
      assert.typeOf(e, 'MouseEvent');
      assert.strictEqual(e.target, this.target2);
      assert.strictEqual(e.relatedTarget, this.target1);
      done();
    };
    this.sh1.onDragDropEndButton();
  });
  test('dragstart', function (done) {
    this.target1.ondragstart = e => {
      assert.typeOf(e, 'MouseEvent');
      assert.strictEqual(e.target, this.target1);
      assert.strictEqual(e.relatedTarget, this.hand1);
      done();
    };
    this.sh1.onDragDropStartButton();
    this.sh1.onHit({ detail: { el: this.target1 } });
  });
  test('dragend', function (done) {
    this.sh1.onDragDropStartButton();
    this.sh1.onHit({ detail: { el: this.target1 } });
    this.target1.ondragend = e => {
      assert.typeOf(e, 'MouseEvent');
      assert.strictEqual(e.target, this.target1);
      assert.strictEqual(e.relatedTarget, this.hand1);
      done();
    };
    this.sh1.onDragDropEndButton();
  });
  test('drop - target', function (done) {
    this.target2.ondrop = e => {
      assert.typeOf(e, 'MouseEvent');
      assert.strictEqual(e.target, this.target2);
      assert.strictEqual(e.relatedTarget, this.target1);
      done();
    };
    this.sh1.onDragDropStartButton();
    this.sh1.onHit({ detail: { el: this.target1 } });
    this.sh1.onHit({ detail: { el: this.target2 } });
    this.sh1.onDragDropEndButton();
  });
  test('drop - carried', function (done) {
    this.target1.ondrop = e => {
      assert.typeOf(e, 'MouseEvent');
      assert.strictEqual(e.target, this.target1);
      assert.strictEqual(e.relatedTarget, this.target2);
      done();
    };
    this.sh1.onDragDropStartButton();
    this.sh1.onHit({ detail: { el: this.target1 } });
    this.sh1.onHit({ detail: { el: this.target2 } });
    this.sh1.onDragDropEndButton();
  });
  test('mousedown', function (done) {
    this.target1.onmousedown = e => {
      assert.typeOf(e, 'MouseEvent');
      assert.strictEqual(e.target, this.target1);
      assert.strictEqual(e.relatedTarget, this.hand1);
      done();
    };
    this.sh1.onGrabStartButton();
    this.sh1.onHit({ detail: { el: this.target1 } });
  });
  test('mousedown indepentent of reaction comp', function (done) {
    this.target1.onmousedown = e => {
      assert.typeOf(e, 'MouseEvent');
      assert.strictEqual(e.target, this.target1);
      assert.strictEqual(e.relatedTarget, this.hand1);
      done();
    };
    this.sh1.onGrabStartButton();
    this.sh1.carried = this.target2;
    this.sh1.onHit({ detail: { el: this.target1 } });
  });
  test('mouseup', function (done) {
    this.sh1.onGrabStartButton();
    this.sh1.onHit({ detail: { el: this.target1 } });
    this.target1.onmouseup = e => {
      assert.typeOf(e, 'MouseEvent');
      assert.strictEqual(e.target, this.target1);
      assert.strictEqual(e.relatedTarget, this.hand1);
      done();
    };
    this.sh1.onGrabEndButton();
  });
  test('click', function (done) {
    this.sh1.onGrabStartButton();
    this.sh1.onHit({ detail: { el: this.target1 } });
    this.target1.onclick = e => {
      assert.typeOf(e, 'MouseEvent');
      assert.strictEqual(e.target, this.target1);
      assert.strictEqual(e.relatedTarget, this.hand1);
      done();
    };
    this.sh1.onGrabEndButton();
  });
  test('click does not fire if target is lost', function () {
    var clickSpy = this.sinon.spy();
    this.sh1.onGrabStartButton();
    this.target1.addState('collided');
    this.sh1.onHit({ detail: { el: this.target1 } });
    this.target1.onclick = clickSpy;
    this.target1.removeState('collided');
    this.sh1.onGrabEndButton();
    assert.isFalse(clickSpy.called);
  });
});

suite('super-hands GlobalEventHandler multiple targets', function () {
  setup(function (done) {
    this.target1 = entityFactory();
    this.target1.id = 'target1';
    this.target2 = document.createElement('a-entity');
    this.target2.id = 'target2';
    this.target1.parentNode.appendChild(this.target2);
    this.target3 = document.createElement('a-entity');
    this.target3.id = 'target3';
    this.target1.parentNode.appendChild(this.target3);
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
  test('mouseover all', function () {
    var t1Spy = this.sinon.spy(), t2Spy = this.sinon.spy(),
        t3Spy = this.sinon.spy();
    this.target1.addEventListener('mouseover', t1Spy);
    this.target2.addEventListener('mouseover', t2Spy);
    this.target3.addEventListener('mouseover', t3Spy);
    this.sh1.onHit({ detail: { el: this.target1 } });
    this.sh1.onHit({ detail: { el: this.target2 } });
    this.sh1.onHit({ detail: { el: this.target3 } });
    assert.isTrue(t1Spy.called, 'target 1');
    assert.isTrue(t2Spy.called, 'target 2');
    assert.isTrue(t3Spy.called, 'target 3');
  });
  test('mousedown all', function () {
    var t1Spy = this.sinon.spy(), t2Spy = this.sinon.spy(),
        t3Spy = this.sinon.spy();
    this.target1.addEventListener('mousedown', t1Spy);
    this.target2.addEventListener('mousedown', t2Spy);
    this.target3.addEventListener('mousedown', t3Spy);
    this.sh1.onHit({ detail: { el: this.target1 } });
    this.sh1.onHit({ detail: { el: this.target2 } });
    this.sh1.onGrabStartButton();
    this.sh1.onHit({ detail: { el: this.target3 } });
    assert.isTrue(t1Spy.called, 'target 1');
    assert.isTrue(t2Spy.called, 'target 2');
    assert.isTrue(t3Spy.called, 'target 3');
  });
});