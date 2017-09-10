/* global assert, process, setup, suite, test, sinon */

// One scene per suite, but recordings set at the test level
var SCENE_FILE = 'hands.html';

suite('basic interactions', function () {
  this.timeout(0); // disable Mocha timeout within tests
  setup(function (done) {
    /* inject the scene html into the testing docoument */
    const body = document.querySelector('body');
    const sceneReg = /<a-scene[^]+a-scene>/;
    const sceneRegResult = sceneReg.exec(window.__html__[SCENE_FILE]);
    const recorderReg = /avatar-recorder(=".*")?/;
    const sceneResult = sceneRegResult[0]
      .replace(recorderReg, 'avatar-replayer');
    body.innerHTML = sceneResult + body.innerHTML;
    this.scene = document.querySelector('a-scene');
    this.scene.addEventListener('loaded', e => {
      this.boxGrnUp = document.getElementById('greenHigh');
      this.boxGrnDn = document.getElementById('greenLow');
      done();
    });
  });
  test('green boxes turn into spheres', function (done) {
    this.scene.setAttribute('avatar-replayer', {
      src: 'base/recordings/handsRecording.json'
    });
    assert.equal(this.boxGrnUp.getAttribute('geometry').primitive, 'box');
    assert.equal(this.boxGrnDn.getAttribute('geometry').primitive, 'box');
    this.scene.addEventListener('replayingstopped', e => {
      assert.equal(
        this.boxGrnUp.getAttribute('geometry').primitive, 'sphere'
      );
      assert.equal(
        this.boxGrnDn.getAttribute('geometry').primitive, 'sphere'
      );
      done();
    }, { once: true }); // once flag because this event emitted multiple times
  });
  test('red box is stretched & moved', function (done) {
    const redBox = document.getElementById('redHigh');
    const startPos = redBox.getAttribute('position');
    const startScale = redBox.getAttribute('scale');
    this.scene.setAttribute('avatar-replayer', {
      src: 'base/recordings/handsRecording.json'
    });
    this.scene.addEventListener('replayingstopped', e => {
      var endScale = redBox.getAttribute('scale');
      assert.notDeepEqual(redBox.getAttribute('position'), startPos, 'moved');
      assert.isTrue(endScale.x > startScale.x, 'grew-x');
      assert.isTrue(endScale.y > startScale.y, 'grew-y');
      assert.isTrue(endScale.z > startScale.z, 'grew-z');
      done();
    }, { once: true });
  });
  test('carried entities unhovers properly after drag-drop', function (done) {
    this.scene.setAttribute('avatar-replayer', {
      src: 'base/recordings/leftoverHover.json'
    });
    this.scene.addEventListener('replayingstopped', e => {
      assert.isFalse(this.boxGrnUp.is('hovered'));
      assert.isFalse(this.boxGrnDn.is('hovered'));
      done();
    }, { once: true });
  });
  /* the two super-hands both trigger unHover when one collider detects
     its collision has ended, and there is no way to distinguish which
     collider is the cause, so hover will be lost for one tick when either
     hand exits
  */
  test.skip('hover persist when hands overlap', function (done) {
    const unHoverSpy = sinon
      .spy(this.boxGrnUp, 'removeState'); // no sinon cleanup
    unHoverSpy.withArgs('hovered');
    this.scene.setAttribute('avatar-replayer', {
      src: 'base/recordings/multihover.json'
    });
    this.scene.addEventListener('replayingstopped', e => {
      assert.equal(unHoverSpy.withArgs('hovered').callCount, 1);
      done();
    }, { once: true });
  });
  test('regrabbing after release does not leave abandoned hover', function (done) {
    this.scene.setAttribute('avatar-replayer', {
      src: 'base/recordings/regrab.json'
    });
    this.scene.addEventListener('replayingstopped', e => {
      assert.isFalse(this.boxGrnUp.is('hovered'), 'upper box');
      assert.isFalse(this.boxGrnDn.is('hovered'), 'lower box');
      done();
    }, { once: true });
  });
  test('regrabbing after release grabs same entity', function (done) {
    var dnStartPos = this.boxGrnDn.getAttribute('position');
    this.scene.setAttribute('avatar-replayer', {
      src: 'base/recordings/regrab.json'
    });
    this.scene.addEventListener('replayingstopped', e => {
      assert.deepEqual(this.boxGrnDn.getAttribute('position'), dnStartPos);
      done();
    }, { once: true });
  });
  test('No stray hover after drag-drop', function (done) {
    this.scene.setAttribute('avatar-replayer', {
      src: 'base/recordings/handsRecording.json'
    });
    this.scene.addEventListener('replayingstopped', e => {
      assert.isFalse(this.boxGrnDn.is('hovered'));
      done();
    }, { once: true });
  });
  test('Pass betwen hands with two-handed grab', function (done) {
    this.scene.setAttribute('avatar-replayer', {
      src: 'base/recordings/hands-twoHandedPass.json'
    });
    this.scene.addEventListener('replayingstopped', e => {
      assert.isAbove(this.boxGrnUp.getAttribute('position').z, 0.5);
      done();
    }, { once: true });
  });
  test('Two-handed pass fails if 2nd hand moved out of range', function (done) {
    // disable stretching so hand can leave collision zone while grabbing
    this.boxGrnUp.components['stretchable'].remove();
    this.scene.setAttribute('avatar-replayer', {
      src: 'base/recordings/hands-nostretch-badTwoHandedGrab.json'
    });
    this.scene.addEventListener('replayingstopped', e => {
      assert.isBelow(this.boxGrnUp.getAttribute('position').z, -0.8);
      assert.isFalse(this.boxGrnUp.components['grabbable'].grabbed);
      assert.strictEqual(this.boxGrnUp.components['grabbable'].grabbers.length, 0);
      done();
    }, { once: true });
  });
});

suite('Nested object targeting', function () {
  this.timeout(0); // disable Mocha timeout within tests
  setup(function (done) {
    /* inject the scene html into the testing docoument */
    const body = document.querySelector('body');
    const sceneReg = /<a-scene[^]+a-scene>/;
    const sceneRegResult = sceneReg.exec(window.__html__['nested.html']);
    const recorderReg = /avatar-recorder(=".*")?/;
    const sceneResult = sceneRegResult[0]
      .replace(recorderReg, 'avatar-replayer');
    body.innerHTML = sceneResult + body.innerHTML;
    this.scene = document.querySelector('a-scene');
    this.scene.addEventListener('loaded', e => {
      this.outter = document.getElementById('outter');
      this.middle = document.getElementById('middle');
      this.inner = document.getElementById('inner');
      done();
    });
  });
  test('able to move nested entities', function (done) {
    this.scene.setAttribute('avatar-replayer', {
      src: 'base/recordings/nested-grab.json'
    });
    this.scene.addEventListener('replayingstopped', e => {
      assert.isAbove(this.inner.getAttribute('position').y, 2);
      assert.isBelow(this.middle.getAttribute('position').y, 0);
      assert.deepEqual(this.outter.getAttribute('position'), {x: 0, y: 1, z: -1});
      done();
    }, { once: true });
  });
});
suite('Physics grab', function () {
  this.timeout(0); // disable Mocha timeout within tests
  setup(function (done) {
    /* inject the scene html into the testing docoument */
    const body = document.querySelector('body');
    const sceneReg = /<a-scene[^]+a-scene>/;
    const sceneRegResult = sceneReg.exec(window.__html__['physics.html']);
    const recorderReg = /avatar-recorder(=".*")?/;
    const sceneResult = sceneRegResult[0]
      .replace(recorderReg, 'avatar-replayer');
    body.innerHTML = sceneResult + body.innerHTML;
    this.scene = document.querySelector('a-scene');
    this.hand1 = document.getElementById('rhand');
    this.hand2 = document.getElementById('lhand');
    this.target = document.getElementById('target');
    this.scene.addEventListener('loaded', e => {
      done();
    });
  });
  test('entity affected by two constraints', function (done) {
    var yRot;
    this.scene.setAttribute('avatar-replayer', {
      src: 'base/recordings/physics-twoHandedTwist.json'
    });
    this.scene.addEventListener('replayingstopped', e => {
      assert.isAbove(Math.abs(yRot), 0.3);
      done();
    }, {once: true});
    this.target.addEventListener('grab-end', e => {
      yRot = this.target.getObject3D('mesh').getWorldRotation()._y;
    }, {once: true});
  });
});

suite('Locomotion', function () {
  this.timeout(0);
  setup(function (done) {
    /* inject the scene html into the testing docoument */
    const body = document.querySelector('body');
    const sceneReg = /<a-scene[^]+a-scene>/;
    const sceneRegResult = sceneReg.exec(window.__html__['locomotor.html']);
    const recorderReg = /avatar-recorder(=".*")?/;
    const sceneResult = sceneRegResult[0]
      .replace(recorderReg, 'avatar-replayer');
    body.innerHTML = sceneResult + body.innerHTML;
    this.scene = document.querySelector('a-scene');
    this.scene.addEventListener('loaded', e => {
      done();
    });
  });
  test('player location moves', function (done) {
    this.scene.setAttribute('avatar-replayer', {
      src: 'base/recordings/hands-worldMover.json'
    });
    this.scene.addEventListener('replayingstopped', e => {
      let z = document.querySelector('[camera]')
        .object3DMap.camera.getWorldPosition().z;
      assert.isBelow(z, 0.5, 'camera ending z position');
      done();
    }, { once: true }); // once flag because this event emitted multiple times
  });
  test('player scale changes', function (done) {
    this.scene.setAttribute('avatar-replayer', {
      src: 'base/recordings/locomotor-worldScaleGrowShrink.json'
    });
    this.scene.addEventListener('grab-end', e => {
      var camScale = document.querySelector('[camera]')
          .object3DMap.camera.getWorldScale();
      assert.isBelow(camScale.x, 1, 'scaled up');
      assert.isBelow(camScale.y, 1, 'scaled up');
      assert.isBelow(camScale.z, 1, 'scaled up');
      this.scene.addEventListener('replayingstopped', e => {
        let newCamScale = document.querySelector('[camera]')
          .object3DMap.camera.getWorldScale();
        assert.isAbove(newCamScale.x, camScale.x, 'camera scales back down');
        assert.isAbove(newCamScale.y, camScale.y, 'camera scales back down');
        assert.isAbove(newCamScale.z, camScale.z, 'camera scales back down');
        done();
      }, {once: true}); // once flag because this event emitted multiple times
    }, {once: true});
  });
  test('locomotor does not interfere with normal interactions', function (done) {
    const boxGreenTop = document.getElementById('greenHigh');
    const boxGreenBottom = document.getElementById('greenLow');
    const redBox = document.getElementById('redHigh');
    const startPos = redBox.getAttribute('position');
    const startScale = redBox.getAttribute('scale');
    this.scene.setAttribute('avatar-replayer', {
      src: 'base/recordings/handsRecording.json'
    });
    assert.equal(boxGreenTop.getAttribute('geometry').primitive, 'box');
    assert.equal(boxGreenBottom.getAttribute('geometry').primitive, 'box');
    this.scene.addEventListener('replayingstopped', e => {
      var endScale = redBox.getAttribute('scale');
      assert.notDeepEqual(redBox.getAttribute('position'), startPos, 'moved');
      assert.isTrue(endScale.x > startScale.x, 'grew-x');
      assert.isTrue(endScale.y > startScale.y, 'grew-y');
      assert.isTrue(endScale.z > startScale.z, 'grew-z');
      assert.equal(boxGreenTop.getAttribute('geometry').primitive, 'sphere');
      assert.equal(boxGreenBottom.getAttribute('geometry').primitive, 'sphere');
      done();
    }, { once: true }); // once flag because this event emitted multiple times
  });
});
suite('camera userHeight', function () {
  this.timeout(0);
  setup(function (done) {
    /* inject the scene html into the testing docoument */
    const body = document.querySelector('body');
    const sceneReg = /<a-scene[^]+a-scene>/;
    const sceneRegResult = sceneReg.exec(window.__html__['locomotor.html']);
    const recorderReg = /avatar-recorder(=".*")?/;
    const sceneResult = sceneRegResult[0]
      .replace(recorderReg, '');
    body.innerHTML = sceneResult + body.innerHTML;
    this.scene = document.querySelector('a-scene');
    this.scene.addEventListener('camera-ready', e => {
      done();
    });
  });
  test('camera userHeight preserved', function () {
    assert.isAbove(
      document.querySelector('[camera]').object3D.getWorldPosition().y,
      1
    );
  });
});

suite('laser-controls grabbable', function () {
  this.timeout(0); // disable Mocha timeout within tests
  setup(function (done) {
    /* inject the scene html into the testing docoument */
    const body = document.querySelector('body');
    const sceneReg = /<a-scene[^]+a-scene>/;
    const sceneRegResult = sceneReg.exec(window.__html__['hands-laser.html']);
    const recorderReg = /avatar-recorder(=".*")?/;
    const sceneResult = sceneRegResult[0]
      .replace(recorderReg, 'avatar-replayer');
    body.innerHTML = sceneResult + body.innerHTML;
    this.scene = document.querySelector('a-scene');
    this.scene.addEventListener('loaded', e => {
      this.boxGrnUp = document.getElementById('greenHigh');
      this.boxBlueUp = document.getElementById('blueHigh');
      this.boxRedUp = document.getElementById('redHigh');
      this.boxRedDn = document.getElementById('redLow');
      done();
    });
  });
  test('green boxes turn into spheres', function (done) {
    this.scene.setAttribute('avatar-replayer', {
      src: 'base/recordings/laserhands.json',
      spectatorMode: true,
      spectatorPosition: '0 1.6 5'
    });
    this.scene.addEventListener('replayingstopped', e => {
      assert.isAbove(this.boxGrnUp.getAttribute('position').z, 2, 'Green behind');
      assert.isBelow(this.boxRedUp.getAttribute('position').y, -0.5, 'Red below');
      assert.isAbove(this.boxBlueUp.getAttribute('position').y, 3, 'Blue above');
      assert.isBelow(this.boxRedDn.getAttribute('position').x, -1, 'Red left');
      done();
    }, { once: true }); // once flag because this event emitted multiple times
  });
});
