/* global assert, process, setup, suite, test */

var helpers = require('../helpers'), 
    entityFactory = helpers.entityFactory,
    recordingPath = "base/recordings/handsRecording.json";

suite('basic hands scene', function () {
  this.timeout(0);
  setup(function (done) {
    var body = document.querySelector('body'),
        sceneReg =  /<a-scene[^]+a-scene>/,
        sceneResult = sceneReg.exec(window.__html__['hands.html']),
        recorderReg = /avatar-recorder(=".*")?/;
    sceneResult = sceneResult[0]
      .replace(recorderReg, 'avatar-replayer="src:' + recordingPath + '"');
    body.innerHTML = sceneResult + body.innerHTML;
    this.scene = document.querySelector('a-scene');
    this.scene.addEventListener('loaded', e => {
      this.rhand = document.getElementById('rhand');
      this.lhand = document.getElementById('lhand');
      done();
    });
  });
  test('green boxes turn into spheres', function (done) {
    this.scene.addEventListener('replayingstopped', e => {
      assert.equal(document.getElementById('greenLow')
                   .getAttribute('geometry').primitive, 'sphere');
      assert.equal(document.getElementById('greenHigh')
                   .getAttribute('geometry').primitive, 'sphere');
      done();
    }, { once: true }); // once flag because this event emitted multiple times
  });
  test('red box is stretched & moved', function (done) {
    var rbox = document.getElementById('redHigh'),
        startPos = rbox.getAttribute('position'),
        startScale = rbox.getAttribute('scale')
    this.scene.addEventListener('replayingstopped', e => {
      assert.notDeepEqual(rbox.getAttribute('position'), startPos, 'box moved');
      assert.isTrue(rbox.getAttribute('scale').x > startScale.x, 'box grew');
      done();
    }, { once: true });
  });
});
