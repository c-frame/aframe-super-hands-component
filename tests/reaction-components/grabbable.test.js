/* global assert, process, setup, suite, test, AFRAME */
const helpers = require('../helpers')
const entityFactory = helpers.entityFactory
const elFactory = helpers.elFactory
const coord = AFRAME.utils.coordinates.parse
suite('grabbable', function () {
  suite('grabbable-lifecycle', function () {
    setup(function (done) {
      const el = this.el = entityFactory()
      el.setAttribute('grabbable', '')
      el.addEventListener('loaded', function () {
        done()
      })
    })
    test('component attaches without errors', function () {
      assert.isOk(this.el.components.grabbable.data.usePhysics)
    })
    test('component removes without errors', function (done) {
      const el = this.el
      el.removeAttribute('grabbable')
      process.nextTick(function () {
        assert.notOk(el.components.grabbable)
        done()
      })
    })
  })

  suite('grabbable-function without physics', function () {
    setup(function (done) {
      const el = this.el = entityFactory()
      el.setAttribute('grabbable', '')
      this.hand = helpers.controllerFactory()
      el.parentNode.addEventListener('loaded', function () {
        done()
      })
    })
    test('initiates grab on event when not grabbed', function () {
      const myGrabbable = this.el.components.grabbable
      const hand = this.hand
      const el = this.el
      assert.isNotOk(myGrabbable.grabbed)
      assert.notStrictEqual(myGrabbable.grabber, this.hand)
      assert.isNotOk(this.el.is(myGrabbable.GRABBED_STATE))
      myGrabbable.start({ detail: { hand: this.hand } })
      assert.isOk(myGrabbable.grabbed)
      assert.isOk(myGrabbable.grabber)
      assert.strictEqual(myGrabbable.grabber, hand)
      assert.isOk(el.is(myGrabbable.GRABBED_STATE))
    })
    test('ignores cancelled events', function () {
      this.comp = this.el.components.grabbable
      const evtCancelled = { defaultPrevented: true, detail: { hand: this.hand } }
      const evt = { detail: { hand: this.hand } }
      this.comp.start(evtCancelled)
      assert.isFalse(this.el.is(this.comp.GRABBED_STATE))
      this.comp.start(evt)
      this.comp.end(evtCancelled)
      assert.isTrue(this.el.is(this.comp.GRABBED_STATE))
    })
    test('position updates during grab', function () {
      const myGrabbable = this.el.components.grabbable
      assert.isTrue(this.el.getAttribute('position').equals(coord('0 0 0')))
      myGrabbable.start({ detail: { hand: this.hand } })
      /* with render loop stubbed out, need to force ticks */
      myGrabbable.tick()
      this.hand.setAttribute('position', '1 1 1')
      myGrabbable.tick()
      assert.isTrue(this.el.getAttribute('position').equals(coord('1 1 1')))
    })
    test(
      'position does not update during grab when usePhysics set to "only"',
      function () {
        const posStub = this.sinon.stub(this.hand, 'getAttribute')
        const myGrabbable = this.el.components.grabbable
        assert.isTrue(this.el.getAttribute('position').equals(coord('0 0 0')))
        posStub.withArgs('position')
          .onFirstCall().returns(coord('0 0 0'))
          .onSecondCall().returns(coord('1 1 1'))
        myGrabbable.data.usePhysics = 'only'
        myGrabbable.start({ detail: { hand: this.hand } })
        myGrabbable.tick()
        assert.isTrue(this.el.getAttribute('position').equals(coord('0 0 0')))
      })
    test('updates cease on release event', function () {
      const posStub = this.sinon.stub(this.hand, 'getAttribute')
      const myGrabbable = this.el.components.grabbable
      assert.isTrue(this.el.getAttribute('position').equals(coord('0 0 0')))
      posStub.withArgs('position')
        .onFirstCall().returns(coord('0 0 0'))
        .onSecondCall().returns(coord('1 1 1'))
      myGrabbable.start({ detail: { hand: this.hand } })
      myGrabbable.tick()
      myGrabbable.end({ detail: { hand: this.hand } })
      myGrabbable.tick()
      assert.isTrue(this.el.getAttribute('position').equals(coord('0 0 0')))
      assert.notOk(this.el.is(myGrabbable.GRABBED_STATE))
      assert.notOk(myGrabbable.grabbed)
      assert.notOk(myGrabbable.grabber)
    })
    test('grabbing from a second hand does not change grabber', function () {
      const myGrabbable = this.el.components.grabbable
      const secondHand = {}
      myGrabbable.start({ detail: { hand: this.hand } })
      myGrabbable.start({ detail: { hand: secondHand } })
      assert.strictEqual(myGrabbable.grabber, this.hand)
    })
  })

  suite('grabbable-function with physics', function () {
    setup(async function () {
      const el = this.el = await elFactory()
      const handPromise = new Promise(resolve => {
        this.hand = helpers.controllerFactory({
          body: 'type: static; shape: sphere; sphereRadius: 0.001',
          geometry: 'primitive: sphere; radius: 0.001'
        })
        if (this.hand.body) return resolve()
        this.hand.addEventListener('body-loaded', () => resolve())
      })
      const elPromise = new Promise(resolve => {
        el.addEventListener('body-loaded', evt => {
          this.comp = el.components.grabbable
          resolve()
        })
        el.setAttribute('grabbable', '')
        el.setAttribute('geometry', 'primitive: box')
        el.setAttribute('body', 'shape: box')
      })
      return Promise.all([handPromise, elPromise])
    })
    test('constraint registered on grab', function () {
      this.comp.start({ detail: { hand: this.hand } })
      const cId = this.comp.constraints.get(this.hand)
      const c = this.el.components['constraint__' + cId]
      assert.isOk(c)
      assert.strictEqual(c.data.target, this.hand)
    })
    test('constraint not registered when usePhysics = never', function () {
      this.el.setAttribute('grabbable', 'usePhysics', 'never')
      this.comp.start({ detail: { hand: this.hand } })
      assert.strictEqual(this.comp.constraints.size, 0)
    })
    test('constraint removed on release', function () {
      this.comp.start({ detail: { hand: this.hand } })
      assert.isOk(this.comp.constraints.has(this.hand))
      const constraint = this.comp.constraints.get(this.hand)
      this.comp.end({ detail: { hand: this.hand } })
      assert.notOk(this.comp.constraints.has(this.hand))
      assert.equal(this.el.body.world.constraints.indexOf(constraint), -1)
    })
    test('changing usePhysics to never during grab removes constraint', function () {
      this.comp.start({ detail: { hand: this.hand } })
      assert.isOk(this.comp.constraints.has(this.hand))
      const constraint = this.comp.constraints.get(this.hand)
      this.el.setAttribute('grabbable', 'usePhysics', 'never')
      assert.notOk(this.comp.constraints.has(this.hand))
      assert.strictEqual(this.el.body.world.constraints.indexOf(constraint), -1)
      assert.strictEqual(this.comp.constraints.size, 0)
    })
  })

  suite('two-handed grab w/o physics', function () {
    setup(function (done) {
      const el = this.el = entityFactory()
      this.hand1 = helpers
        .controllerFactory({ 'super-hands': '' })
      this.hand2 = helpers
        .controllerFactory({ 'super-hands': '' })
      el.setAttribute('grabbable', '')
      el.sceneEl.addEventListener('loaded', evt => {
        this.comp = el.components.grabbable
        done()
      })
    })
    test('two-handed grab can pass object between hands', function () {
      // stub out super-hands method called from grabbable.end becase no collider active
      this.hand2.components['super-hands'].updateGrabbed = () => {
        this.comp.start({ detail: { hand: this.hand2 } })
      }
      this.comp.start({ detail: { hand: this.hand1 } })
      assert.isTrue(this.comp.grabbed, 'first hand')
      assert.strictEqual(this.comp.grabber, this.hand1, 'hand 1 grabbing')
      this.comp.start({ detail: { hand: this.hand2 } })
      this.comp.end({ detail: { hand: this.hand1 } })
      assert.isTrue(this.comp.grabbed, 'passed to 2nd hand')
      assert.strictEqual(this.comp.grabber, this.hand2, 'hand 2 grabbing')
    })
    test('two-handed grab disabled by maxGrabbers = 1', function () {
      this.el.setAttribute('grabbable', 'maxGrabbers: 1')
      this.comp.start({ detail: { hand: this.hand1 } })
      assert.sameMembers(this.comp.grabbers, [this.hand1], 'first grab accpeted')
      this.comp.start({ detail: { hand: this.hand2 } })
      assert.sameMembers(this.comp.grabbers, [this.hand1], 'second grab rejected')
    })
  })

  suite('two-handed grab with physics', function () {
    setup(function (done) {
      const el = this.el = entityFactory()
      this.hand1 = helpers
        .controllerFactory({
          'super-hands': '',
          body: 'type: static; shape: sphere',
          geometry: 'primitive: sphere'
        })
      this.hand2 = helpers
        .controllerFactory({
          'super-hands': '',
          body: 'type: static; shape: sphere',
          geometry: 'primitive: sphere'
        })
      el.setAttribute('grabbable', '')
      el.setAttribute('geometry', 'primitive: box')
      el.setAttribute('body', 'shape: box;')
      el.addEventListener('body-loaded', evt => {
        this.comp = el.components.grabbable
        if (!this.hand2.body) {
          this.hand2.addEventListener('body-loaded', evt => done())
        } else {
          done()
        }
      })
    })
    test('two-handed grab makes dual constraints', function () {
      this.comp.start({ detail: { hand: this.hand1 } })
      assert.isTrue(this.comp.grabbed, 'first hand')
      assert.isTrue(this.comp.constraints.has(this.hand1), '1st hand')
      this.comp.start({ detail: { hand: this.hand2 } })
      assert.isTrue(this.comp.constraints.has(this.hand1), 'still 1st hand')
      assert.isTrue(this.comp.constraints.has(this.hand2), 'also second hand')
      this.comp.end({ detail: { hand: this.hand1 } })
      assert.isTrue(this.comp.constraints.has(this.hand2), 'still second hand')
      assert.isFalse(this.comp.constraints.has(this.hand1), '1st hand free')
    })
    test('two-handed grab disabled by maxGrabbers = 1', function () {
      this.el.setAttribute('grabbable', 'maxGrabbers: 1')
      this.comp.start({ detail: { hand: this.hand1 } })
      assert.isTrue(this.comp.constraints.has(this.hand1), 'first grab accpeted')
      this.comp.start({ detail: { hand: this.hand2 } })
      assert.isFalse(this.comp.constraints.has(this.hand2), 'second grab rejected')
    })
  })

  suite('grabbable button mapping', function () {
    setup(function (done) {
      const el = this.el = entityFactory()
      this.hand = helpers.controllerFactory({ 'super-hands': '' })
      el.setAttribute('grabbable',
        'startButtons: triggerdown; endButtons: triggerup')
      el.addEventListener('loaded', () => {
        this.comp = el.components.grabbable
        done()
      })
    })
    test('responds to correct buttons', function () {
      const dtl = { hand: this.hand, buttonEvent: { type: 'gripdown' } }
      // reject wrong button start
      assert.isOk(helpers.emitCancelable(this.el, this.comp.GRAB_EVENT, dtl))
      assert.notStrictEqual(this.comp.grabber, this.hand)
      assert.isNotOk(this.el.is(this.comp.GRABBED_STATE))
      // accept correct button start
      dtl.buttonEvent.type = 'triggerdown'
      assert.isNotOk(helpers.emitCancelable(this.el, this.comp.GRAB_EVENT, dtl))
      assert.strictEqual(this.comp.grabber, this.hand)
      assert.isOk(this.el.is(this.comp.GRABBED_STATE))
      // reject wrong button end
      assert.isOk(helpers.emitCancelable(this.el, this.comp.UNGRAB_EVENT, dtl))
      assert.strictEqual(this.comp.grabber, this.hand)
      assert.isOk(this.el.is(this.comp.GRABBED_STATE))
      // accpect correct button end
      dtl.buttonEvent.type = 'triggerup'
      assert.isNotOk(helpers.emitCancelable(this.el, this.comp.UNGRAB_EVENT, dtl))
      assert.notStrictEqual(this.comp.grabber, this.hand)
      assert.isNotOk(this.el.is(this.comp.GRABBED_STATE))
    })
  })
})
