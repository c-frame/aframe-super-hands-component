window.debug = true;
var AFRAME = require('aframe');
require('aframe-physics-system').registerAll(AFRAME);
AFRAME.registerComponent('sphere-collider', require('aframe-extras').misc['sphere-collider']);
require('aframe-event-set-component');
require('aframe-motion-capture-components');
require('../index.js');
// delayed addition of physics body component to controllers due to AFRAME 0.4.0 changes
AFRAME.registerComponent('controller-loaded', {
  init: function () {
    this.el.addEventListener('model-loaded', function () {
      this.addState('loaded');
    });
  }
});
