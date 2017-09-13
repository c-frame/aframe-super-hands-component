/* global assert, process, setup, suite, test */

suite('progressive-controls', function () {
  // One scene per suite, but recordings set at the test level
  suite('touch interactions', function () {
    this.timeout(0); // disable Mocha timeout within tests
    setup(function (done) {
      /* inject the scene html into the testing docoument */
      const body = document.querySelector('body');
      const sceneReg = /<a-scene[^]+a-scene>/;
      const sceneRegResult = sceneReg.exec(window.__html__['hands.html']);
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
    test('basic interactions: move, sretch, hover', function (done) {
      const redBox = document.getElementById('redHigh');
      const startPos = redBox.getAttribute('position');
      const startScale = redBox.getAttribute('scale');
      this.scene.setAttribute('avatar-replayer', {
        src: 'base/recordings/handsRecording.json'
      });
      assert.equal(this.boxGrnUp.getAttribute('geometry').primitive, 'box');
      assert.equal(this.boxGrnDn.getAttribute('geometry').primitive, 'box');
      this.scene.addEventListener('replayingstopped', e => {
        var endScale = redBox.getAttribute('scale');
        assert.notDeepEqual(redBox.getAttribute('position'), startPos, 'moved');
        assert.isTrue(endScale.x > startScale.x, 'grew-x');
        assert.isTrue(endScale.y > startScale.y, 'grew-y');
        assert.isTrue(endScale.z > startScale.z, 'grew-z');
        assert.equal(
          this.boxGrnUp.getAttribute('geometry').primitive, 'sphere'
        );
        assert.equal(
          this.boxGrnDn.getAttribute('geometry').primitive, 'sphere'
        );
        assert.isFalse(this.boxGrnDn.is('hovered'));
        done();
      }, { once: true }); // once flag because this event emitted multiple times
    });
  });
  suite('progressive pointer controls', function () {
    this.timeout(0); // disable Mocha timeout within tests
    setup(function (done) {
      /* inject the scene html into the testing docoument */
      const body = document.querySelector('body');
      const sceneReg = /<a-scene[^]+a-scene>/;
      const sceneRegResult = sceneReg.exec(window.__html__['progressive-laser.html']);
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
    test('grabbable movement-at-a-distance', function (done) {
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
});
