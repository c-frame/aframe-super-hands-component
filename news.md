## News

v1.1.0

* Compatibility with desktop mouse control via A-Frame `cursor` component
  * Added new schema property `colliderEventProperty` to configure
    where in the `event.details` to look for the collision target
  * Requires some configuration of schema properties, see new example: [Mouse Controls](https://wmurphyrd.github.io/aframe-super-hands-component/examples/#mouse)
* Select examples now have `avatar-replayer` to preview actions without needing
  VR equipment

v1.0.1

* A-Frame v0.6.0 compatibility: fixed issue with camera freezing when using
  `a-locomotor`'s automatic camera config
* Updated documentation and examples with latest versions of `aframe-extras` and
  `aframe-physics-system`.

v1.0.0

* `a-locomotor`: drop-in freedom of motion for WebVR experiences
  with this new primitive
* Maturation of A-Frame style API: Reaction components now need to cancel
  gesture events in order to communicate acceptance of the gesture to `super-hands`.
  This improves state tracking and handling of overlapping/nested
  entities
* Improved Global Event Handlers integration:
    * When overlapping entities create multiple potential targets for GEH
      events, the events fire on all potential targets
    * `click` now functions more like its mouse counterpart, only firing
      if a mouseup occurs after a mousedown and without losing collision
      with the target entity
* Two-handed grabbing: `grabbable` can now process grabs from multiple
  `super-hands` entities. In non-physics interactions, this makes passing
  entities between hands much easier. In physics-based interactions, this
  creates multiple constraints for advanced handling
* `strechable` flexibility: state tracking of hands attempting to
  stretch moved from `super-hands` to `strechable`. This should allow for
  different avatars in a multi-user setting to stretch a single entity
  cooperatively
* Added [machinima testing](https://github.com/wmurphyrd/aframe-machinima-testing)
  for automated testing based on motion-captured user input to improve
  regression detection
