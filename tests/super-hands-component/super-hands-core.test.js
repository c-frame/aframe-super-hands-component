/* global assert, process, setup, suite, test, sinon */

const helpers = require('../helpers');
const entityFactory = helpers.entityFactory;

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
    assert.equal(
      this.el.components['super-hands'].data.colliderState,
      'collided'
    );
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
  test('hover accepted', function () {
    this.target1.addEventListener('hover-start', e => e.preventDefault());
    this.sh1.onHit({ detail: { el: this.target1 } });
    assert.strictEqual(this.sh1.state.get(this.sh1.HOVER_EVENT), this.target1);
  });
  test('hover rejected', function () {
    this.sh1.onHit({ detail: { el: this.target1 } });
    assert.notOk(this.sh1.lastHover);
  });
  test('unhover event', function (done) {
    this.target1.addEventListener('hover-start', e => e.preventDefault());
    this.target1.addState('collided');
    this.sh1.onHit({ detail: { el: this.target1 } });
    this.target1.addEventListener('hover-end', evt => {
      assert.strictEqual(evt.detail.hand, this.hand1);
      assert.strictEqual(this.sh1.hoverEls.indexOf(this.target1), -1);
      done();
    });
    this.target1.removeState('collided');
  });
  test('stacking hovered entities', function () {
    this.sh1.onHit({ detail: { el: this.target1 } });
    this.sh1.onHit({ detail: { el: this.target2 } });
    assert.equal(this.sh1.hoverEls.length, 2);
    assert.strictEqual(this.sh1.hoverEls[0], this.target1);
    this.target1.emit('stateremoved', {state: 'collided'});
    assert.equal(this.sh1.hoverEls.length, 1);
    assert.strictEqual(this.sh1.hoverEls[0], this.target2);
    this.target2.emit('stateremoved', {state: 'collided'});
    assert.equal(this.sh1.hoverEls.length, 0);
  });
  test('finding targets in the stack', function () {
    this.sh1.onHit({ detail: { el: this.target1 } });
    this.target2.addEventListener('grab-start', e => e.preventDefault());
    this.target2.addEventListener('stretch-start', e => e.preventDefault());
    this.sh1.onGrabStartButton();
    this.sh1.onStretchStartButton();
    this.sh1.onHit({ detail: { el: this.target2 } });
    assert.strictEqual(this.sh1.state.get(this.sh1.GRAB_EVENT), this.target2);
    assert.strictEqual(this.sh1.state.get(this.sh1.STRETCH_EVENT), this.target2);
  });
  test('grab event', function (done) {
    this.sh1.onGrabStartButton();
    this.target1.addEventListener('grab-start', evt => {
      assert.strictEqual(evt.detail.hand, this.hand1);
      assert.strictEqual(evt.detail.target, this.target1);
      done();
    });
    this.sh1.onHit({ detail: { el: this.target1 } });
  });
  test('grab accepted', function () {
    this.sh1.onGrabStartButton();
    this.target1.addEventListener('grab-start', evt => {
      evt.preventDefault();
    });
    this.sh1.onHit({ detail: { el: this.target1 } });
    assert.strictEqual(this.sh1.state.get(this.sh1.GRAB_EVENT), this.target1);
  });
  test('grab rejected', function () {
    this.sh1.onGrabStartButton();
    this.sh1.onHit({ detail: { el: this.target1 } });
    assert.notOk(this.sh1.state.get(this.sh1.GRAB_EVENT));
  });
  test('ungrab event', function (done) {
    this.sh1.onGrabStartButton();
    this.target1
      .addEventListener('grab-start', evt => evt.preventDefault());
    this.target1.addEventListener('grab-end', evt => {
      assert.strictEqual(evt.detail.hand, this.hand1);
      process.nextTick(() => {
        assert.isNotOk(this.sh1.state.get(this.sh1.GRAB_EVENT));
        assert.isFalse(this.sh1.grabbing);
        done();
      });
    });
    this.sh1.onHit({ detail: { el: this.target1 } });
    this.sh1.onGrabEndButton({});
  });
  test('finds other controller', function () {
    assert.isOk(this.sh1.otherSuperHand);
    assert.isOk(this.sh2.otherSuperHand);
    assert.strictEqual(this.sh1.otherSuperHand, this.sh2);
    assert.strictEqual(this.sh2.otherSuperHand, this.sh1);
  });
  test('stretch event', function () {
    // no this.sinon because cleanup causes error
    const emitSpy = sinon.spy(this.target1, 'emit');
    const stretchSpy = this.sinon.spy(this.sh2, 'emitCancelable')
        .withArgs(this.target1, 'stretch-start');
    const unStretchSpy = emitSpy.withArgs('stretch-end');
    this.target1.addEventListener('stretch-start', e => e.preventDefault());
    this.sh1.onStretchStartButton();
    this.sh1.onHit({ detail: { el: this.target1 } });
    assert.isTrue(this.sh1.stretching);
    assert.strictEqual(
      this.sh1.state.get(this.sh1.STRETCH_EVENT),
      this.target1
    );
    assert.isFalse(stretchSpy.called);
    this.sh2.onStretchStartButton();
    this.sh2.onHit({ detail: { el: this.target1 } });
    assert.isTrue(this.sh2.stretching);
    assert
      .strictEqual(this.sh2.state.get(this.sh2.STRETCH_EVENT), this.target1);
    assert.isTrue(stretchSpy.called);
    assert.isFalse(unStretchSpy.called);
    this.sh1.onStretchEndButton();
    assert.isTrue(unStretchSpy.called);
    assert.isNotOk(this.sh1.stretching);
    assert
      .strictEqual(this.sh2.state.get(this.sh2.STRETCH_EVENT), this.target1);
    this.sh2.onStretchEndButton();
    assert.isTrue(unStretchSpy.calledTwice);
    assert.isNotOk(this.sh2.stretching);
  });
  test('stretch rejected', function () {
    this.sh1.onStretchStartButton();
    this.sh1.onHit({ detail: { el: this.target1 } });
    this.sh2.onStretchStartButton();
    this.sh2.onHit({ detail: { el: this.target1 } });
    assert.notOk(this.sh2.state.get(this.sh2.STRETCH_EVENT));
  });
  test('drag accepted', function () {
    this.sh1.onDragDropStartButton();
    this.target1.addEventListener('drag-start', evt => {
      evt.preventDefault();
    });
    this.sh1.onHit({ detail: { el: this.target1 } });
    assert.strictEqual(this.sh1.state.get(this.sh1.DRAG_EVENT), this.target1);
  });
  test('drag rejected', function () {
    this.sh1.onDragDropStartButton();
    this.sh1.onHit({ detail: { el: this.target1 } });
    assert.notOk(this.sh1.state.get(this.sh1.DRAG_EVENT));
  });
  test('undrag event -- no drop target', function () {
    var dragEndSpy = this.sinon.spy();
    this.sh1.onDragDropStartButton();
    this.target1
      .addEventListener('drag-start', evt => evt.preventDefault());
    this.target1.addEventListener('drag-end', dragEndSpy);
    this.sh1.onHit({ detail: { el: this.target1 } });
    this.sh1.onDragDropEndButton({});
    assert.isTrue(dragEndSpy.calledWithMatch({ detail: {
      hand: this.hand1
    }}));
    assert.isNotOk(this.sh1.state.get(this.sh1.DRAG_EVENT));
    assert.isFalse(this.sh1.dragging);
  });

  test('drag events', function () {
    const emitSpy1 = this.sinon.spy(this.sh1, 'emitCancelable');
    const dragOverSpy1 = emitSpy1.withArgs(this.target1, 'dragover-start');
    const unDragOverSpy1 = emitSpy1.withArgs(this.target1, 'dragover-end');
    const dragDropSpy1 = emitSpy1.withArgs(this.target1, 'drag-drop');
    const dragOverSpy2 = emitSpy1.withArgs(this.target2, 'dragover-start');
    const unDragOverSpy2 = emitSpy1.withArgs(this.target2, 'dragover-end');
    const dragDropSpy2 = emitSpy1.withArgs(this.target2, 'drag-drop');
    this.sh1.onDragDropStartButton();
    this.target1.addEventListener('drag-start', e => e.preventDefault());
    this.target1.addEventListener('dragover-start', e => e.preventDefault());
    this.target2.addEventListener('dragover-start', e => e.preventDefault());
    this.target2.addEventListener('drag-drop', e => e.preventDefault());
    assert.isTrue(this.sh1.dragging, 'dragging');
    this.sh1.onHit({ detail: { el: this.target1 } });
    assert.strictEqual(this.sh1.state.get(this.sh1.DRAG_EVENT), this.target1);
    assert.isFalse(dragOverSpy1.called, 'dragover-start not emitted with no droptarget');
    assert.isFalse(dragOverSpy2.called, 'dragover-start not emitted with no droptarget');
    this.sh1.onHit({ detail: { el: this.target2 } });
    assert.notEqual(this.sh1.hoverEls.indexOf(this.target2), -1, 'droptaret added to hoverEls');
    assert.isTrue(dragOverSpy1.called, 'dragover-start emitted from held');
    assert.isTrue(dragOverSpy2.called, 'dragover-start emitted from hovered');
    this.sh1.unHover({ detail: { state: 'unrelated' }, target: this.target2 });
    assert.isFalse(unDragOverSpy1.called, 'unhover ignores unrelated state changes: held');
    assert.isFalse(unDragOverSpy2.called, 'unhover ignores unrelated state changes: hovered');
    this.sh1.unHover({ detail: { state: 'collided' }, target: this.target2 });
    assert.isTrue(unDragOverSpy1.called, 'drag-over ends with unhover: held');
    assert.isTrue(unDragOverSpy2.called, 'drag-over ends with unhover: hovered');
    this.sh1.onHit({ detail: { el: this.target2 } });
    assert.isFalse(dragDropSpy1.called, 'drag-drop not yet emitted from held');
    assert.isFalse(dragDropSpy2.called, 'drag-drop not yet emitted form hovered');
    this.sh1.onDragDropEndButton();
    assert.isTrue(unDragOverSpy1.calledTwice, 'drag-over ends with drag-drop: held');
    assert.isTrue(unDragOverSpy2.calledTwice, 'drag-over ends with drag-drop: hovered');
    assert.isTrue(dragDropSpy1.called, 'drag-drop emitted from held');
    assert.isTrue(dragDropSpy2.called, 'drag-drop emitted form hovered');
  });
  test('dragover rejected', function () {
    var dragoverSpy = this.sinon.spy(this.sh1, 'emitCancelable');
    this.sh1.onDragDropStartButton();
    this.sh1.onHit({ detail: { el: this.target1 } });
    this.sh1.onHit({ detail: { el: this.target2 } });
    assert.isFalse(dragoverSpy.calledWith(this.target1, 'dragover-start'));
  });
  test('drag-drop rejected', function () {
    var dragoverSpy = this.sinon.spy(this.sh1, 'emitCancelable');
    this.sh1.onDragDropStartButton();
    this.sh1.onHit({ detail: { el: this.target1 } });
    this.sh1.onHit({ detail: { el: this.target2 } });
    this.sh1.onDragDropEndButton();
    assert.isFalse(dragoverSpy.calledWith(this.target1, 'drag-drop'));
  });
  test('all gestures at once capture same entity', function () {
    this.sh1.onGrabStartButton();
    this.sh1.onDragDropStartButton();
    this.sh1.onStretchStartButton();
    this.target1.addEventListener('grab-start', e => e.preventDefault());
    this.target1.addEventListener('stretch-start', e => e.preventDefault());
    this.target1.addEventListener('drag-start', e => e.preventDefault());
    this.sh1.onHit({ detail: { el: this.target1 } });
    assert.equal(this.sh1.hoverEls.length, 1);
    assert.notOk(this.sh1.lastHover);
    assert.strictEqual(
      this.sh1.state.get(this.sh1.GRAB_EVENT),
      this.sh1.state.get(this.sh1.DRAG_EVENT)
    );
    assert.strictEqual(
      this.sh1.state.get(this.sh1.DRAG_EVENT),
      this.sh1.state.get(this.sh1.STRETCH_EVENT)
    );
  });
  test('drag after grab uses carried entity', function () {
    this.target3 = document.createElement('a-entity');
    this.target1.sceneEl.appendChild(this.target3);
    this.target1.addEventListener('grab-start', e => e.preventDefault());
    this.target1.addEventListener('drag-start', e => e.preventDefault());
    this.target3.addEventListener('drag-start', e => e.preventDefault());
    this.sh1.onGrabStartButton();
    this.sh1.onHit({ detail: { el: this.target3 } });
    this.sh1.onHit({ detail: { el: this.target1 } });
    this.sh1.onDragDropStartButton();
    this.sh1.onHit({ detail: { el: this.target2 } });
    assert.strictEqual(
      this.sh1.state.get(this.sh1.GRAB_EVENT),
      this.sh1.state.get(this.sh1.DRAG_EVENT)
    );
    assert.sameMembers(
      this.sh1.hoverEls,
      [this.target2, this.target1, this.target3]
    );
  });
  test('pressing button after collision', function () {
    const grabSpy = sinon.spy();
    const stretchSpy = sinon.spy();
    const dragSpy = sinon.spy();
    this.target1.addEventListener('grab-start', grabSpy);
    this.target1.addEventListener('stretch-start', stretchSpy);
    this.target1.addEventListener('drag-start', dragSpy);
    this.sh1.onHit({ detail: { el: this.target1 } });
    assert.isFalse(grabSpy.called, 'before grab button');
    this.sh1.onGrabStartButton();
    assert.isTrue(grabSpy.called, 'after grab button');
    assert.isFalse(stretchSpy.called, 'before stretch button');
    this.sh1.onStretchStartButton();
    assert.isTrue(stretchSpy.called, 'after stretch button');
    assert.isFalse(dragSpy.called, 'before drag button');
    this.sh1.onDragDropStartButton();
    assert.isTrue(dragSpy.called, 'after drag button');
  });
});

suite('custom button mapping', function () {
  setup(function (done) {
    this.target1 = entityFactory();
    this.hand1 = helpers.controllerFactory({
      'super-hands': ''
    });
    this.hand1.parentNode.addEventListener('loaded', () => {
      this.sh1 = this.hand1.components['super-hands'];
      done();
    });
  });
  test('default button mapping', function (done) {
    this.hand1.emit('triggerdown', {});
    process.nextTick(() => {
      assert.isTrue(this.sh1.grabbing);
      assert.isTrue(this.sh1.stretching);
      assert.isTrue(this.sh1.dragging);
      done();
    });
  });
  test('button mapping can be changed after init', function (done) {
    this.hand1.setAttribute(
      'super-hands',
      'grabStartButtons: trackpaddown; grabEndButtons: trackpadup'
    );
    this.hand1.emit('triggerdown', {});
    process.nextTick(() => {
      assert.isFalse(this.sh1.grabbing);
      assert.isTrue(this.sh1.stretching);
      assert.isTrue(this.sh1.dragging);
      done();
    });
  });
});

suite('state tracking', function () {
  setup(function (done) {
    this.target1 = entityFactory();
    this.target2 = entityFactory();
    this.target3 = entityFactory();
    this.hand1 = helpers.controllerFactory({
      'super-hands': ''
    });
    this.hand1.parentNode.addEventListener('loaded', () => {
      this.sh1 = this.hand1.components['super-hands'];
      done();
    });
  });
  test('hover els collected', function () {
    var targets = [this.target1, this.target2, this.target3];
    this.sh1.onHit({ detail: { el: this.target1 } });
    this.sh1.onHit({ detail: { el: this.target2 } });
    this.sh1.onHit({ detail: { el: this.target3 } });
    assert.sameMembers(this.sh1.hoverEls, targets);
    for (var i = 0; i < targets.length; i++) {
      assert.strictEqual(this.sh1.hoverEls[i], targets[i], 'member ' + i);
    }
  });
  test('hover els lifo for actions', function () {
    this.target1.addEventListener('grab-start', e => e.preventDefault());
    this.target2.addEventListener('grab-start', e => e.preventDefault());
    this.target3.addEventListener('grab-start', e => e.preventDefault());
    this.sh1.onHit({ detail: { el: this.target1 } });
    this.sh1.onHit({ detail: { el: this.target2 } });
    this.sh1.onHit({ detail: { el: this.target3 } });
    this.sh1.onGrabStartButton();
    assert.strictEqual(this.sh1.state.get(this.sh1.GRAB_EVENT), this.target3);
  });
  test('released el placed back at top of stack', function () {
    this.target1.addEventListener('grab-start', e => e.preventDefault());
    this.target2.addEventListener('grab-start', e => e.preventDefault());
    // this.target3.addEventListener('grab-start', e => e.preventDefault());
    this.sh1.onHit({ detail: { el: this.target1 } });
    this.sh1.onHit({ detail: { el: this.target2 } });
    this.sh1.onHit({ detail: { el: this.target3 } });
    this.sh1.onGrabStartButton();
    this.sh1.onGrabEndButton();
    var targets = [this.target1, this.target3, this.target2];
    assert.sameMembers(this.sh1.hoverEls, targets);
    for (var i = 0; i < targets.length; i++) {
      assert.strictEqual(this.sh1.hoverEls[i], targets[i], 'member ' + i);
    }
    this.sh1.onGrabStartButton();
    assert.strictEqual(this.sh1.state.get(this.sh1.GRAB_EVENT), this.target2);
  });
  test('hover switches to new target', function () {
    var hoverSpy1 = this.sinon.spy(e => e.preventDefault());
    var hoverEndSpy1 = this.sinon.spy();
    var hoverSpy2 = this.sinon.spy(e => e.preventDefault());
    this.target1.addEventListener('hover-start', hoverSpy1);
    this.target1.addEventListener('hover-end', hoverEndSpy1);
    this.target2.addEventListener('hover-start', hoverSpy2);
    this.sh1.onHit({ detail: { el: this.target1 } });
    assert.isTrue(hoverSpy1.called, '1st hover start');
    assert.isFalse(hoverEndSpy1.called);
    assert.isFalse(hoverSpy2.called);
    this.sh1.onHit({ detail: { el: this.target2 } });
    assert.isTrue(hoverSpy2.called, '2nd hover start');
    assert.isTrue(hoverEndSpy1.called, '1st hover end');
  });
});
