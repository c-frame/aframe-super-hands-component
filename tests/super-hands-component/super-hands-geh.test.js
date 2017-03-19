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
  test('dragstart finds same target as drag-droppable', function (done) {
    this.target1.addEventListener('drag-start', e => e.preventDefault());
    this.target1.ondragstart = e => {
      assert.typeOf(e, 'MouseEvent');
      assert.strictEqual(e.target, this.target1);
      assert.strictEqual(e.relatedTarget, this.hand1);
      assert.strictEqual(this.sh1.dragged, this.sh1.gehDragged);
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
  test('mousedown independent of reaction comp', function (done) {
    this.target1.onmousedown = e => {
      assert.typeOf(e, 'MouseEvent');
      assert.strictEqual(e.target, this.target1);
      assert.strictEqual(e.relatedTarget, this.hand1);
      done();
    };
    this.sh1.onGrabStartButton();
    this.sh1.carried = null;
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
  test('mouseup different target than mousedown', function () {
    var spy1 = this.sinon.spy(), spy2 = this.sinon.spy();
    this.sh1.onGrabStartButton();
    this.sh1.onHit({ detail: { el: this.target1 } });
    this.sh1.onHit({ detail: { el: this.target2 } });
    this.sh1.unWatch({ target: this.target1, detail: { state: 'collided' } });
    this.target1.onmouseup = spy1;
    this.target2.onmouseup = spy2;
    this.sh1.onGrabEndButton();
    assert.isFalse(spy1.called, 'no event on old target');
    assert.isTrue(spy2.called, 'event on new target');
    assert.isTrue(spy2.calledWithMatch({ relatedTarget: this.hand1 }), 'event object');
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
  // need to add state tracking for mousedown-ed element
  test.skip('click only on target previously mousedown-ed', function () {
    var spy1 = this.sinon.spy(), spy2 = this.sinon.spy();
    this.sh1.onGrabStartButton();
    this.sh1.onHit({ detail: { el: this.target1 } });
    this.sh1.onHit({ detail: { el: this.target2 } });
    this.target1.onclick = spy1;
    this.target2.onclick = spy2;
    this.sh1.onGrabEndButton();
    assert.isTrue(spy1.called, 'original target');
    assert.isFalse(spy2.called, 'new target');
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
  test('mouseup all', function () {
    var t1Spy = this.sinon.spy(), t2Spy = this.sinon.spy(),
        t3Spy = this.sinon.spy();
    this.target1.onmouseup = t1Spy;
    this.target2.onmouseup = t2Spy;
    this.target3.onmouseup = t3Spy;
    this.sh1.onGrabStartButton();
    this.sh1.onHit({ detail: { el: this.target1 } });
    this.sh1.onHit({ detail: { el: this.target2 } });
    this.sh1.onHit({ detail: { el: this.target3 } });
    this.sh1.onGrabEndButton();
    assert.isTrue(t1Spy.called, 'target 1');
    assert.isTrue(t2Spy.called, 'target 2');
    assert.isTrue(t3Spy.called, 'target 3');
  });
  test('click all', function () {
    var t1Spy = this.sinon.spy(), t2Spy = this.sinon.spy(),
        t3Spy = this.sinon.spy();
    this.target1.onclick = t1Spy;
    this.target2.onclick = t2Spy;
    this.target3.onclick = t3Spy;
    this.sh1.onGrabStartButton();
    this.sh1.onHit({ detail: { el: this.target1 } });
    this.sh1.onHit({ detail: { el: this.target2 } });
    this.sh1.onHit({ detail: { el: this.target3 } });
    this.sh1.onGrabEndButton();
    assert.isTrue(t1Spy.called, 'target 1');
    assert.isTrue(t2Spy.called, 'target 2');
    assert.isTrue(t3Spy.called, 'target 3');
  });
  // consider making multiple entities draggable
  test.skip('dragstart all', function () {
    var t1Spy = this.sinon.spy(), t2Spy = this.sinon.spy(),
        t3Spy = this.sinon.spy();
    this.target1.ondragstart = t1Spy;
    this.target2.ondragstart = t2Spy;
    this.target3.ondragstart = t3Spy;
    this.sh1.onDragDropStartButton();
    this.sh1.onHit({ detail: { el: this.target1 } });
    this.sh1.onHit({ detail: { el: this.target2 } });
    this.sh1.onHit({ detail: { el: this.target3 } });
    assert.isTrue(t1Spy.called, 'target 1');
    assert.isTrue(t2Spy.called, 'target 2');
    assert.isTrue(t3Spy.called, 'target 3');
  });
  test('dragenter all', function () {
    var t1Spy = this.sinon.spy(), t2Spy = this.sinon.spy(),
        t3Spy = this.sinon.spy();
    this.target1.addEventListener('dragenter', t1Spy);
    this.target2.addEventListener('dragenter', t2Spy);
    this.target3.addEventListener('dragenter', t3Spy);
    this.sh1.onDragDropStartButton();
    this.sh1.onHit({ detail: { el: this.target1 } });
    this.sh1.onHit({ detail: { el: this.target2 } });
    this.sh1.onHit({ detail: { el: this.target3 } });
    assert.isTrue(t1Spy.calledWithMatch({ relatedTarget: this.target2 }), 'target 2');
    assert.isTrue(t1Spy.calledWithMatch({ relatedTarget: this.target3 }), 'target 3');
    assert.isFalse(t1Spy.calledWithMatch({ relatedTarget: this.target1 }), 'target 1 not on self');
    assert.isTrue(t2Spy.calledWithMatch({ relatedTarget: this.target1 }), 'target 2');
    assert.isTrue(t3Spy.calledWithMatch({ relatedTarget: this.target1 }), 'target 3');
  });
  test('drop all', function () {
    var t1Spy = this.sinon.spy(), t2Spy = this.sinon.spy(),
        t3Spy = this.sinon.spy();
    this.target1.ondrop = t1Spy;
    this.target2.ondrop = t2Spy;
    this.target3.ondrop = t3Spy;
    this.sh1.onDragDropStartButton();
    this.sh1.onHit({ detail: { el: this.target1 } });
    this.sh1.onHit({ detail: { el: this.target2 } });
    this.sh1.onHit({ detail: { el: this.target3 } });
    this.sh1.onDragDropEndButton();
    assert.isTrue(t1Spy.called, 'target 1 drop');
    assert.isTrue(t2Spy.called, 'target 2 drop');
    assert.isTrue(t3Spy.called, 'target 3 drop');
    assert.isTrue(t1Spy.calledWithMatch({ relatedTarget: this.target2 }), 'dropper t2');
    assert.isTrue(t2Spy.calledWithMatch({ relatedTarget: this.target1 }), 'dropee t1');
    assert.isTrue(t2Spy.calledWithMatch({ relatedTarget: this.target1 }), 'dropee t1');
    assert.isFalse(t1Spy.calledWithMatch({ relatedTarget: this.target1 }), 'dropper self');
    assert.isTrue(t1Spy.calledWithMatch({ relatedTarget: this.target3 }), 'dropper t3');
  });
  test('dragleave all on drop', function () {
    var t1Spy = this.sinon.spy(), t2Spy = this.sinon.spy(),
        t3Spy = this.sinon.spy();
    this.target1.ondragleave = t1Spy;
    this.target2.ondragleave = t2Spy;
    this.target3.ondragleave = t3Spy;
    this.sh1.onDragDropStartButton();
    this.sh1.onHit({ detail: { el: this.target1 } });
    this.sh1.onHit({ detail: { el: this.target2 } });
    this.sh1.onHit({ detail: { el: this.target3 } });
    this.sh1.onDragDropEndButton();
    assert.isTrue(t2Spy.called, 'target 2 left');
    assert.isTrue(t3Spy.called, 'target 3 left');
    assert.isTrue(t2Spy.calledWithMatch({ relatedTarget: this.target1 }), 'target 2 w/ related');
    assert.isTrue(t3Spy.calledWithMatch({ relatedTarget: this.target1 }), 'target 3 w/ related');
    assert.isFalse(t1Spy.calledWithMatch({ relatedTarget: this.target1 }), 'carried not triggered');
  });
});