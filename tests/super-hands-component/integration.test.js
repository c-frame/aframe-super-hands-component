/* global assert, setup, suite, test */
const helpers = require('../helpers')
const entityFactory = helpers.entityFactory

suite('super-hands & reaction component integration', function () {
  setup(function (done) {
    this.target1 = entityFactory()
    this.target1.setAttribute('grabbable', '')
    this.target1.setAttribute('hoverable', '')
    this.target1.setAttribute('stretchable', '')
    this.target1.setAttribute('draggable', '')
    this.target1.setAttribute('droppable', '')
    this.target2 = document.createElement('a-entity')
    this.target2.setAttribute('draggable', '')
    this.target2.setAttribute('droppable', '')
    this.target2.setAttribute('hoverable', '')
    this.target1.parentNode.appendChild(this.target2)
    this.hand1 = helpers.controllerFactory({
      'super-hands': ''
    })
    this.hand2 = helpers.controllerFactory({
      'vive-controls': 'hand: left',
      'super-hands': ''
    }, true)
    this.hand1.parentNode.addEventListener('loaded', () => {
      this.sh1 = this.hand1.components['super-hands']
      this.sh2 = this.hand2.components['super-hands']
      done()
    })
  })
  test('grabbable', function () {
    this.sh1.onGrabStartButton()
    this.sh1.onHit({ detail: { el: this.target1 } })
    this.sh1.onGrabStartButton({})
    assert.strictEqual(this.sh1.state.get(this.sh1.GRAB_EVENT), this.target1)
    assert.strictEqual(this.target1.components.grabbable.grabber, this.hand1)
    assert.ok(this.target1.is('grabbed'), 'grabbed')
    this.sh1.onGrabEndButton()
    assert.isFalse(this.target1.is('grabbed'), 'released')
    assert.notEqual(this.sh1.hoverEls.indexOf(this.target1), -1, 'still watched')
  })
  test('hoverable', function () {
    this.sh1.onHit({ detail: { el: this.target1 } })
    assert.strictEqual(this.sh1.hoverEls[0], this.target1)
    assert.strictEqual(this.target1.components.hoverable.hoverers[0], this.hand1)
    assert.isTrue(this.target1.is('hovered'))
    helpers.simCollisionEnd(this.hand1, this.target1)
    assert.isFalse(this.target1.is('hovered'))
    assert.equal(this.sh1.hoverEls.indexOf(this.target1), -1)
  })
  test('stretchable', function () {
    this.sh1.onStretchStartButton()
    this.sh1.onHit({ detail: { el: this.target1 } })
    this.sh1.onStretchStartButton({})
    assert.isFalse(this.target1.is('stretched'))
    this.sh2.onHit({ detail: { el: this.target1 } })
    this.sh2.onStretchStartButton({})
    assert.ok(this.target1.is('stretched'))
    assert.includeMembers(this.target1.components.stretchable.stretchers,
      [this.hand1, this.hand2])
    assert.strictEqual(this.sh1.state.get(this.sh1.STRETCH_EVENT), this.target1)
    assert.strictEqual(this.sh2.state.get(this.sh2.STRETCH_EVENT), this.target1)
    this.sh1.onStretchEndButton()
    assert.isFalse(this.target1.is('stretched'), 'hand 1 release')
    this.sh1.onStretchStartButton()
    assert.isTrue(this.target1.is('stretched'), 'resume stretch')
    this.sh2.onStretchEndButton()
    assert.isFalse(this.target1.is('stretched'), 'hand 2 release')
    this.sh1.onStretchEndButton()
    assert.equal(this.target1.components.stretchable.stretchers.length, 0)
  })
  test('drag and drop', function () {
    const dropSpy = this.sinon.spy()
    const targetDropSpy = this.sinon.spy()
    this.target1.addEventListener('drag-drop', dropSpy)
    this.target2.addEventListener('drag-drop', targetDropSpy)
    this.sh1.onHit({ detail: { el: this.target1 } })
    this.sh1.onDragDropStartButton()
    this.sh1.onHit({ detail: { el: this.target2 } })
    assert.ok(this.target1.is('dragged'), 'carried dragged')
    assert.ok(this.target2.is('dragover'), 'drop target hovered')
    helpers.simCollisionEnd(this.hand1, this.target2)
    assert.ok(this.target1.is('dragged'), 'carried still dragged after target lost')
    assert.isFalse(this.target2.is('dragover'), 'lost target unhovered')
    assert.isFalse(dropSpy.called, 'no drop before button release')
    this.sh1.onDragDropEndButton()
    assert.isFalse(dropSpy.called, 'no drop w/o target')
    assert.isFalse(this.target1.is('dragged'), 'drop w/o target: no longer dragged')
    this.sh1.onDragDropStartButton()
    assert.ok(this.target1.is('dragged'), 'dragged re-acquired')
    this.sh1.onHit({ detail: { el: this.target2 } })
    assert.ok(this.target2.is('dragover'), 'drop target re-acquired')
    this.sh1.onDragDropEndButton()
    assert.isTrue(targetDropSpy.called, 'drag-drop success: target')
    assert.isTrue(dropSpy.called, 'drag-drop success: hand')
    assert.isFalse(this.target1.is('dragged'), 'carried released')
    assert.isFalse(this.target2.is('dragover'), 'drop target unhovered')
  })
  test('drop target remains watched for collision end', function () {
    this.target2.removeAttribute('hoverable')
    this.sh1.onHit({ detail: { el: this.target1 } })
    this.sh1.onDragDropStartButton()
    this.sh1.onHit({ detail: { el: this.target2 } })
    this.sh1.onDragDropEndButton()
    this.target2.emit('stateremoved', { state: 'collided' })
    helpers.simCollisionEnd(this.hand1, this.target2)
    assert.strictEqual(this.sh1.hoverEls.indexOf(this.target2), -1)
  })
  test('lastHover not confused by rejected dragover', function () {
    this.target2.removeAttribute('droppable')
    this.sh1.onDragDropStartButton()
    this.sh1.onHit({ detail: { el: this.target1 } })
    this.sh1.onHit({ detail: { el: this.target2 } })
    assert.isTrue(this.sh1.state.has(this.sh1.HOVER_EVENT))
    assert.isFalse(this.sh1.state.has(this.sh1.DRAGOVER_EVENT))
  })
  test('hover ends when target grabbed', function () {
    this.sh1.onHit({ detail: { el: this.target1 } })
    assert.ok(this.target1.is('hovered'), 'hover starts')
    this.sh1.onGrabStartButton()
    assert.ok(this.target1.is('grabbed'), 'grab starts')
    assert.notOk(this.target1.is('hovered'), 'hover ended')
    this.sh1.onGrabEndButton()
    assert.notOk(this.target1.is('grabbed'), 'grab ended')
    assert.ok(this.target1.is('hovered'), 'hover resumed')
  })
  test('hover ends when target dragged', function () {
    this.sh1.onHit({ detail: { el: this.target1 } })
    assert.ok(this.target1.is('hovered'), 'hover starts')
    this.sh1.onDragDropStartButton()
    assert.ok(this.target1.is('dragged'), 'drag starts')
    assert.notOk(this.target1.is('hovered'), 'hover ended')
    this.sh1.onDragDropEndButton()
    assert.notOk(this.target1.is('dragged'), 'drag ended')
    assert.ok(this.target1.is('hovered'), 'hover resumed')
  })
  test('hover ends when target stretched', function () {
    this.sh1.onHit({ detail: { el: this.target1 } })
    assert.ok(this.target1.is('hovered'), 'hover starts')
    this.sh1.onStretchStartButton()
    assert.notOk(this.target1.is('hovered'), 'hover ended')
    this.sh1.onStretchEndButton()
    assert.ok(this.target1.is('hovered'), 'hover resumed')
  })
  test('end of interaction does not cause double hover', function () {
    this.sh1.onHit({ detail: { el: this.target1 } })
    this.sh1.onGrabStartButton()
    this.sh1.onHit({ detail: { el: this.target2 } })
    assert.ok(this.target2.is('hovered'))
    this.sh1.onGrabEndButton()
    assert.notOk(this.target1.is('hovered') && this.target2.is('hovered'),
      'two targets hovered')
  })
})
suite('super-hands collider integration', function () {
  setup(function (done) {
    this.target1 = entityFactory()
    this.target1.id = 'target1'
    this.target1.setAttribute('geometry', 'primitive: sphere')
    this.target2 = document.createElement('a-entity')
    this.target2.id = 'target2'
    this.target2.setAttribute('geometry', 'primitive: sphere')
    this.target1.parentNode.appendChild(this.target2)
    this.hand1 = helpers.controllerFactory({
      'vive-controls': 'hand: right; model: false',
      geometry: 'primitive: sphere',
      'super-hands': '',
      'sphere-collider': 'objects: #target1, #target2'
    }, true)
    this.hand2 = helpers.controllerFactory({
      'vive-controls': 'hand: left; model: false',
      geometry: 'primitive: sphere',
      'super-hands': '',
      'sphere-collider': 'objects: #target1, #target2'
    }, true)
    this.hand1.parentNode.addEventListener('loaded', () => {
      this.sh1 = this.hand1.components['super-hands']
      this.col1 = this.hand1.components['sphere-collider']
      this.sh2 = this.hand2.components['super-hands']
      this.col2 = this.hand2.components['sphere-collider']
      done()
    })
  })
  test('avoid excessive drag event dispatch', function () {
    const dragenterSpy = this.sinon.spy()
    const aFrameDragoverSpy = this.sinon.spy()
    this.target2.ondragenter = dragenterSpy
    this.target2.addEventListener('dragover-start', aFrameDragoverSpy)
    this.target1.addEventListener('drag-start', e => e.preventDefault())
    this.target2.setAttribute('position', '10 10 10')
    // sphere collider not respecting position attribute changes
    this.target2.getObject3D('mesh').position.set(10, 10, 10)
    this.col1.tick()
    this.sh1.onDragDropStartButton()
    assert.isFalse(dragenterSpy.called, 'not yet collided')
    assert.isFalse(aFrameDragoverSpy.called, 'AF not yet collided')
    this.target2.setAttribute('position', '0 0 0')
    // sphere collider not respecting position attribute changes
    this.target2.getObject3D('mesh').position.set(0, 0, 0)
    this.col1.tick()
    assert.equal(dragenterSpy.callCount, 1, 'initial dragover')
    assert.equal(aFrameDragoverSpy.callCount, 1, 'AF initial dragover')
    this.col1.tick()
    assert.equal(dragenterSpy.callCount, 1, 'no duplicate dragover')
    assert.equal(aFrameDragoverSpy.callCount, 1, ' AF no duplicate dragover')
  })
  test('avoid excessive hover event dispatch', function () {
    const mouseoverSpy = this.sinon.spy()
    const aFrameHoverSpy = this.sinon.spy()
    // multiple targets cause justifiable event repetition, so limit to one
    this.col1.els = [this.target1]
    this.target1.onmouseover = mouseoverSpy
    this.target1.addEventListener('hover-start', aFrameHoverSpy)
    this.target1.addEventListener('hover-start', e => e.preventDefault())
    this.col1.tick()
    assert.equal(mouseoverSpy.callCount, 1, 'mouseovered')
    assert.equal(aFrameHoverSpy.callCount, 1, 'hovered')
    this.col1.tick()
    assert.equal(mouseoverSpy.callCount, 1, 'no duplicate mouseover')
    assert.equal(aFrameHoverSpy.callCount, 1, ' AF no duplicate hover')
  })
  test('avoid excessive rejected event dispatch', function () {
    const grabSpy = this.sinon.spy()
    const stretchSpy = this.sinon.spy()
    const dragSpy = this.sinon.spy()
    // multiple targets cause justifiable event repetition, so limit to one
    this.col1.els = [this.target1]
    this.target1.addEventListener('grab-start', grabSpy)
    this.target1.addEventListener('stretch-start', stretchSpy)
    this.target1.addEventListener('drag-start', dragSpy)
    this.col1.tick()
    this.sh1.onGrabStartButton()
    this.sh1.onStretchStartButton()
    this.sh1.onDragDropStartButton()
    assert.equal(grabSpy.callCount, 1, 'grab once')
    assert.equal(stretchSpy.callCount, 1, 'stretch once')
    assert.equal(dragSpy.callCount, 1, 'drag once')
    this.col1.tick()
    assert.equal(grabSpy.callCount, 1, 'grab not repeated')
    assert.equal(stretchSpy.callCount, 1, 'stretch not repeated')
    assert.equal(dragSpy.callCount, 1, 'drag not repeated')
  })
  test('super-hands knows when grab rejected due to grabbable.maxGrabbers', function () {
    this.target1.setAttribute('grabbable', 'maxGrabbers: 1')
    this.sh1.onHit({ detail: { el: this.target1 } })
    this.sh1.onGrabStartButton()
    assert.isTrue(
      this.sh1.state.has(this.sh1.GRAB_EVENT),
      '1st super-hand recognizes grab'
    )
    this.sh2.onHit({ detail: { el: this.target1 } })
    this.sh2.onGrabStartButton()
    assert.isFalse(
      this.sh2.state.has(this.sh1.GRAB_EVENT),
      '2nd super-hand recognizes rejection'
    )
  })
})
suite('super-hands & clickable component integration', function () {
  setup(function (done) {
    this.target1 = entityFactory()
    this.target1.setAttribute('clickable', '')
    this.hand1 = helpers.controllerFactory({
      'super-hands': ''
    })
    this.hand2 = helpers.controllerFactory({
      'vive-controls': 'hand: left',
      'super-hands': ''
    }, true)
    this.hand1.parentNode.addEventListener('loaded', () => {
      this.sh1 = this.hand1.components['super-hands']
      this.sh2 = this.hand2.components['super-hands']
      done()
    })
  })
  test('clickable', function () {
    this.sh1.onHit({ detail: { el: this.target1 } })
    this.sh1.onGrabStartButton()
    assert.strictEqual(this.sh1.state.get(this.sh1.GRAB_EVENT), this.target1)
    assert.ok(this.target1.is('clicked'), 'clicked')
    this.sh1.onGrabEndButton()
    assert.isFalse(this.target1.is('clicked'), 'released')
    assert.notEqual(this.sh1.hoverEls.indexOf(this.target1), -1, 'still watched')
  })
})
suite('super-hands raycaster integration', function () {
  setup(function (done) {
    this.target1 = entityFactory()
    this.target1.id = 'target1'
    this.target1.setAttribute('geometry', 'primitive: box')
    this.target1.setAttribute('position', '0 0 -1')
    this.target2 = document.createElement('a-entity')
    this.target2.id = 'target2'
    this.target2.setAttribute('geometry', 'primitive: sphere')
    this.target2.setAttribute('position', '0 0 -2')
    this.target1.parentNode.appendChild(this.target2)
    this.hand1 = helpers.controllerFactory({
      'vive-controls': 'hand: right; model: false',
      geometry: 'primitive: sphere',
      'super-hands': 'colliderEvent: raycaster-intersection;' +
          'colliderEventProperty: els;' +
          'colliderEndEvent: raycaster-intersection-cleared;' +
          'colliderEndEventProperty: clearedEls',
      raycaster: 'objects: #target1, #target2; interval: 0; near: 0.1; far: 10'
    }, true)
    this.hand1.setAttribute('position', '0 0 1')
    this.hand1.parentNode.addEventListener('loaded', () => {
      this.sh1 = this.hand1.components['super-hands']
      this.ray1 = this.hand1.components.raycaster
      done()
    })
  })
  test('sees raycaster collisions', function () {
    this.target1.object3D.updateMatrixWorld()
    this.target2.object3D.updateMatrixWorld()
    this.ray1.tock()
    assert.sameMembers(this.sh1.hoverEls, [this.target1, this.target2])
    this.target1.setAttribute('position', '0 -1 4')
    this.target1.object3D.updateMatrixWorld()
    this.target2.setAttribute('position', '0 -1 4')
    this.target2.object3D.updateMatrixWorld()
    this.ray1.tock()
    assert.strictEqual(this.sh1.hoverEls.length, 0)
  })
  // this test didn't actually fail as expected while #68 remained
  test('raycaster collisions clear', function () {
    assert.equal(this.sh1.state.get('hover-start'), undefined)
    // take t2 out of the picture
    this.target2.setAttribute('position', '0 -1 4')
    this.target2.object3D.updateMatrixWorld()
    this.target1.setAttribute('hoverable', '')
    this.target1.object3D.updateMatrixWorld()
    this.ray1.tock()
    assert.sameMembers(this.sh1.hoverEls, [this.target1])
    assert.strictEqual(this.sh1.state.get('hover-start'), this.target1)
    this.target1.setAttribute('position', '0 -1 4')
    this.target1.object3D.updateMatrixWorld()
    this.ray1.tock()
    assert.equal(this.sh1.state.get('hover-start'), undefined)
  })
})
suite('super-hands & physics integration', function () {
  setup(function (done) {
    this.target1 = entityFactory()
    this.target1.setAttribute('geometry', '')
    this.target1.setAttribute('dynamic-body', '')
    this.target1.setAttribute('grabbable', '')
    this.target1.setAttribute('hoverable', '')
    this.target1.setAttribute('stretchable', '')
    this.target1.setAttribute('draggable', '')
    this.target1.setAttribute('droppable', '')
    this.target2 = document.createElement('a-entity')
    this.target2.setAttribute('geometry', '')
    this.target2.setAttribute('dynamic-body', '')
    this.target1.appendChild(this.target2)
    this.hand1 = helpers.controllerFactory({
      'super-hands': ''
    })
    this.hand2 = helpers.controllerFactory({
      'vive-controls': 'hand: left',
      'super-hands': ''
    }, true)
    let bodies = 0
    this.target1.addEventListener('body-loaded', () => {
      if (++bodies === 2) {
        this.sh1 = this.hand1.components['super-hands']
        this.sh2 = this.hand2.components['super-hands']
        done()
      }
    })
  })
  test('stretches complex physics bodies', function () {
    const stretch = this.target1.components.stretchable
    const size2 = new window.CANNON.Vec3(1, 1, 1)
    const offset2 = new window.CANNON.Vec3(1, 1, 1)
    const shape2 = new window.CANNON.Box(size2)
    this.target1.body.addShape(shape2, offset2)
    this.hand2.setAttribute('position', '1 1 1')
    stretch.start({ detail: { hand: this.hand1 } })
    stretch.start({ detail: { hand: this.hand2 } })
    stretch.tick()
    this.hand2.setAttribute('position', '2 1 1')
    stretch.tick()
    const check = new window.CANNON.Vec3(0.707, 0.707, 0.707)
    assert.isTrue(this.target1.body.shapes[0].halfExtents.almostEquals(check, 0.001))
    assert.isTrue(this.target2.body.shapes[0].halfExtents.almostEquals(check, 0.001), 'child')
    check.set(1.414, 1.414, 1.414)
    assert.isTrue(this.target1.body.shapes[1].halfExtents.almostEquals(check, 0.001), 'scale')
    assert.isTrue(this.target1.body.shapeOffsets[1].almostEquals(check, 0.001), 'offset')
  })
  test('net physics stretch correct when throttled', function () {
    const stretch = this.target1.components.stretchable
    const size2 = new window.CANNON.Vec3(1, 1, 1)
    const offset2 = new window.CANNON.Vec3(1, 1, 1)
    const shape2 = new window.CANNON.Box(size2)
    this.target1.body.addShape(shape2, offset2)
    this.hand2.setAttribute('position', '1 1 1')
    stretch.start({ detail: { hand: this.hand1 } })
    stretch.start({ detail: { hand: this.hand2 } })
    stretch.tick(1, 1)
    this.hand2.setAttribute('position', '1.5 1 1')
    stretch.tick(6, 5)
    const check = new window.CANNON.Vec3(0.5, 0.5, 0.5)
    assert.isTrue(this.target1.body.shapes[0].halfExtents.almostEquals(check, 0.001), 'throttled')
    this.hand2.setAttribute('position', '2 1 1')
    stretch.tick(2006, 2000)
    check.set(0.707, 0.707, 0.707)
    assert.isTrue(this.target1.body.shapes[0].halfExtents.almostEquals(check, 0.001))
    assert.isTrue(this.target2.body.shapes[0].halfExtents.almostEquals(check, 0.001), 'child')
    check.set(1.414, 1.414, 1.414)
    assert.isTrue(this.target1.body.shapes[1].halfExtents.almostEquals(check, 0.001), 'scale')
    assert.isTrue(this.target1.body.shapeOffsets[1].almostEquals(check, 0.001), 'offset')
  })
})
