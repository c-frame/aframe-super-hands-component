## News

v3.0.5
* Add instanceId to Object3D.userData if available
* Add instruction to use superhands with aframe 1.5.0 and onward

v3.0.4
* A-Frame 1.4.0 support confirmation
  * Updated dependencies and fixed tests and examples
  * No API changes

v3.0.3
* A-Frame 1.3.0 support confirmation
  * Updated dependencies and fixed tests and examples
  * No API changes

v3.0.1

* A-Frame 1.0.4 support confirmation
  * Updated dependencies and fixed tests
  * No notable changes

v3.0.0

* The 'Less is More' update. This package has scope has been narrowed to keep
  it maintainable, increase the frequency of updates, and allow for focus on
  implementing new gestures instead of peripheral components.
  * `progressive-controls` and `a-locomotor` removed from this repo.
    I understand `progressive-controls` was fairly popular, but is has a
    [compatibility issue](https://github.com/aframevr/aframe/issues/3610)
    with the latest A-Frame which was holding up releases for the entire
    package.
    I intend to refactor it and release it in another library, but you can
    still use the last version by including
    [its source file](https://github.com/c-frame/aframe-super-hands-component/blob/dc1a601b7fa9d606a05ec2d3500f8f141c65c20c/misc_components/progressive-controls.js) in your project.
* Smarter raycasting support: chooses nearest intersected entity first,
  reordering stack as distances change (\* if the raycaster in use updates
  intersection objects' distances)
* Improved nested entity handling: only one component can react to each
  gesture event.
* Improved stretching of complex physics bodies: all shapes, child entity
  shapes, and offsets are updated
* Added support for `'worker'` and other `aframe-physics-system` drivers
  in `grabbable`
* v2.x deprecations removed: `drag-droppable` component and
  `super-hands.colliderState` property.

v2.1.0

* A-Frame v0.8.0 (WIP/master branch) support
* Deprecate `super-hands.colliderState`
  * `colliderEndEvent` and `colliderEndEventProperty` now supported by
    `sphere-collider`
* Deprecate `drag-droppable`; replace with separate `draggable` and `droppable`
  reaction components. `droppable` can selectively accept or reject attempted
  'drag-drop' gestures depending on the entity being dropped on it.
* `progressive-controls` updates
  * Use mixins for customization
  * Remove extra controller on ground from single controller setups
  * Add `controllerModel` option to bypass default controller models

v2.0.2

* A-Frame v0.7.0 and master support
* Implement [aframe-machinima-testing](https://github.com/wmurphyrd/aframe-machinima-testing)
  for automated functional testing using motion captured user input
* Bug fixes:
  * Improved handling of touch (eliminate doubled events)
  * Fix odd behavior of repeatedly or simultaneously grabbed objects

v2.0.1

* Bug fixes:
  * `'mouseup'` now fires correctly on target entities
  * Fixed lingering hover when `progressive-controls` advances from gaze mode
  * Fixed lingering hovers when `progressive-controls` in point mode
  * Fixed some new files being excluded from babelify & breaking uglify

v2.0.0

* Consistent experience across devices: `super-hands` now provides interactivity
  for all levels of VR controls: desktop mouse, mobile touch ("magic window"),
  cardboard button,
  3DOF (GearVR and Daydram), and 6DOF (Vive and Oculus Touch)
  * `progressive-controls` meta-component to automatically setup interactive
    controls on **any** device from desktop to Vive
  * Upgraded `grabbable` reaction component.
    * Now works with pointing and moving at a distance, e.g. with
      3DOF controllers and `laser-controls`, using controller orientation
      and position to move grabbed entities
* Button mapping for reaction components: each reaction component now has
  `startButtons` and `endButtons` schema properties to specify acceptable
  buttons. This allows different entities to react to different buttons.
  [For example](https://c-frame.github.io/aframe-super-hands-component/examples/#sticky)
  `a-locomotor`'s `grabbable` can be set to respond to different
  buttons than other `grabbable` entities so that
  grabbing entities and locomotion are separate gestures for the user.
* `a-locomotor` now functions independently from colliders;
  removed `add-to-colliders` attribute.
* Performance improvements in `grabbable` and `stretchable`
* Gesture initiation changed to occur only on button press rather than
  button press and collision. Pressing a button in empty space and then
  moving into an object will no long scoop it up in a grab.

v1.1.0

* Compatibility with desktop mouse control via A-Frame `cursor` component
  * Added new schema property `colliderEventProperty` to configure
    where in the `event.details` to look for the collision target
  * Requires some configuration of schema properties, see new example: [Mouse Controls](https://c-frame.github.io/aframe-super-hands-component/examples/#mouse)
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
