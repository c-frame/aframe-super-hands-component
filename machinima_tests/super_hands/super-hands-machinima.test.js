/* global assert, process, setup, suite, test */

// One scene per suite, but recordings set at the test level
var SCENE_FILE = 'hands.html';

suite('example machinima test', function () {
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
});
