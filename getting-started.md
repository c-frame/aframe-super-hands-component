There are many ways this library can be used, but many use cases likely can be thought of as a variation off of the ability to pick something up with your controller in 6d0f VR. Here we walk through one possible very quick way to approach adding this ability to your existing application--one suggestion for one scenario. You can riff widely off this concept as needed.

1. Add Libraries:

```html
    <script src="https://unpkg.com/super-hands/dist/super-hands.min.js"></script>
    <script src="https://cdn.jsdelivr.net/gh/c-frame/aframe-physics-system@v4.1.0/dist/aframe-physics-system.js"></script>
    <script src="https://unpkg.com/aframe-event-set-component@^4.1.1/dist/aframe-event-set-component.min.js"></script>
    <script src="https://unpkg.com/aframe-physics-extras/dist/aframe-physics-extras.min.js"></script>
 ```

2. Add Physics:

Add the `physics` component to your scene
_note: trying `physics="gravity: 0"` can sometimes help with debugging some issues, try at your own risk._
```html
`<a-scene physics>`
```

3.  Add Mixins

Add these mixins within your `<a-assets>`.
```html
        <a-mixin id="all-interactions"
                 hoverable grabbable stretchable draggable
                 event-set__hoveron="_event: hover-start; material.opacity: 0.7; transparent: true"
                 event-set__hoveroff="_event: hover-end; material.opacity: 1; transparent: false"
                 dynamic-body
        ></a-mixin>

        <a-mixin id="grab-move"
                 hoverable grabbable draggable
                 event-set__hoveron="_event: hover-start; material.opacity: 0.7; transparent: true"
                 event-set__hoveroff="_event: hover-end; material.opacity: 1; transparent: false"
                 dynamic-body
        ></a-mixin>
        
        <a-mixin id="physics-hands"
                 physics-collider phase-shift
                 collision-filter="collisionForces: false"
                 static-body="shape: sphere; sphereRadius: 0.02"
                 super-hands="colliderEvent: collisions;
                              colliderEventProperty: els;
                              colliderEndEvent: collisions;
                              colliderEndEventProperty: clearedEls;"
        ></a-mixin>
```


 4. Prevent hands from knocking things away before you grab them
 
  Add the following component to your project:
 ```js
       AFRAME.registerComponent('phase-shift', {
        init: function () {
          var el = this.el
          el.addEventListener('gripdown', function () {
            el.setAttribute('collision-filter', {collisionForces: true})
          })
          el.addEventListener('gripup', function () {
            el.setAttribute('collision-filter', {collisionForces: false})
          })
        }
      });
```
        
  5. Give hands the ability to grab
  
  Add the `physics-hands` mixin to your hand entities
  ```html
        <a-entity id="rhand" mixin="physics-hands"
                  hand-controls="hand: right">
        </a-entity>
        <a-entity id="lhand" mixin="physics-hands"
                  hand-controls="hand: left">
        </a-entity>
  ```
  
  6. Make a floor things won't fall through
  
  Add `static-body` component to your ground and whatever surfaces you want to be able to put things on
  ```html
  <a-box static-body width="100" height="0.01" depth="100" visible="false"></a-box>
  <!-- if you already have a ground, you should just be able to add static-body to it -->
  <!-- Hint: you should also add 'static-body' to any surface you want to be able to set movable things on top of -->
  <!-- Hint: if you're adding it dynamically, make sure to use el.setAttribute('static-body', '') -->
  ```
  
  7. Make your thing able to be picked up
  
  Add the mixin 'all-interactions' (or 'grab-move' if you don't want it to be 'stretchable') to whatever object you want to be able to reach into and pick up.
  ```html
        <a-entity class="cube" mixin="cube all-interactions" position="0 0.265 -1" material="color: red"></a-entity>
```

