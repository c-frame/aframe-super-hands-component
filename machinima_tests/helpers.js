/* global suite */

/**
 * Helper method to create a scene, create an entity, add entity to scene,
 * add scene to document.
 *
 * @returns {object} An `<a-entity>` element.
 */
module.exports.entityFactory = function (opts, usePhysics) {
  const scene = document.createElement('a-scene')
  const assets = document.createElement('a-assets')
  const entity = document.createElement('a-entity')
  scene.appendChild(assets)
  scene.appendChild(entity)
  if (usePhysics) { scene.setAttribute('physics', '') }
  opts = opts || {}

  if (opts.assets) {
    opts.assets.forEach(function (asset) {
      assets.appendChild(asset)
    })
  }

  document.body.appendChild(scene)
  // convenience link to scene because new entities in FF don't get .sceneEl until loaded
  entity.sceneEl = scene
  return entity
}

/**
 * Creates and attaches a mixin element (and an `<a-assets>` element if necessary).
 *
 * @param {string} id - ID of mixin.
 * @param {object} obj - Map of component names to attribute values.
 * @param {Element} scene - Indicate which scene to apply mixin to if necessary.
 * @returns {object} An attached `<a-mixin>` element.
 */
module.exports.mixinFactory = function (id, obj, scene) {
  const mixinEl = document.createElement('a-mixin')
  mixinEl.setAttribute('id', id)
  Object.keys(obj).forEach(function (componentName) {
    mixinEl.setAttribute(componentName, obj[componentName])
  })

  const assetsEl = scene ? scene.querySelector('a-assets') : document.querySelector('a-assets')
  assetsEl.appendChild(mixinEl)

  return mixinEl
}

/**
 * Test that is only run locally and is skipped on CI.
 */
module.exports.getSkipCISuite = function () {
  if (window.__env__.TEST_ENV === 'ci') {
    return suite.skip
  } else {
    return suite
  }
}

/**
 * Creates and attaches a hand controller entity with a control component
 *
 * @param {object} comps - Map of component names to attribute values.
 * @param {Element} scene - Indicate which scene to apply mixin to if necessary.
 * @returns {bool} controllerOverride - Set true if comps already contains a controller component and does not need the default added.
 */
module.exports.controllerFactory = function (comps, controllerOverride, scene) {
  const contrEl = document.createElement('a-entity')
  comps = comps || {}
  if (!controllerOverride) {
    comps['vive-controls'] = 'hand: right'
  }
  Object.keys(comps).forEach(function (componentName) {
    contrEl.setAttribute(componentName, comps[componentName])
  })
  scene = scene || document.querySelector('a-scene')
  scene.appendChild(contrEl)
  return contrEl
}
