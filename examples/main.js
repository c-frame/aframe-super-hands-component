require('aframe')
require('../index.js')
// require('aframe-motion-capture-components')
/* used in examples to allow a desktop playback without HMD
   defined here to keep example files clear of clutter */
window.playDemoRecording = function (spectate) {
  const l = document.querySelector('a-link, a-entity[link]')
  const s = document.querySelector('a-scene')
  const b = document.getElementById('replayer-button')
  b && b.setAttribute('visible', 'false')
  l && l.setAttribute('visible', 'false')
  s.addEventListener('replayingstopped', e => {
    const c = document.querySelector('[camera]')
    window.setTimeout(function () {
      c.setAttribute('position', '0 1.6 2')
      c.setAttribute('rotation', '0 0 0')
    })
  })
  s.setAttribute('avatar-replayer', {
    src: './demo-recording.json',
    spectatorMode: spectate === undefined ? true : spectate,
    spectatorPosition: { x: 0, y: 1.6, z: 2 }
  })
}
