## Super Hands

All-in-one natural hand controller interaction component for [A-Frame](https://aframe.io).

![Super Hans Can't Make a Fist](readme_files/peep-show-super-hans.gif)

### Description

Add the `super-hands` component to your tracked controller entities to enable these interactions:

* Grab: Pick up and move entities by holding a controller button
* Stretch: Resize entities by grabbing with two hands (in progress for new API)
* Drag-drop: Notify entities when other entities are placed on them (in progress for new API)

#### Examples

[Visit the Examples Page to see super-hands in action](https://wmurphyrd.github.io/aframe-super-hands-component/examples/)

### News

* New API structure
    * `grabbable` reaction component updated to new API

### API

The `super-hands` component interprets input from tracked controllers and collision detection components
into natural, hand-interaction gestures and communicates those gestures to target entities for them to respond. 

![Separation of Gesture and Response API](readme_files/super-hands-api.png)

Separating the reaction to be the responsibilty of the entity affected allows for extensibility. 
In response to a grab, you may want some entities to lock to the controller and move, 
others to rotate around a fixed point, and others still to spawn a new entity but remain unchanged. 
With this API schema, these options can be handled by adding or creating different reaction
components to the entities in your scene, and `super-hands` can work with all of them. 

The `super-hands` component must be added to same entities as your controller
component and collision detector (e.g. [aframe-extras sphere-collider](https://github.com/donmccurdy/aframe-extras/blob/master/src/misc) 
or the in-development, physics system-based [physics-collider](https://github.com/donmccurdy/aframe-physics-system/pull/14)).

This package also includes reaction components for common hand interactions: `grabbable`, `stretchable`, 
and `dragdroppable`. Add these to the entities you want the controllers to interact with.  

#### super-hands

##### Component Schema

| Property | Description | Default Value |
| -------- | ----------- | ------------- |
| colliderState | Name of state added to entities by your chosen collider | `'collided'` (default for `sphere-collider` and `physics-collider`) |
| colliderEvent | Event that your chosen collider emits when identifying a new collision | `'hit'` (default for `sphere-collider` and `physics-collider`) |
| grabStartButtons | Array of button event types that can initiate grab | all button-down events |
| grabEndButtons | Array of button event types that can terminate grab | all button-up events |
| stretchStartButtons | Array of button event types that can initiate stretch | all button-down events |
| stretchEndButtons | Array of button event types that can terminate stretch | all button-up events |
| dragDropStartButtons | Array of button event types that can initiate dragging/hovering | all button-down events |
| dragDropEndButtons | Array of button event types that can execute drag-drop | all button-up events |


##### Events

Events will be emitted by the entity being interacted with. 
The entity `super-hands` is attached to is sent in the event `details` as the property `hand`.

| Type | Description | Target |  details object |
| --- | --- | --- | --- |
| grab-start | Button pressed while collided with entity and hand is empty | collided entity | hand: `super-hands` entity |
| grab-end | Button released after grab-start | collided entity | hand: `super-hands` entity |
| stretch-start | Both controllers have button pressed while collided with entity | collided entity | hand: `super-hands` entity, secondHand: second contoller entity |
| stretch-end | Release of button after stretch-start | collided entity | hand: `super-hands` entity |
| dragover-start | Collision with entity while holding another entity | collided entity & held entity | hand: `super-hands` entity, hovered: collided entity, carried: held entity |
| dragover-end | No longer collided with entity from dragover-start | collided entity & held entity | hand: `super-hands` entity, hovered: collided entity, carried: held entity |
| drag-drop | Button released while collided with and entity and holding with another | collided entity & held entity | hand: `super-hands` entity, dropped: carried entity, on: receiving entity |

Note: references to buttons being "released" and "pressed" are dependent on the schema settings. 
For example, to make grab 'sticky', you could set startGrabButtons to 'triggerdown' and endGrabButtons to 'gripdown' (with `vive-controls`).
This way the grab-end event would not fire until the grip button was *pressed*, even if the trigger was *released* earlier. 

#### grabbable

Makes and entity move along with the controller while it is grabbed.

This works best with [aframe-physics-system](https://github.com/donmccurdy/aframe-physics-system) 
to manage grabbed entity movement, but it will fallback to manual `position` updates 
(without rotational translation) if physics is not available or is disabled with `usePhysics = never`. 

##### Component Schema

| Property | Description | Default Value |
| -------- | ----------- | ------------- |
| usePhysics | Whether to use physics system contstraints to handle movement, 'ifavailable', 'only', or 'never' | 'auto' |

##### States

| Name | Description |
| --- | --- |
| grabbed | Added to entity while it is being carried |

#### stretchable

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

#### drag-droppable

`drag-droppable` is a shell component that only manages the 'hovered' state for the entity. 
This can be combined with  with a '*-hovered' mixin to easily highlight when an entity is 
hovering in a drag-drop location. 

For more interactivity, consider using `event-set` from [kframe](http://github.com/ngokevin/kframe) 
with the `drag-dropped` event or creating your own component.

##### States

| Name | Description |
| --- | --- |
| hovered | Added to while a carried entity is colliding with a a `drag-droppable` entity |

Add `drag-droppable` to both the carried entity and the receiving entity if you want both of them to 
receive the hovered state. 


### Installation

#### Browser  

Install and use by directly including the [browser files](dist):

```html
<head>
  <title>My A-Frame Scene</title>
  <script src="https://aframe.io/releases/0.4.0/aframe.min.js"></script>
  <script src="https://rawgit.com/wmurphyrd/aframe-super-hands-component/master/dist/super-hands.min.js"></script>
</head>

<body>
  <a-scene>
    <a-entity super-hands="foo: bar"></a-entity>
  </a-scene>
</body>
```

#### npm (not yet avalable)

Install via npm:

```bash
npm install super-hands
```

Then require and use.

```js
require('aframe');
require('super-hands');
```
