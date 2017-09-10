require('../index.js');
require('aframe-motion-capture-components');
/* used in examples to allow a desktop playback without HMD
   defined here to keep example files clear of clutter */
window.playDemoRecording = function (spectate) {
  let l = document.querySelector('a-link, a-entity[link]');
  let s = document.querySelector('a-scene');
  l.setAttribute('visible', 'false');
  s.addEventListener('replayingstopped', e => {
    let c = document.querySelector('[camera]');
    window.setTimeout(function () {
      console.log('reset camera');
      c.setAttribute('position', '0 1.6 2');
      c.setAttribute('rotation', '0 0 0');
    });
  });
  s.setAttribute('avatar-replayer', {
    src: './demo-recording.json',
    spectatorMode: spectate === undefined ? true : spectate,
    spectatorPosition: {x: 0, y: 1.6, z: 2}
  });
};
