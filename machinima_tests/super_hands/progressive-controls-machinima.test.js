/* global assert, process, setup, suite */

const machinima = require('aframe-machinima-testing');

suite('progressive-controls touch interactions', function () {
  setup(function (done) {
    machinima.setupScene('hands.html');
    this.scene = document.querySelector('a-scene');
    this.scene.addEventListener('loaded', e => {
      this.boxGrnUp = document.getElementById('greenHigh');
      this.boxGrnDn = document.getElementById('greenLow');
      this.boxRedUp = document.getElementById('redHigh');
      done();
    });
  });
  machinima.test(
    'basic interactions: move, sretch, hover',
    'base/recordings/handsRecording.json',
    function () {
      var endScale = this.boxRedUp.getAttribute('scale');
      assert.notDeepEqual(this.boxRedUp.getAttribute('position'), this.startPos, 'moved');
      assert.isTrue(endScale.x > this.startScale.x, 'grew-x');
      assert.isTrue(endScale.y > this.startScale.y, 'grew-y');
      assert.isTrue(endScale.z > this.startScale.z, 'grew-z');
      assert.equal(
        this.boxGrnUp.getAttribute('geometry').primitive, 'sphere'
      );
      assert.equal(
        this.boxGrnDn.getAttribute('geometry').primitive, 'sphere'
      );
      assert.isFalse(this.boxGrnDn.is('hovered'));
    },
    function () {
      this.startPos = this.boxRedUp.getAttribute('position');
      this.startScale = this.boxRedUp.getAttribute('scale');
      assert.equal(this.boxGrnUp.getAttribute('geometry').primitive, 'box');
      assert.equal(this.boxGrnDn.getAttribute('geometry').primitive, 'box');
    }
  );
});
suite('progressive pointer controls', function () {
  setup(function (done) {
    machinima.setupScene('progressive-laser.html');
    this.scene = document.querySelector('a-scene');
    this.scene.addEventListener('loaded', e => {
      this.boxGrnUp = document.getElementById('greenHigh');
      this.boxBlueUp = document.getElementById('blueHigh');
      this.boxRedUp = document.getElementById('redHigh');
      this.boxRedDn = document.getElementById('redLow');
      done();
    });
  });
  machinima.test(
    'grabbable movement-at-a-distance',
    'base/recordings/laserhands.json',
    function () {
      assert.isAbove(this.boxGrnUp.getAttribute('position').z, 2, 'Green behind');
      assert.isBelow(this.boxRedUp.getAttribute('position').y, -0.5, 'Red below');
      assert.isAbove(this.boxBlueUp.getAttribute('position').y, 3, 'Blue above');
      assert.isBelow(this.boxRedDn.getAttribute('position').x, -1, 'Red left');
    }
  );
  machinima.test(
    'button filtering',
    'base/recordings/laserhands.json',
    function () {
      assert.isAbove(this.boxGrnUp.getAttribute('position').z, 2, 'Green behind');
      assert.strictEqual(this.boxRedUp.getAttribute('position').y, 1.6, 'Red unmoved');
      assert.isAbove(this.boxBlueUp.getAttribute('position').y, 3, 'Blue above');
      assert.strictEqual(this.boxRedDn.getAttribute('position').x, 0, 'Red unmoved');
    },
    function () {
      this.boxRedUp.setAttribute('grabbable', 'startButtons: trackpaddown; endButtons: trackpadup');
      this.boxRedDn.setAttribute('grabbable', 'startButtons: trackpaddown; endButtons: trackpadup');
      this.boxGrnUp.setAttribute('grabbable', 'startButtons: triggerdown; endButtons: triggerup');
      this.boxBlueUp.setAttribute('grabbable', 'startButtons: triggerdown; endButtons: triggerup');
    }
  );
});
