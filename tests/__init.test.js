/* global sinon, setup, teardown */

/**
 * __init.test.js is run before every test case.
 */
window.debug = true

navigator.getVRDisplays = function () {
  const resolvePromise = Promise.resolve()
  const mockVRDisplay = {
    cancelAnimationFrame: function (h) { return window.cancelAnimationFrame(1) },
    capabilities: {},
    exitPresent: resolvePromise,
    getPose: function () { return { orientation: null, position: null } },
    requestAnimationFrame: function () { return 1 },
    requestPresent: resolvePromise,
    submitFrame: function () { }
  }
  return Promise.resolve([mockVRDisplay])
}

const AScene = require('aframe').AScene
// Make sure WebGL context is not created since Travix CT runs headless.
// Stubs below failed once in a while due to asynchronous tesst setup / teardown.
AScene.prototype.setupRenderer = function () { }

setup(function () {
  this.sinon = sinon.createSandbox()
  // Stubs to not create a WebGL context since Travis CI runs headless.
  this.sinon.stub(AScene.prototype, 'render')
  this.sinon.stub(AScene.prototype, 'setupRenderer')
  // Mock renderer.
  AScene.prototype.renderer = {
    xr: {
      getDevice: function () { return { requestPresent: function () { } } },
      isPresenting: function () { return true },
      setDevice: function () { },
      setFoveation: function () { },
      setPoseTarget: function () { },
      dispose: function () { },
      enabled: false
    },
    dispose: function () { },
    getContext: function () { return undefined },
    setAnimationLoop: function () { },
    setSize: function () { },
    setPixelRatio: function () { },
    render: function () { },
    shadowMap: { enabled: false }
  }
})

// Ensure that uncaught exceptions between tests result in the tests failing.
// This works around an issue with mocha / karma-mocha, see
// https://github.com/karma-runner/karma-mocha/issues/227
let pendingError = null
let pendingErrorNotice = null

window.addEventListener('error', event => {
  pendingError = event.error
  pendingErrorNotice = 'An uncaught exception was thrown between tests'
})
window.addEventListener('unhandledrejection', event => {
  pendingError = event.reason
  pendingErrorNotice = 'An uncaught promise rejection occurred between tests'
})

teardown(function (done) {
  // Clean up any attached elements.
  const attachedEls = ['canvas', 'a-assets', 'a-scene']
  const els = document.querySelectorAll(attachedEls.join(','))
  for (let i = 0; i < els.length; i++) {
    els[i].parentNode.removeChild(els[i])
  }
  this.sinon.restore()

  // Allow detachedCallbacks to clean themselves up.
  setTimeout(function () {
    done()
  })

  if (pendingError) {
    console.error(pendingErrorNotice)
    throw pendingError
  }
})
