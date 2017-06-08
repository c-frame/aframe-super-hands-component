/* global sinon, setup, teardown */

/**
 * __init.test.js is run before every test case.
 */
window.debug = true;

setup(function () {
  this.sinon = sinon.sandbox.create();
});

teardown(function () {
  // Clean up any attached elements.
  var attachedEls = ['canvas', 'a-assets', 'a-scene'],
    replayer;
  replayer = document.querySelector('a-scene') &&
    document.querySelector('a-scene').components &&
    document.querySelector('a-scene').components['avatar-replayer'];
  if (replayer) { replayer.isReplaying = false; }
  var els = document.querySelectorAll(attachedEls.join(','));

  for (var i = 0; i < els.length; i++) {
    els[i].parentNode.removeChild(els[i]);
  }
  this.sinon.restore();
});
