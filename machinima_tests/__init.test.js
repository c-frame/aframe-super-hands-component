/* global sinon, setup, teardown */
const machinima = require('aframe-machinima-testing')
/**
 * __init.test.js is run before every test case.
 */
window.debug = true

setup(function () {
  this.sinon = sinon.sandbox.create()
})

teardown(function () {
  machinima.teardownReplayer()
  // Clean up any attached elements.
  const attachedEls = ['canvas', 'a-assets', 'a-scene']
  const els = document.querySelectorAll(attachedEls.join(','))

  for (let i = 0; i < els.length; i++) {
    els[i].parentNode.removeChild(els[i])
  }
  this.sinon.restore()
})
