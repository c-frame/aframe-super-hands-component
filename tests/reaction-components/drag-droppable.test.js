/* global assert, process, setup, suite, test */

var entityFactory = require('../helpers').entityFactory;

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
    this.comp.start({ detail: { hand: this.hand } });
    assert.isTrue(this.el.is('dragover'));
    this.comp.end({ detail: { hand: this.hand } });
    assert.isFalse(this.el.is('dragover'));
  });  
});

suite('drag-droppable GlobalEventHandler integration', function () {
  setup(function (done) {
    var el = this.el = entityFactory();
    this.carried = document.createElement('a-entity');
    this.el.parentNode.appendChild(this.carried);
    el.setAttribute('drag-droppable', '');
    el.addEventListener('loaded', evt => {
      this.comp = el.components['drag-droppable'];
      done();
    });
  });
  test('integrates with GlobalEventHandler dragenter', function (done) {
    this.el.ondragenter = e => {
      assert.typeOf(e, 'MouseEvent');
      assert.strictEqual(e.target, this.el);
      assert.strictEqual(e.relatedTarget, this.carried);
      done();
    }
    this.comp.start({ detail: { 
      hand: this.hand, 
      carried: this.carried,
      hovered: this.el
    } });
  });
  test('integrates with GlobalEventHandler dragleave', function (done) {
    this.el.ondragleave = e => {
      assert.typeOf(e, 'MouseEvent');
      assert.strictEqual(e.target, this.el);
      assert.strictEqual(e.relatedTarget, this.carried);
      done();
    }
    this.comp.end({ detail: { 
      hand: this.hand, 
      carried: this.carried,
      hovered: this.el
    } });
  });
  test('integrates with GlobalEventHandler drop', function (done) {
    this.el.ondrop = e => {
      assert.typeOf(e, 'MouseEvent');
      assert.strictEqual(e.target, this.el);
      assert.strictEqual(e.relatedTarget, this.carried);
      done();
    }
    this.el.emit('drag-drop', { 
      hand: this.hand, 
      dropped: this.carried,
      on: this.el
    });
  });
 test('integrates with GlobalEventHandler drop, when component is on the dragee', function (done) {
    this.el.ondrop = e => {
      assert.typeOf(e, 'MouseEvent');
      assert.strictEqual(e.target, this.el);
      assert.strictEqual(e.relatedTarget, this.carried);
      done();
    }
    this.el.emit('drag-drop', { 
      hand: this.hand, 
      dropped: this.el,
      on: this.carried
    });
  });
});