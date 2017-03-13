/* global assert, process, setup, suite, test */

var helpers = require('../helpers'), 
    entityFactory = helpers.entityFactory;

suite('super-hands & reaction component integration', function () {
  setup(function (done) {
    this.target1 = entityFactory();
    this.target1.setAttribute('grabbable', '');
    this.target1.setAttribute('hoverable', '');
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
});