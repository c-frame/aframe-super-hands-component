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
  test('hover accepted', function () {
    this.sh1.onHit({ detail: { el: this.target1 } });
    assert.strictEqual(this.sh1.hoverEls[0], this.target1);
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
    assert.strictEqual(this.sh1.carried, this.target1);
  });
  test('grab rejected', function () {
    this.sh1.onGrabStartButton();
    this.sh1.onHit({ detail: { el: this.target1 } });
    assert.notOk(this.sh1.carried);
  });
  test('ungrab event', function (done) {
    this.sh1.onGrabStartButton();
    this.target1
      .addEventListener('grab-start', evt => evt.preventDefault());
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
    assert.isOk(this.sh1.otherSuperHand);
    assert.isOk(this.sh2.otherSuperHand);
    assert.strictEqual(this.sh1.otherSuperHand, this.sh2);
    assert.strictEqual(this.sh2.otherSuperHand, this.sh1);
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
    assert.isTrue(unStretchSpy.called);
    assert.isNotOk(this.sh1.stretching);
    assert.strictEqual(this.sh2.stretched, this.target1);
    this.sh2.onStretchEndButton();
    assert.isTrue(unStretchSpy.calledOnce);
    assert.isNotOk(this.sh2.stretching);
  });
  test('drag events', function () {
    var emitSpy1 = sinon.spy(this.target1, 'emit'),
        dragOverSpy1 = emitSpy1.withArgs('dragover-start'),
        unDragOverSpy1 = emitSpy1.withArgs('dragover-end'),
        dragDropSpy1 = emitSpy1.withArgs('drag-drop'),
        emitSpy2 = sinon.spy(this.target2, 'emit'),
        dragOverSpy2 = emitSpy2.withArgs('dragover-start'),
        unDragOverSpy2 = emitSpy2.withArgs('dragover-end'),
        dragDropSpy2 = emitSpy2.withArgs('drag-drop');
    this.sh1.onDragDropStartButton();
    assert.isTrue(this.sh1.dragging, 'dragging');
    this.sh1.onHit({ detail: { el: this.target1 } });
    assert.strictEqual(this.sh1.dragged, this.target1);
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
    assert.isTrue(unDragOverSpy1.called, 'drag-over ends with drag-drop: held');
    assert.isTrue(unDragOverSpy2.called, 'drag-over ends with drag-drop: hovered');
    this.sh1.onHit({ detail: { el: this.target2 } });
    assert.isFalse(dragDropSpy1.called, 'drag-drop not yet emitted from held');
    assert.isFalse(dragDropSpy2.called, 'drag-drop not yet emitted form hovered');
    this.sh1.onDragDropEndButton();
    assert.isTrue(unDragOverSpy1.calledTwice, 'drag-over ends with drag-drop: held');
    assert.isTrue(unDragOverSpy2.calledTwice, 'drag-over ends with drag-drop: hovered');
    assert.isTrue(dragDropSpy1.called, 'drag-drop emitted from held');
    assert.isTrue(dragDropSpy2.called, 'drag-drop emitted form hovered');
  });
  test('all gestures at once capture same entity', function () {
    this.sh1.onGrabStartButton();
    this.sh1.onDragDropStartButton();
    this.sh1.onStretchStartButton();
    this.target1.addEventListener('grab-start', e => e.preventDefault());
    this.sh1.onHit({ detail: { el: this.target1 } });
    assert.equal(this.sh1.hoverEls.length, 0);
    assert.strictEqual(this.sh1.carried, this.sh1.dragged);
    assert.strictEqual(this.sh1.dragged, this.sh1.stretched);
  });
  test('drag after grab uses carried entity', function () {
    this.target1.addEventListener('grab-start', e => e.preventDefault());
    this.sh1.onGrabStartButton();
    this.sh1.onHit({ detail: { el: this.target1 } });
    this.sh1.onDragDropStartButton();
    this.sh1.onHit({ detail: { el: this.target2 } });
    assert.strictEqual(this.sh1.carried, this.sh1.dragged);
    assert.sameMembers(this.sh1.hoverEls, [this.target2]);
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
    this.hand1.setAttribute('super-hands', 
        'grabStartButtons: trackpaddown; grabEndButtons: trackpadup');
    this.hand1.emit('triggerdown', {});
    process.nextTick(() => {
      assert.isFalse(this.sh1.grabbing);
      assert.isTrue(this.sh1.stretching);
      assert.isTrue(this.sh1.dragging);
      done();
    });
  });
});