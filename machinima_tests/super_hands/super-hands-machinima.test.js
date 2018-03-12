/* global assert, process, setup, suite, test, sinon, CANNON */

const machinima = require('aframe-machinima-testing')

suite('basic interactions', function () {
  setup(function (done) {
    /* inject the scene html into the testing docoument */
    machinima.setupScene('hands.html')
    this.scene = document.querySelector('a-scene')
    this.scene.addEventListener('loaded', e => {
      this.boxGrnUp = document.getElementById('greenHigh')
      this.boxGrnDn = document.getElementById('greenLow')
      this.boxRedUp = document.getElementById('redHigh')
      done()
    })
  })
  machinima.test(
    'green boxes turn into spheres; red box is stretched & moved',
    'base/recordings/handsRecording.json',
    function () {
      var endScale = this.boxRedUp.getAttribute('scale')
      assert.notDeepEqual(this.boxRedUp.getAttribute('position'), this.startPos, 'moved')
      assert.isTrue(endScale.x > this.startScale.x, 'grew-x')
      assert.isTrue(endScale.y > this.startScale.y, 'grew-y')
      assert.isTrue(endScale.z > this.startScale.z, 'grew-z')
      assert.equal(
        this.boxGrnUp.getAttribute('geometry').primitive, 'sphere'
      )
      assert.equal(
        this.boxGrnDn.getAttribute('geometry').primitive, 'sphere'
      )
      assert.isFalse(this.boxGrnDn.is('hovered'))
    },
    function () {
      this.startPos = this.boxRedUp.getAttribute('position').clone()
      this.startScale = this.boxRedUp.getAttribute('scale').clone()
      assert.equal(this.boxGrnUp.getAttribute('geometry').primitive, 'box')
      assert.equal(this.boxGrnDn.getAttribute('geometry').primitive, 'box')
    }
  )
  machinima.test(
    'carried entities unhovers properly after drag-drop',
    'base/recordings/leftoverHover.json',
    function () {
      assert.isFalse(this.boxGrnUp.is('hovered'))
      assert.isFalse(this.boxGrnDn.is('hovered'))
    }
  )
  test('hover persists when hands overlap', function (done) {
    const unHoverSpy = sinon
      .spy(this.boxGrnUp, 'removeState') // no sinon cleanup
    unHoverSpy.withArgs('hovered')
    machinima.testStart(this, 'base/recordings/multihover.json')
    machinima.testEnd(e => {
      assert.equal(unHoverSpy.withArgs('hovered').callCount, 1)
      done()
    })
  })
  machinima.test(
    'regrabbing after release does not leave abandoned hover',
    'base/recordings/regrab.json',
    function () {
      assert.isFalse(this.boxGrnUp.is('hovered'), 'upper box')
      assert.isFalse(this.boxGrnDn.is('hovered'), 'lower box')
    }
  )
  machinima.test(
    'regrabbing after release grabs same entity',
    'base/recordings/regrab.json',
    function () {
      assert.deepEqual(this.boxGrnDn.getAttribute('position'), this.dnStartPos)
    },
    function () {
      this.dnStartPos = this.boxGrnDn.getAttribute('position')
    }
  )
  machinima.test(
    'No stray hover after drag-drop',
    'base/recordings/handsRecording.json',
    function () {
      assert.isFalse(this.boxGrnDn.is('hovered'))
    }
  )
  machinima.test(
    'Pass betwen hands with two-handed grab',
    'base/recordings/hands-twoHandedPass.json',
    function () {
      assert.isAbove(this.boxGrnUp.getAttribute('position').z, 0.5)
    }
  )
  machinima.test(
    'Two-handed pass fails if 2nd hand moved out of range',
    'base/recordings/hands-nostretch-badTwoHandedGrab.json',
    function () {
      assert.isBelow(this.boxGrnUp.getAttribute('position').z, -0.8)
      assert.isFalse(this.boxGrnUp.components['grabbable'].grabbed)
      assert.strictEqual(this.boxGrnUp.components['grabbable'].grabbers.length, 0)
    },
    function () {
      // disable stretching so hand can leave collision zone while grabbing
      this.boxGrnUp.components['stretchable'].remove()
    }
  )
})

suite('Overlapped object targeting', function () {
  setup(function (done) {
    /* inject the scene html into the testing docoument */
    machinima.setupScene('overlapped.html')
    this.scene = document.querySelector('a-scene')
    this.scene.addEventListener('loaded', e => {
      this.outter = document.getElementById('outter')
      this.middle = document.getElementById('middle')
      this.inner = document.getElementById('inner')
      done()
    })
  })
  machinima.test(
    'able to move nested entities',
    'base/recordings/nested-grab.json',
    function () {
      assert.isAbove(this.inner.getAttribute('position').y, 2)
      assert.isBelow(this.middle.getAttribute('position').y, 0)
      assert.isTrue(this.outter.getAttribute('position').equals({x: 0, y: 1, z: -1}))
    }
  )
})

suite('Nested object targeting', function () {
  setup(function (done) {
    /* inject the scene html into the testing docoument */
    machinima.setupScene('nested.html')
    this.scene = document.querySelector('a-scene')
    this.scene.addEventListener('loaded', e => {
      this.outter = document.getElementById('outter')
      this.middle = document.getElementById('middle')
      this.inner = document.getElementById('inner')
      done()
    })
  })
  machinima.test(
    'target 1 nested entity at a time',
    'base/recordings/nested-grab.json',
    function () {
      assert.isBelow(this.inner.getAttribute('position').y, 1.5)
      assert.isBelow(this.middle.getAttribute('position').y, 0)
      assert.isTrue(this.outter.getAttribute('position').equals({x: 0, y: 1, z: -1}))
    }
  )
})

suite('Physics grab', function () {
  setup(function (done) {
    /* inject the scene html into the testing docoument */
    machinima.setupScene('physics.html')
    this.scene = document.querySelector('a-scene')
    this.hand1 = document.getElementById('rhand')
    this.hand2 = document.getElementById('lhand')
    this.target = document.getElementById('target')
    this.scene.addEventListener('loaded', e => {
      done()
    })
  })
  machinima.test(
    'entity affected by two constraints',
    'base/recordings/physics-twoHandedTwist.json',
    function () {
      assert.isAbove(Math.abs(this.yRot), 0.3)
    },
    function () {
      this.target.addEventListener('grab-end', e => {
        this.yRot = this.target.getObject3D('mesh').getWorldRotation()._y
      }, {once: true})
    }
  )
})

suite('Physics worker driver', function () {
  setup(function (done) {
    /* inject the scene html into the testing docoument */
    machinima.setupScene('physics-worker.html')
    this.scene = document.querySelector('a-scene')
    this.hand1 = document.getElementById('rhand')
    this.hand2 = document.getElementById('lhand')
    this.target = document.getElementById('greenHigh')
    this.scene.addEventListener('loaded', e => {
      done()
    })
  })
  machinima.test(
    'entity affected by grab',
    'base/recordings/handsRecording.json',
    function () {
      const post = new CANNON.Vec3().copy(this.target.getAttribute('position'))
      assert.isFalse(post.almostEquals(this.pre, 0.01))
    },
    function () {
      this.pre = new CANNON.Vec3().copy(this.target.getAttribute('position'))
    }
  )
})

suite('Locomotion', function () {
  setup(function (done) {
    /* inject the scene html into the testing docoument */
    machinima.setupScene('locomotor.html')
    this.scene = document.querySelector('a-scene')
    this.scene.addEventListener('loaded', e => {
      done()
    })
  })
  machinima.test(
    'player location moves',
    'base/recordings/hands-worldMover.json',
    function () {
      let z = document.querySelector('[camera]')
      .object3DMap.camera.getWorldPosition().z
      assert.isBelow(z, 0.6, 'camera ending z position')
    }
  )
  test('player scale changes', function (done) {
    machinima.testStart(this, 'base/recordings/locomotor-worldScaleGrowShrink.json')
    this.scene.addEventListener('grab-end', e => {
      var camScale = document.querySelector('[camera]')
          .object3DMap.camera.getWorldScale()
      assert.isBelow(camScale.x, 1, 'scaled up')
      assert.isBelow(camScale.y, 1, 'scaled up')
      assert.isBelow(camScale.z, 1, 'scaled up')
      machinima.testEnd(e => {
        let newCamScale = document.querySelector('[camera]')
          .object3DMap.camera.getWorldScale()
        assert.isAbove(newCamScale.x, camScale.x, 'camera scales back down')
        assert.isAbove(newCamScale.y, camScale.y, 'camera scales back down')
        assert.isAbove(newCamScale.z, camScale.z, 'camera scales back down')
        done()
      })
    }, {once: true})
  })
  machinima.test(
    'locomotor does not interfere with normal interactions',
    'base/recordings/loco-hands2.json',
    function () {
      var endScale = this.redBox.getAttribute('scale')
      assert.notDeepEqual(this.redBox.getAttribute('position'), this.startPos, 'moved')
      assert.isTrue(endScale.x > this.startScale.x, 'grew-x')
      assert.isTrue(endScale.y > this.startScale.y, 'grew-y')
      assert.isTrue(endScale.z > this.startScale.z, 'grew-z')
      assert.isAbove(this.boxGreenTop.getAttribute('position').z, -1)
    },
    function () {
      this.boxGreenTop = document.getElementById('greenHigh')
      this.redBox = document.getElementById('redHigh')
      this.startPos = this.redBox.getAttribute('position').clone()
      this.startScale = this.redBox.getAttribute('scale').clone()
    }
  )
})
suite('camera userHeight', function () {
  setup(function (done) {
    machinima.setupScene('locomotor.html')
    this.scene = document.querySelector('a-scene')
    this.scene.addEventListener('camera-ready', e => {
      done()
    })
  })
  test('camera userHeight preserved', function () {
    assert.isAbove(
      document.querySelector('[camera]').object3D.getWorldPosition().y,
      1
    )
  })
})

suite.skip('laser-controls grabbable', function () {
  setup(function (done) {
    machinima.setupScene('hands-laser.html')
    this.scene = document.querySelector('a-scene')
    this.scene.addEventListener('loaded', e => {
      this.boxGrnUp = document.getElementById('greenHigh')
      this.boxBlueUp = document.getElementById('blueHigh')
      this.boxRedUp = document.getElementById('redHigh')
      this.boxRedDn = document.getElementById('redLow')
      done()
    })
  })
  machinima.test(
    'green boxes turn into spheres',
    'base/recordings/laserhands.json',
    function () {
      assert.isAbove(this.boxGrnUp.getAttribute('position').z, 2, 'Green behind')
      assert.isBelow(this.boxRedUp.getAttribute('position').y, -0.5, 'Red below')
      assert.isAbove(this.boxBlueUp.getAttribute('position').y, 3, 'Blue above')
      assert.isBelow(this.boxRedDn.getAttribute('position').x, -1, 'Red left')
    }
  )
})
suite('drop-targets', function () {
  setup(function (done) {
    machinima.setupScene('drop-targets.html')
    this.scene = document.querySelector('a-scene')
    this.timeout(5000)
    this.scene.addEventListener('loaded', e => {
      this.boxGrnUp = document.getElementById('greenHigh')
      this.boxGrnDn = document.getElementById('greenLow')
      this.boxRedUp = document.getElementById('redHigh')
      this.boxRedDn = document.getElementById('redLow')
      this.boxBlueUp = document.getElementById('blueHigh')
      this.boxBlueDn = document.getElementById('blueLow')
      // firefox needs time for hands to load
      window.setTimeout(done, 1000)
    })
  })
  machinima.test(
    'drop-target discrimination and events',
    'base/recordings/droptarget.json',
    function () {
      let blueDnGeo = this.boxBlueDn.getAttribute('geometry')
      let grnDnGeo = this.boxGrnDn.getAttribute('geometry')
      assert.strictEqual(grnDnGeo.primitive, 'sphere')
      assert.strictEqual(blueDnGeo.primitive, 'tetrahedron')
    }
  )
})
