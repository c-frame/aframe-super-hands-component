## Super Hands

[![Build Status](https://travis-ci.org/wmurphyrd/aframe-super-hands-component.svg?branch=master)](https://travis-ci.org/wmurphyrd/aframe-super-hands-component)
[![npm Dowloads](https://img.shields.io/npm/dt/super-hands.svg?style=flat-square)](https://www.npmjs.com/package/super-hands)
[![npm Version](http://img.shields.io/npm/v/super-hands.svg?style=flat-square)](https://www.npmjs.com/package/super-hands)

Effortlessly add natural, intuitive hand controller interaction in
[A-Frame](https://aframe.io).

![Demo Gif](readme_files/super-hands-demo.gif) 

![Super Hans Can't Make a Fist](readme_files/peep-show-super-hans.gif)

### Description

The `super-hands` component interprets input from tracked controllers and 
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
`hoverable`, `grabbable`, `stretchable`, and `drag-droppable`.

![Separation of Gesture and Response API](readme_files/super-hands-api.png)

Separating the reaction to be the responsibility of the entity affected allows for extensibility. 
In response to a grab, you may want some entities to lock to the controller and move, 
others to rotate around a fixed point, and others still to spawn a new entity but remain unchanged. 
With this API schema, these options can be handled by adding or creating different reaction
components to the entities in your scene, and `super-hands` can work with all of them. 

#### Interactivity

There are two pathways to adding additional interactivity.

1. A-Frame style: Each component's API documentation describes the A-Frame 
custom events and states it uses. 
These are best processed by creating new A-Frame components that register
event listeners and react accordingly. 
1. HTML style: The `super-hands` component also integrates with the
Global Event Handlers Web API to trigger standard events analogous
to the VR interactions that can easily be handled through 
properties like `onclick`.

### Installation

#### Browser  

Install and use by directly including the [browser files](dist):

```html
<head>
  <title>Most Basic Super-Hands Example</title>
  <script src="https://aframe.io/releases/0.5.0/aframe.min.js"></script>
  <script src="//cdn.rawgit.com/donmccurdy/aframe-extras/v3.3.0/dist/aframe-extras.min.js"></script>
  <script src="https://rawgit.com/wmurphyrd/aframe-super-hands-component/master/dist/super-hands.min.js"></script>
</head>

<body>
  <a-scene>
    <!-- Make sure your super-hands entities also have controller and collider components -->
    <a-entity hand-controls="left" super-hands sphere-collider="objects: a-box"></a-entity>
    <a-entity hand-controls="right" super-hands sphere-collider="objects: a-box"></a-entity>
    <!-- hover, click, & drag-drop won't have any obvious effect without some additional event handlers or components. See the examples page for more -->
    <a-box hoverable clickable grabbable stretchable drag-droppable
           color="red"></a-box>
  </a-scene>
</body>
```

#### npm 

Install via npm:

```bash
npm install super-hands
```

Then require and use.

```js
require('aframe');
require('super-hands');
```


#### Examples

[Visit the Examples Page to see super-hands in action](https://wmurphyrd.github.io/aframe-super-hands-component/examples/)

### News

v0.3.1

* New: integration with GlobalEventHandlers for easy reactivity via element 
  properties such as `onclick`
* New: `clickable` reaction component for interacting with an entity
  without moving it
  
  
v0.3.0

* Confirmed compatibility with A-Frame v0.5.0 (no changes)

v0.2.4

* Fix error with systm registration that broke most everything

v0.2.3

* Fix `usePhysics: only` not being honored by `grabbable`
* Fix handling of edge cases in `stretchable`
* `super-hands` now respects with custom button mappings applied after initalization
* Added `super-hands` system to better manage links between two controllers
* Adding unit testing to prepare for updates

#### Known Issues

* Collision zones for stretched entities don't update to new scale (`sphere-collider` does not take entity scale into account)

#### Compatibility

| A-Frame Version | super-hands Version |
| --- | --- |
| v0.5.x | ^v0.3.0 |
| v0.4.x | v0.2.4 |

### API

#### super-hands component

`super-hands` should be added to same entities as your controller
component and collision detector (e.g. [aframe-extras sphere-collider](https://github.com/donmccurdy/aframe-extras/blob/master/src/misc) 
or the in-development, physics system-based [physics-collider](https://github.com/donmccurdy/aframe-physics-system/pull/14)).

##### Component Schema

| Property | Description | Default Value |
| -------- | ----------- | ------------- |
| colliderState | Name of state added to entities by your chosen collider | `'collided'` (default for `sphere-collider` and `physics-collider`) |
| colliderEvent | Event that your chosen collider emits when identifying a new collision | `'hit'` (default for `sphere-collider` and `physics-collider`) |
| grabStartButtons | Array of button event types that can initiate grab | Trigger, grip, thumb press events |
| grabEndButtons | Array of button event types that can terminate grab | Trigger, grip, thumb release events |
| stretchStartButtons | Array of button event types that can initiate stretch | Trigger, grip, thumb press events |
| stretchEndButtons | Array of button event types that can terminate stretch | Trigger, grip, thumb release events |
| dragDropStartButtons | Array of button event types that can initiate dragging/hovering | Trigger, grip, thumb press events |
| dragDropEndButtons | Array of button event types that can execute drag-drop | Trigger, grip, thumb release events |

Default button events include specific events for `vive-controls`, `hand-controls` and 
`oculus-touch-controls`.

Default start events: 'gripdown', 'trackpaddown', 'triggerdown', 'gripclose', 
'pointup', 'thumbup', 'pointingstart', 'pistolstart', 'thumbstickdown'

Default end events: 'gripup', 'trackpadup', 'triggerup', 'gripopen', 
'pointdown', 'thumbdown', 'pointingend', 'pistolend', 'thumbstickup'

##### Events

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
| dragover-start | Collision with entity while dragging another entity | collided entity & held entity | hand: `super-hands` entity, hovered: collided entity, carried: held entity |
| dragover-end | No longer collided with entity from dragover-start | collided entity & held entity | hand: `super-hands` entity, hovered: collided entity, carried: held entity |
| drag-drop | Button released while holding an entity and collided with another | collided entity & held entity | hand: `super-hands` entity, dropped: carried entity, on: receiving entity |

Notes: 

* References to buttons being "released" and "pressed" are dependent on the schema settings. 
For example, to make grab 'sticky', you could set grabStartButtons to 
'triggerdown' and grabEndButtons to 'gripdown' (as in the 
[sticky example](https://wmurphyrd.github.io/aframe-super-hands-component/examples/#sticky)).
This way the grab-end event would not fire until the grip button was *pressed*, 
even if the trigger was *released* earlier. 
* Only one entity at a time will be targeted for each event type, 
even if multiple overlapping collision zones exist. `super-hands` tracks a 
FIFO queue of collided entities to determine which will be affected.
* **drag-drop**: For the receiving entity, `on` entry in the details is `null`. 
If needed, use `event.target` instead. 

##### Global Event Handler Integration

| entity HTML attribute | conditions | event.relatedTarget |
| --- | --- | --- |
| onmouseover | hovering in an entity's collision zone | `super-hands` entity |
| onmouseout | leaving an entity's collision zone | `super-hands` entity |
| onmousedown | grab started while collided with entity | `super-hands` entity |
| onmouseup, onclick | grab ended after onmousedown | controller entity |
| ondragstart | drag-drop started while collided with entity | controller entity |
| ondragend | drag-drop started while collided with entity | controller entity |
| ondragenter | hovering in an entity's collision zone while drag-dropping another entity | the other entity\* |
| ondragleave | leaving an entity's collision zone while drag-dropping another entity | the other entity\* |
| ondrop | drag-drop ended while holding an entity over a target | the other entity\* |

The event passed to the handler will be a `MouseEvent`. At present the only property implemented
is `relatedTarget`, which is set as
listed in the table. Drag-dropping events will be dispatched on both the entity being dragged and the drop target, and the `relatedTarget` property for each will point to the other entity in the interaction.

#### hoverable component

Used to indicate when the controller is within range to interact with an entity
by adding the 'hovered' state. When using a mixin, including another mixin
in the assets withe same id + '-hovered' will activate automatically, as in
[the examples](https://wmurphyrd.github.io/aframe-super-hands-component/examples/).

##### States

| Name | Description |
| --- | --- |
| hovered | Added to entity while it is collided with the controller |

#### clickable component

Used to indicate when buttons are pressed while the controller is within range 
to interact with an entity. Adds the 'clicked' state while the grab button is held.

##### States

| Name | Description |
| --- | --- |
| clicked | Added to entity while a button is held down |

#### grabbable component

Makes and entity move along with the controller while it is grabbed.

This works best with [aframe-physics-system](https://github.com/donmccurdy/aframe-physics-system) 
to manage grabbed entity movement, but it will fallback to manual `position` updates 
(without rotational translation) if physics is not available or is disabled with `usePhysics = never`. 

##### Component Schema

| Property | Description | Default Value |
| -------- | ----------- | ------------- |
| usePhysics | Whether to use physics system constraints to handle movement, 'ifavailable', 'only', or 'never' | 'ifavailable' |

##### States

| Name | Description |
| --- | --- |
| grabbed | Added to entity while it is being carried |

#### stretchable component

Makes and entity rescale while grabbed by both controllers as they are moved closer together or further apart.

##### Component Schema

| Property | Description | Default Value |
| -------- | ----------- | ------------- |
| usePhysics | Whether to update physics body shapes with scale changes, 'ifavailable' or 'never' | 'ifavailable' |

There is no CANNON api method for updating physics body scale, but `stretchable` will manually rescale basic shapes. Currently rescalable shapes are: box. 

##### States

| Name | Description |
| --- | --- |
| stretched | Added to entity while it is grabbed with two hands |

#### drag-droppable component

`drag-droppable` is a shell component that only manages the 'hovered' state for the entity. 
This can be combined with  with a '-hovered' mixin to easily highlight when an entity is 
hovering in a drag-drop location. 

For interactivity, use the global event handler integration, 
the `event-set` from [kframe](http://github.com/ngokevin/kframe) 
with the `drag-dropped` event, or create your own component.

##### States

| Name | Description |
| --- | --- |
| dragover | Added to while a carried entity is colliding with a a `drag-droppable` entity |

Add `drag-droppable` to both the carried entity and the receiving entity if you want both of them to 
receive the hovered state. 
