/* global AFRAME */
var extendDeep = AFRAME.utils.extendDeep
// The mesh mixin provides common material properties for creating mesh-based primitives.
// This makes the material component a default component and maps all the base material properties.
var meshMixin = AFRAME.primitives.getMeshMixin()
AFRAME.registerPrimitive('a-locomotor', extendDeep({}, meshMixin, {
  // Preset default components. These components and component properties will be attached to the entity out-of-the-box.
  defaultComponents: {
    grabbable: {
      usePhysics: 'never',
      invert: true,
      suppressY: true
    },
    stretchable: {
      invert: true
    },
    'locomotor-auto-config': {}
  },
  mappings: {
    'fetch-camera': 'locomotor-auto-config.camera',
    'allow-movement': 'locomotor-auto-config.move',
    'horizontal-only': 'grabbable.suppressY',
    'allow-scaling': 'locomotor-auto-config.stretch'
  }
}))
