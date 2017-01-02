## Super Hands

All-in-one natural hand controller interaction component for [A-Frame](https://aframe.io).

![Super Hans Can't Make a Fist](readme_files/peep-show-super-hans.gif)

### Description

Add the `super-hands` component to your tracked controller entities to enable these interactions:

* Grab: Pick up and move entities by holding a controller button
* Stretch: Resize entities by grabbing with two hands
* Drag-drop: Notify entities when other entities are placed on them

#### Dependencies

A collider component must also be added to the controller entities, such as [aframe-extras sphere-collider](https://github.com/donmccurdy/aframe-extras/blob/master/src/misc) or the in-development, physics system-based [physics-collider](https://github.com/donmccurdy/aframe-physics-system/pull/14).

Super Hands works best with [aframe-physics-system](https://github.com/donmccurdy/aframe-physics-system) to manage grabbed entity movement, but it will fallback to manual `position` updates (without rotational translation) if physics is not available. 

### News

* Super Hands basic functionality is now available: grab, stretch, and drag-drop

### API

| Property | Description | Default Value |
| -------- | ----------- | ------------- |
| dropTargetClasses |  Array of HTML classes for which collidable entities accept drag-drop interactions |            [] (any entities accessible to the collider)   |
| colliderState | Name of state added to entities your chosen collider | 'collided' (default for `sphere-collider` and `physics-collider`) |
| colliderEvent | Event that your chosen collider emits when identifying a new collision | 'hit' (default for `sphere-collider` and `physics-collider`) |
| usePhysics | If available, use physics system to move grabbed components | true |

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
