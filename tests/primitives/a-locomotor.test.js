/* global assert, process, setup, suite, test */
const helpers = require('../helpers');
const entityFactory = helpers.entityFactory;

suite('a-locomotor lifecycle', function () {
  setup(function (done) {
    var el = this.el = entityFactory();
    this.loco = document.createElement('a-locomotor');
    el.sceneEl.appendChild(this.loco);
    this.hand1 = helpers
        .controllerFactory({ 'hand-controls': 'right' }, true, this.loco);
    this.hand2 = helpers
        .controllerFactory({ 'hand-controls': 'left' }, true, this.loco);
    el.sceneEl.addEventListener('locomotor-ready', function () {
      done();
    });
  });
  test('primitive initialized without errors', function () {
    assert.isOk(document.querySelector('a-locomotor'));
  });
});

suite('a-locomotor autoconfig', function () {
  setup(function (done) {
    var el = this.el = entityFactory();
    this.loco = document.createElement('a-locomotor');
    el.sceneEl.appendChild(this.loco);
    this.hand1 = helpers.controllerFactory({
      'hand-controls': 'right',
      'sphere-collider': 'objects: .test'
    }, true, this.loco);
    this.hand2 = helpers.controllerFactory({
      'hand-controls': 'left',
      'sphere-collider': 'objects: .test'
    }, true, this.loco);
    el.sceneEl.addEventListener('locomotor-ready', function (e) {
      done();
    });
  });
  test('injects self into collider objects', function () {
    assert.notStrictEqual(
      this.hand1.getAttribute('sphere-collider').objects.indexOf('a-locomotor'),
      -1
    );
    assert.includeMembers(
      this.hand1.components['sphere-collider'].els,
      [this.loco]
    );
    assert.notStrictEqual(
      this.hand2.getAttribute('sphere-collider').objects.indexOf('a-locomotor'),
      -1
    );
    assert.includeMembers(
      this.hand2.components['sphere-collider'].els,
      [this.loco]
    );
  });
  test('captures default camera', function (done) {
    process.nextTick(() => {
      assert.strictEqual(
        document.querySelector('[camera]').parentElement,
        this.loco
      );
      done();
    });
  });
  test('grabbable setup', function () {
    const grab = this.loco.components['grabbable'];
    assert.isOk(grab);
    assert.isTrue(grab.data.invert);
    assert.isTrue(grab.data.suppressY);
  });
  test('stretchable setup', function () {
    const stretch = this.loco.components['stretchable'];
    assert.isOk(stretch);
    assert.isTrue(stretch.data.invert);
  });
});

suite('a-locomotor autoconfig options', function () {
  setup(function (done) {
    var el = this.el = entityFactory();
    this.loco = document.createElement('a-locomotor');
    this.loco.setAttribute('fetch-camera', 'false');
    this.loco.setAttribute('add-to-colliders', 'false');
    this.loco.setAttribute('allow-movement', 'false');
    this.loco.setAttribute('horizontal-only', 'false');
    this.loco.setAttribute('allow-scaling', 'false');
    el.sceneEl.appendChild(this.loco);
    this.hand1 = helpers.controllerFactory({
      'hand-controls': 'right',
      'sphere-collider': 'objects: .test'
    }, true, this.loco);
    this.hand2 = helpers.controllerFactory({
      'hand-controls': 'left',
      'sphere-collider': 'objects: .test'
    }, true, this.loco);
    el.sceneEl.addEventListener('locomotor-ready', function () {
      done();
    });
  });
  test('disabled collider config', function () {
    assert.strictEqual(
      this.hand1.getAttribute('sphere-collider').objects.indexOf('a-locomotor'),
      -1
    );
    assert.strictEqual(
      this.hand1.components['sphere-collider'].els.indexOf(this.loco),
      -1
    );
    assert.strictEqual(
      this.hand2.getAttribute('sphere-collider').objects.indexOf('a-locomotor'),
      -1
    );
    assert.strictEqual(
      this.hand2.components['sphere-collider'].els.indexOf(this.loco),
      -1
    );
  });
  test('disabled camera capture', function (done) {
    // initialization order differs when camera setup is disabled
    this.el.sceneEl.addEventListener('camera-ready', function () {
      assert.notStrictEqual(
        document.querySelector('[camera]').parentElement,
        this.loco
      );
      done();
    });
  });
  test('Not grabbable', function () {
    const grab = this.loco.components['grabbable'];
    process.nextTick(() => assert.isNotOk(grab));
  });
  test('not stretchable', function () {
    const stretch = this.loco.components['stretchable'];
    process.nextTick(() => assert.isNotOk(stretch));
  });
});

suite('a-locomotor autoconfig options: horizontal-only', function () {
  setup(function (done) {
    var el = this.el = entityFactory();
    this.loco = document.createElement('a-locomotor');
    this.loco.setAttribute('horizontal-only', 'false');
    el.sceneEl.appendChild(this.loco);
    this.hand1 = helpers.controllerFactory({
      'hand-controls': 'right',
      'sphere-collider': 'objects: .test'
    }, true, this.loco);
    this.hand2 = helpers.controllerFactory({
      'hand-controls': 'left',
      'sphere-collider': 'objects: .test'
    }, true, this.loco);
    el.sceneEl.addEventListener('locomotor-ready', function () {
      done();
    });
  });
  test('Vertical movement allowed', function () {
    const grab = this.loco.components['grabbable'];
    assert.isOk(grab);
    assert.isFalse(grab.data.suppressY, 'vertical movement allowed');
    assert.isTrue(grab.data.invert);
  });
});
