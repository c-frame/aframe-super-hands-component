/* global assert, process, setup, suite, test */
const helpers = require('../helpers');
const entityFactory = helpers.entityFactory;

suite('drag-droppable', function () {
  setup(function (done) {
    var el = this.el = entityFactory();
    el.setAttribute('drag-droppable', '');
    el.addEventListener('loaded', evt => {
      this.comp = el.components['drag-droppable'];
      done();
    });
  });
  test('component attaches without errors', function () {
    assert.isOk(this.el.components['drag-droppable']);
  });
  test('component removes without errors', function (done) {
    var el = this.el;
    el.removeComponent('drag-droppable');
    process.nextTick(function () {
      assert.notOk(el.components['drag-droppable']);
      done();
    });
  });
  test('el gains and loses dragover state', function () {
    this.el.emit('dragover-start', { hand: this.hand });
    assert.isTrue(this.el.is('dragover'));
    this.el.emit('dragover-end', { hand: this.hand });
    assert.isFalse(this.el.is('dragover'));
  });
  test('el gains and loses dragged state', function () {
    this.el.emit('drag-start', { hand: this.hand });
    assert.isTrue(this.el.is('dragged'));
    this.el.emit('drag-end', { hand: this.hand });
    assert.isFalse(this.el.is('dragged'));
  });
});
suite('drag-droppable button mapping', function () {
  setup(function (done) {
    var el = this.el = entityFactory();
    this.hand = helpers.controllerFactory({'super-hands': ''});
    el.setAttribute('drag-droppable',
        'startButtons: triggerdown; endButtons: triggerup');
    el.addEventListener('loaded', () => {
      this.comp = el.components['drag-droppable'];
      done();
    });
  });
  test('responds to correct buttons', function () {
    const dtl = {hand: this.hand, buttonEvent: {type: 'gripdown'}};
    // reject wrong button start
    assert.isOk(helpers.emitCancelable(this.el, this.comp.DRAG_EVENT, dtl));
    assert.isNotOk(this.el.is(this.comp.DRAGGED_STATE));
    // accept correct button start
    dtl.buttonEvent.type = 'triggerdown';
    assert.isNotOk(helpers.emitCancelable(this.el, this.comp.DRAG_EVENT, dtl));
    assert.isOk(this.el.is(this.comp.DRAGGED_STATE));
    // reject wrong button end
    assert.isOk(helpers.emitCancelable(this.el, this.comp.UNDRAG_EVENT, dtl));
    assert.isOk(this.el.is(this.comp.DRAGGED_STATE));
    // accpect correct button end
    dtl.buttonEvent.type = 'triggerup';
    assert.isNotOk(helpers.emitCancelable(this.el, this.comp.UNDRAG_EVENT, dtl));
    assert.isNotOk(this.el.is(this.comp.DRAGGED_STATE));
  });
});
