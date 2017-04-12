/* global assert, process, setup, suite, test */

var helpers = require('../helpers'), 
    entityFactory = helpers.entityFactory,
    recordingPath = "base/machinima_tests/recordings/handsRecording.json";

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
  test('boxes turn into spheres', function (done) {
    assert.equal(document.getElementById('greenLow') 
                 .getAttribute('geometry').primitive, 'box');
    assert.equal(document.getElementById('greenHigh')
                 .getAttribute('geometry').primitive, 'box');
    this.rhand.addEventListener('replayingstopped',e => {
      assert.equal(document.getElementById('greenLow')
                   .getAttribute('geometry').primitive, 'sphere');
      assert.equal(document.getElementById('greenHigh')
                   .getAttribute('geometry').primitive, 'sphere');
      done();
    });
  });
});
