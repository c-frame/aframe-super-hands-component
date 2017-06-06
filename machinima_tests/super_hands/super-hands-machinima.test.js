/* global assert, process, setup, suite, test */

// One scene per suite, but recordings set at the test level
var SCENE_FILE = 'hands.html';

suite('basic interactions', function () {
  this.timeout(0); // disable Mocha timeout within tests
  setup(function (done) {
    /* inject the scene html into the testing docoument */
    var body = document.querySelector('body'),
        sceneReg =  /<a-scene[^]+a-scene>/,
        sceneResult = sceneReg.exec(window.__html__[SCENE_FILE]),
        recorderReg = /avatar-recorder(=".*")?/;
    // set avatar-replayer to use the specified recoring file
    sceneResult = sceneResult[0]
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
    var boxGreenTop = document.getElementById('greenHigh'),
        boxGreenBottom = document.getElementById('greenLow');
    this.scene.setAttribute('avatar-replayer', { 
      src: 'base/recordings/handsRecording.json' 
    });
    assert.equal(boxGreenTop.getAttribute('geometry').primitive, 'box');
    assert.equal(boxGreenBottom.getAttribute('geometry').primitive, 'box');
    this.scene.addEventListener('replayingstopped', e => {
      assert.equal(boxGreenTop.getAttribute('geometry').primitive, 'sphere');
      assert.equal(boxGreenBottom.getAttribute('geometry').primitive, 'sphere');
      done();
    }, { once: true }); // once flag because this event emitted multiple times
  });
  test('red box is stretched & moved', function (done) {
    var redBox = document.getElementById('redHigh'),
        startPos = redBox.getAttribute('position'),
        startScale = redBox.getAttribute('scale');
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
    var unHoverSpy = sinon.spy(this.boxGrnUp, 'removeState'); //no sinon cleanup
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
    //this.boxGrnUp.removeAttribute('stretchable');
    //assert.isNotOk(this.boxGrnUp.components['stretchable']);
    //disable stretching to observe a hand leaving collision zone while grabbing
    this.boxGrnUp.components['stretchable'].remove();
    this.scene.setAttribute('avatar-replayer', { 
      src: 'base/recordings/hands-nostretch-badTwoHandedGrab.json' 
    });
    this.scene.addEventListener('replayingstopped', e => {
      assert.isBelow(this.boxGrnUp.getAttribute('position').z, 0.5);
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
    var body = document.querySelector('body'),
        sceneReg =  /<a-scene[^]+a-scene>/,
        sceneResult = sceneReg.exec(window.__html__['nested.html']),
        recorderReg = /avatar-recorder(=".*")?/;
    // set avatar-replayer to use the specified recoring file
    sceneResult = sceneResult[0]
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
    var body = document.querySelector('body'),
        sceneReg =  /<a-scene[^]+a-scene>/,
        sceneResult = sceneReg.exec(window.__html__['physics.html']),
        recorderReg = /avatar-recorder(=".*")?/;
    // set avatar-replayer to use the specified recoring file
    sceneResult = sceneResult[0]
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
  test('entity affected by two contraints', function (done) {
    this.scene.setAttribute('avatar-replayer', { 
      src: 'base/recordings/physics-twoHandedTwist.json' 
    });
    this.target.addEventListener('grab-end', e => {
      let yRot = this.target.getObject3D('mesh').getWorldRotation()._y
      assert.isBelow(yRot, -0.3);
      done();
    }, { once: true }); 
  });
});

