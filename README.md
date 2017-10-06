# Super Hands

[![Build Status](https://travis-ci.org/wmurphyrd/aframe-super-hands-component.svg?branch=master)](https://travis-ci.org/wmurphyrd/aframe-super-hands-component)
[![npm Dowloads](https://img.shields.io/npm/dt/super-hands.svg?style=flat-square)](https://www.npmjs.com/package/super-hands)
[![npm Version](http://img.shields.io/npm/v/super-hands.svg?style=flat-square)](https://www.npmjs.com/package/super-hands)
[![js-semistandard-style](https://img.shields.io/badge/code%20style-semistandard-brightgreen.svg?style=flat-square)](https://github.com/Flet/semistandard)

Effortlessly add natural, intuitive interactions with tracked controller,
touch, or mouse input in [A-Frame](https://aframe.io).

![Demo Gif](readme_files/super-hands-demo.gif)

![Super Hans Can't Make a Fist](readme_files/peep-show-super-hans.gif)

## Description

The `super-hands` component interprets input from controls and
collision detection components
into interaction gestures and communicates those gestures to
target entities for them to respond.  

The currently implemented gestures are:

* Hover: Holding a controller in the collision space of an entity
* Grab: Pressing a button while hovering an entity, potentially also moving it
* Stretch: Grabbing an entity with two hands and resizing
* Drag-drop: Dragging an entity onto another entity

For an entity to respond to the `super-hands` gestures, it needs to have
components attached to translate the gestures into actions. `super-hands`
includes components for typical reactions to the implemented gestures:
`hoverable`, `clickable`, `grabbable`, `stretchable`, and `drag-droppable`.

**Universal Progressive Controls**: The `progressive-controls` component
provides consistent interactivity on any viewer from desktop to full
6-DOF virtual reality by auto-detecting viewer capabilities.

**Avatar Locomotion**: Inspired by a demo from [@caseyyee](https://github.com/caseyyee), the `super-hands`
grab and stretch gestures can also serve as a comfortable locomotion system
by moving and scaling the world around the player. Use the `a-locomotor` primitive
to provide intuitive freedom of motion in your WebVR experiences.

Readme contents:

* [Examples](#examples)
* [Installation](#installation)
  * [HTML usage](#browser)
  * [News](#news)
  * [Compatibility](#compatibility)
* [Core, primitives, and meta-components](#core-primitives-and-meta-components)
  * [`super-hands` gesture interpretation component](#super-hands-component)
  * [`progressive-controls` universal controller component](#progressive-controls-component)
  * ['a-locomotor' free movement primitive](#a-locomotor-primitive)
* [Reaction components](#reaction-components)
  * [`hoverable`](#hoverable-component)
  * [`grabbable`](#grabbable-component)
    * [`clickable`](#clickable-component)
  * [`stretchable`](#stretchable-component)
  * ['drag-droppable'](#drag-droppable-component)
* [Customizing interactivity](#customizing-interactivity)

## Examples

The [examples page](https://wmurphyrd.github.io/aframe-super-hands-component/examples/) showcases a variety of configurations and use cases for `super-hands`.

| Example Scene | Description | Target VR Devices | MoCap preview |
| --- | --- | --- | --- |
| [Progressive controls with physics](https://wmurphyrd.github.io/aframe-super-hands-component/examples/#physics) | Grab, stretch, and drag-drop cubes with simulated physical behavior on any VR platform | Desktop, mobile, cardboard, Gear VR, Daydream, Vive, Rift  | Yes |
| [Gaze and laser pointer controls without physics](https://wmurphyrd.github.io/aframe-super-hands-component/examples/#mouse) | Showcase fallback controls used for simpler VR devices and fallback interactivity without physics simulation | Desktop, mobile, cardboard, Gear VR, Daydream, Vive, Rift | Yes |
| [Global Event Handler integration](https://wmurphyrd.github.io/aframe-super-hands-component/examples/#events) | An alternative way to customize interactions using familiar HTML event handler properties like `onclick` | Desktop, mobile, cardboard, Gear VR, Daydream, Vive, Rift | Yes |
| [Link Portals](https://wmurphyrd.github.io/aframe-super-hands-component/examples/#portals) | Travel the metaverse with A-Frame link portals | Desktop, mobile, cardboard, Gear VR, Daydream, Vive, Rift | No |
| [Grab-based locomotion](https://wmurphyrd.github.io/aframe-super-hands-component/examples/#locomotion) | Explore a scene by dragging or stretching the world around you | Vive, Rift | Yes |
| [Custom button mapping](https://wmurphyrd.github.io/aframe-super-hands-component/examples/#sticky) | Configuring schema properties to change button functions | Vive, Rift | No |

## Installation

### Browser

Install and use by directly including the [browser files](dist):

```html
<head>
  <title>Most Basic Super-Hands Example</title>
  <script src="https://aframe.io/releases/0.7.0/aframe.min.js"></script>
  <script src="//cdn.rawgit.com/donmccurdy/aframe-extras/v3.11.4/dist/aframe-extras.min.js"></script>
  <script src="https://unpkg.com/super-hands@2.0.1/dist/super-hands.min.js"></script>
</head>

<body>
  <a-scene>
    <a-assets></a-assets>
    <a-entity progressive-controls="objects: a-box"></a-entity>
    <!-- hover & drag-drop won't have any obvious effect without some additional event handlers or components. See the examples page for more -->
    <a-box hoverable grabbable stretchable drag-droppable
    color="blue" position="0 0 -1"></a-box>
  </a-scene>
</body>
```

### npm

Install via npm:

```bash
npm install super-hands
```

Then require and use.

```js
require('aframe');
require('super-hands');
```
### News

Master branch

* Fix duplicate grab/click events with touch input
* Update to A-Frame v0.7.0
* Implement new [aframe-machinima-testing](https://github.com/wmurphyrd/aframe-machinima-testing)
  package for machinima test management

Master branch features can be tested using:

```html
<script src="https://rawgit.com/wmurphyrd/aframe-super-hands-component/master/dist/super-hands.min.js"></script>
```

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
  [For example](https://wmurphyrd.github.io/aframe-super-hands-component/examples/#sticky)
  `a-locomotor`'s `grabbable` can be set to respond to different
  buttons than other `grabbable` entities so that
  grabbing entities and locomotion are separate gestures for the user.
* `a-locomotor` now functions independently from colliders;
  removed `add-to-colliders` attribute.
* Performance improvements in `grabbable` and `stretchable`
* Gesture initiation changed to occur only on button press rather than
  button press and collision. Pressing a button in empty space and then
  moving into an object will no long scoop it up in a grab.

[Previous news](news.md)

### Known Issues

* When both hands are hovering an entity and one leaves, the entity will lose
  the hover state for one tick
  * Related to messaging from `sphere-collider`; unable to distinguish which
    collider instance is signaling the collision termination.
* Two-handed physics grabs don't feel great
  * Someone that knows something about game dev could be smarter about the
    constraints

### Compatibility

With `progressive-controls`, `super-hands` can provide interactive controls
for any device: desktop, mobile ("magic window"), cardboard viewer + button,
Daydream, GearVR, Vive, and Rift + Touch.

`super-hands` dependency version compatibility:

| super-hands Version | A-Frame Version | aframe-extras Version | aframe-physics-system Version |
| --- | --- | --- | --- |
| ^v2.0.0 | v0.6.x | ^v3.11.4 | ^v2.0.0 |
| v1.1.0 | v0.6.x | v3.8.6 | v1.4.2 |
| v1.0.0 | v0.5.x | v3.8.5 | v1.4.1 |
| v0.2.4 | v0.4.x | v3.7.0 | v1.3.0 |

## Core, primitives, and meta-components

### super-hands component

The `super-hands` component is the core of the library.
It communicates gesture events to entities based on
user-input and entity collisions. The component is generally placed on
the controller entities (or the camera for gaze interaction) and depends on
a collision detection component (e.g. `cursor` or [aframe-extras sphere-collider](https://github.com/donmccurdy/aframe-extras/blob/master/src/misc))
which needs to be placed on the same entity or a child entity of `super-hands`.

#### Component Schema

| Property | Description | Default Value |
| -------- | ----------- | ------------- |
| colliderState | Name of state added to entities by your chosen collider | `'collided'` (default for `sphere-collider`) |
| colliderEvent | Event that your chosen collider emits when identifying a new collision | `'hit'` (default for `sphere-collider` and `physics-collider`) |
| colliderEventProperty | Name of property in event `details` object which contains the collided entity | `'el'` |
| colliderEndEvent | Event that your chosen collider emits when a collision ends | `''` |
| colliderEndEventProperty | Name of property in event `details` object which contains the un-collided entity | `''` |
| grabStartButtons | Array of button event types that can initiate grab | Button press, touch start, and mouse down events |
| grabEndButtons | Array of button event types that can terminate grab | Button release, touch end, and mouse up events |
| stretchStartButtons | Array of button event types that can initiate stretch | Button press, touch start, and mouse down events |
| stretchEndButtons | Array of button event types that can terminate stretch | Button release, touch end, and mouse up events |
| dragDropStartButtons | Array of button event types that can initiate dragging/hovering | Button press, touch start, and mouse down events |
| dragDropEndButtons | Array of button event types that can execute drag-drop | Button release, touch end, and mouse up events |

Default button events include specific events for `vive-controls`,
`hand-controls`, `oculus-touch-controls`, `daydream-controls`,
`gearvr-controls`, mouse, and touch. For detecting when collisions end,
either `colliderState` or `colliderEndEvent`/`colliderEndEventProperty` can be
used, depending on the API of the collider in use.

#### Gesture Events

Events will be emitted by the entity being interacted with.
The entity that `super-hands` is attached to is sent in the event `details` as the property `hand`.

| Type | Description | Target |  details object |
| --- | --- | --- | --- |
| hover-start | Collided with entity | collided entity | hand: `super-hands` entity |
| hover-end | No longer collided with entity | collided entity | hand: `super-hands` entity |
| grab-start | Button pressed while collided with entity and hand is empty | collided entity | hand: `super-hands` entity |
| grab-end | Button released after grab-start | collided entity | hand: `super-hands` entity |
| stretch-start | Both controllers have button pressed while collided with entity | collided entity | hand: `super-hands` entity, secondHand: second controller entity |
| stretch-end | Release of button after stretch-start | collided entity | hand: `super-hands` entity |
| drag-start | Drag-drop button pressed while collided with entity and hand is empty | collided entity | hand: `super-hands` entity |
| drag-end | Drag-drop button released while dragging an entity | dragged entity | hand: `super-hands` entity |
| dragover-start | Collision with entity while dragging another entity | collided entity & held entity | hand: `super-hands` entity, hovered: collided entity, carried: held entity |
| dragover-end | No longer collided with entity from dragover-start | collided entity & held entity | hand: `super-hands` entity, hovered: collided entity, carried: held entity |
| drag-drop | Button released while holding an entity and collided with another | collided entity & held entity | hand: `super-hands` entity, dropped: carried entity, on (carried entity only): receiving entity |

Notes:

* References to buttons being "released" and "pressed" are dependent on the schema settings.
* Only one entity at a time will be targeted for each event type,
even if multiple overlapping collision zones exist. `super-hands` tracks a
LIFO stack of collided entities to determine which will be affected.
* drag-drop: For the receiving entity, `on` entry in the details is `null`.
If needed, use `event.target` instead.
* For events triggered by buttons, the triggering button event is passed
  along in `details.buttonEvent`

#### Global Event Handler Integration

In addition to the A-Frame style gesture events,
`super-hands` also causes standard HTML events analogous to VR
interactions to be emitted by the target entities. This allows the use of these
common Global Event Handler properties on entities to add reaction directly
in the HTML. View the
[related example](https://wmurphyrd.github.io/aframe-super-hands-component/examples/#events)
to see this in use.

| entity HTML attribute | conditions | event.relatedTarget |
| --- | --- | --- |
| onmouseover | hovering in an entity's collision zone | `super-hands` entity |
| onmouseout | leaving an entity's collision zone | `super-hands` entity |
| onmousedown | grab started while collided with entity | `super-hands` entity |
| onmouseup | grab ended while collided with entity | controller entity |
| onclick | grab started and then ended while collided with entity | controller entity |
| ondragstart | drag-drop started while collided with entity | controller entity |
| ondragend | drag-drop started while collided with entity | controller entity |
| ondragenter | hovering in an entity's collision zone while drag-dropping another entity | the other entity\* |
| ondragleave | leaving an entity's collision zone while drag-dropping another entity | the other entity\* |
| ondrop | drag-drop ended while holding an entity over a target | the other entity\* |

The event passed to the handler will be a `MouseEvent`. At present the only property implemented
is `relatedTarget`, which is set as
listed in the table. Drag-dropping events will be dispatched on both the entity being dragged and the drop target, and the `relatedTarget` property for each will point to the other entity in the interaction.

### progressive-controls component

The `progressive-controls` component makes it easy to design an interactive
A-Frame scene that will work on any device. It automatically detects the viewing
device, creates appropriate controller entities, and configures `super-hands`
to work with the device. It is progressive because the degree of interactivity
increases from gaze-based cursors (desktop, mobile, cardboard), to laser pointer
controls (GearVR, Daydream), to natural hand interaction (Vive, Oculus).

#### Usage

Add `progressive-controls` to an entity, and it will create appropriate
controller and camera entities as children automatically.

```html
<a-entity progressive-controls></a-entity>
```

To add additional properties or override defaults, specify the entities
you want to modify as children of the `progressive-controls` entity, following
the pattern below. Controllers must be given
class names `'right-controller'` and `'left-controller'` to help
`progressive-controls` identify them.

```html
<a-entity progressive-controls>
  <a-camera super-hands>
    <a-entity raycaster></a-entity>
  </a-camera>
  <a-entity class="right-controller" super-hands></a-entity>
  <a-entity class="left-controller" super-hands></a-entity>
</a-entity>
```

#### Component Schema

| Property | Description | Default Value |
| -------- | ----------- | ------------- |
| maxLevel | Limit the highest interactivity level that will be activated: `'gaze'`, `'point'`, or `'touch'`. | `'touch'` |
| objects | CSS selector string to be used by any automatically generated collision detectors | `''` (all entities) |
| physicsBody | Properties to use when adding `static-body` to automatically generated controllers. Ignored if physics not added to the scene. | 'shape: sphere; sphereRadius: 0.02' |
| touchCollider | Name of collider component to use with touch-level controls | 'sphere-collider' |
| touchColliderRadius | Distance from touch-level controller within which grabbable objects can be touched | 0.05 |

#### Events

| Type | Description |  details object |
| --- | --- | --- |
|'controller-progressed' | The detected controller type has changed | `level`: new control type, : `'gaze'`, `'point'`, or `'touch'` |


### a-locomotor primitive

Add freedom of movement by wrapping the player avatar in an `a-locomotor`
primitive.
Users can then grab and move the world around themselves to navigate your
WebVR experience
in a way that is comfortable even for most people prone to simulation sickness.

The component works by wrapping the player in an entity that responds to
grabbing and stretching
gestures made on empty space and translates those into
movement and scaling for player avatar.
To function, the player camera and controllers must be children
of `a-locomotor`.
On initialization, `a-locomotor` will automatically set the default camera
as a child unless it has been declared elsewhere
(see schema below if you want to disable this), so
setting up `a-locomotor` simply requires wrapping your controller
entities like so:

```html
<a-locomotor>
  <a-entity hand-controls="left" super-hands></a-entity>
  <a-entity hand-controls="right" super-hands></a-entity>
</a-locomotor>
```

`a-locomotor` does not require a collision detection component to function, so,
if the only `super-hands` functionality you need is locomotion, you do
not need to include `sphere-collider` components on your controllers
(as in the above example).
By default, `a-locomotor` gives the player the ability to move freely in the
horizontal plane and to scale up or down.
Behavior can be customized by setting the attributes below on the `a-locomotor`
entity.

#### Primitive Attributes

| Attribute | Description | Default Value |
| -------- | ----------- | ------------- |
| fetch-camera | Make the default camera a child of `a-locomotor` so it can be moved with the player | `true` |
| allow-movement | Allow grabbing gestures to reposition the player | `true` |
| horizontal-only | Restrict movement to the X-Z plane | `true` |
| allow-scaling | Allow stretching gestures to rescale the player | `true` |

#### Events

| Type | Description | Target | Bubbles |
| --- | --- | --- | --- |
| 'locomotor-ready' | All auto-configuration steps complete | `a-locomotor` | yes |

## Reaction Components

Add these components to entities in your scene to make them react to
super-hands gestures.

### hoverable component

Used to indicate when the controller is within range to interact with an entity
by adding the 'hovered' state. When using a mixin, including another mixin
in the assets withe same id + '-hovered' will activate automatically, as in
[the examples](https://wmurphyrd.github.io/aframe-super-hands-component/examples/).

#### States

| Name | Description |
| --- | --- |
| hovered | Added to entity while it is collided with the controller |


### grabbable component

Makes and entity move along with the controller's movement and rotation
while it is grabbed. `grabbable` works with
up-close grabbing (6DOF controllers like Vive and Oculus Touch
with `hand-controls` and `sphere-collider`)
and with pointing at a distance (3DOF controllers like GearVR and Daydream
with `laser-controls`).

This works best with [aframe-physics-system](https://github.com/donmccurdy/aframe-physics-system)
to manage grabbed entity movement including position and rotation,
but it will fallback to manual `position` updates
(without rotation) if physics is not available
or is disabled with `usePhysics = never`.

Allows for multiple hands to register a grab on an entity.
In a non-physics setup, this has no effect
other than allowing smooth passing of entities between hands.
With physics enabled, additional grabbing
hands register their own physics constraints to allow for
two-handed wielding of entities. Limit or disable this
by setting the maxGrabbers schema property.

#### Component Schema

| Property | Description | Default Value |
| -------- | ----------- | ------------- |
| startButtons | Which button events to accept to start grab | `[]` |
| endButtons | Which button events to accept to end grab | `[]` |
| usePhysics | Whether to use physics system constraints to handle movement, 'ifavailable', 'only', or 'never' | 'ifavailable' |
| maxGrabbers | Limit number of hands that can grab entity simultaneously | NaN (no limit) |
| invert | Reverse direction of entity movement compared to grabbing hand | false |
| suppressY | Allow movement only in the horizontal plane | false |

The default for `startButtons` and `endButtons` is to accept any button
recognized by `super-hands` `grabStartButtons` and `grabDropEndButtons`.

#### States

| Name | Description |
| --- | --- |
| grabbed | Added to entity while it is being carried |

### clickable component

An alternative version of `grabbable` that registers that a button was pressed, but does not
move the entity. Do not use `clickable` and `grabbable` on the same entity
(just use `grabbable` and watch the "grabbed" state instead of "clicked")

| Property | Description | Default Value |
| -------- | ----------- | ------------- |
| startButtons | Which button events to accept to start grab | `[]` |
| endButtons | Which button events to accept to end grab | `[]` |

The default for `startButtons` and `endButtons` is to accept any button
recognized by `super-hands` `grabStartButtons` and `grabDropEndButtons`.

#### States

| Name | Description |
| --- | --- |
| clicked | Added to entity while a button is held down |


### stretchable component

Makes and entity rescale while grabbed by both controllers as they are moved closer together or further apart.

#### Component Schema

| Property | Description | Default Value |
| -------- | ----------- | ------------- |
| startButtons | Which button events to accept to start stretch | `[]` |
| endButtons | Which button events to accept to end stretch | `[]` |
| usePhysics | Whether to update physics body shapes with scale changes, 'ifavailable' or 'never' | 'ifavailable' |
| invert | Reverse the direction of scaling in relation to controller movement | `false` |

The default for `startButtons` and `endButtons` is to accept any button
recognized by `super-hands` `stretchStartButtons` and `stretchEndButtons`.

There is no CANNON api method for updating physics body scale, but `stretchable` will manually rescale basic shapes. Currently rescalable shapes are: box and sphere.

#### States

| Name | Description |
| --- | --- |
| stretched | Added to entity while it is grabbed with two hands |

### drag-droppable component

`drag-droppable` is a shell component that only manages the 'dragover' state for the entity.
This can be combined with  with a '-dragover' mixin to easily highlight when an entity is
hovering in a drag-drop location.

For interactivity, use the global event handler integration,
the `event-set` from [kframe](http://github.com/ngokevin/kframe)
with the `drag-dropped` event, or create your own component.

#### Component Schema

| Property | Description | Default Value |
| -------- | ----------- | ------------- |
| startButtons | Which button events to accept to start drag | `[]` |
| endButtons | Which button events to accept to end drag | `[]` |

The default for `startButtons` and `endButtons` is to accept any button
recognized by `super-hands` `dragDropStartButtons` and `dragDropEndButtons`.

#### States

| Name | Description |
| --- | --- |
| dragover | Added to while a carried entity is colliding with a a `drag-droppable` entity |

Add `drag-droppable` to both the carried entity and the receiving entity if you want both of them to
receive the dragover state.

## Customizing interactivity

### Gesture and Response Concept

![Separation of Gesture and Response API](readme_files/super-hands-api.png)

Separating the reaction to be the responsibility of the entity affected allows for extensibility.
In response to a grab, you may want some entities to lock to the controller and move,
others to rotate around a fixed point, and others still to spawn a new entity but remain unchanged.
With this API schema, these options can be handled by adding or creating different reaction
components to the entities in your scene, and `super-hands` can work with all of them.

### Interactivity

There are two pathways to adding additional interactivity.

1. A-Frame style: Each component's API documentation describes the A-Frame
custom events and states it uses.
These are best processed by creating new A-Frame components that register
event listeners and react accordingly.
1. HTML style: The `super-hands` component also integrates with the
Global Event Handlers Web API to trigger standard mouse events analogous
to the VR interactions that can easily be handled through
properties like `onclick`.
