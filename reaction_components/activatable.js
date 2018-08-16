/* global AFRAME */
const inherit = AFRAME.utils.extendDeep
const buttonCore = require('./prototypes/buttons-proto.js')

AFRAME.registerComponent('activatable', inherit({}, buttonCore, {
  multiple: true,
  schema: {
    buttonStartEvents: {default: []},
    buttonEndEvents: {default: []},
    activatedState: {default: 'activated'}
  },
  init: function () {
    this.ACTIVATE_EVENT = 'activate-start'
    this.DEACTIVATE_EVENT = 'activate-end'

    this.activateStart = this.activateStart.bind(this)
    this.activateEnd = this.activateEnd.bind(this)

    this.el.addEventListener(this.ACTIVATE_EVENT, this.activateStart)
    this.el.addEventListener(this.DEACTIVATE_EVENT, this.activateEnd)
  },
  remove: function () {
    this.el.removeEventListener(this.ACTIVATE_EVENT, this.activateStart)
    this.el.removeEventListener(this.DEACTIVATE_EVENT, this.activateEnd)
  },
  activateStart: function (evt) {
    if (evt.defaultPrevented || !this.startButtonOk(evt)) { return }
    if (this.data.buttonStartEvents.indexOf(evt.detail.buttonEvent.type) === -1) { return }
    this.el.addState(this.data.activatedState)
    if (evt.preventDefault) { evt.preventDefault() }
  },
  activateEnd: function (evt) {
    if (evt.defaultPrevented || !this.endButtonOk(evt)) { return }
    if (this.data.buttonEndEvents.indexOf(evt.detail.buttonEvent.type) === -1 || !this.el.is(this.data.activatedState)) { return }
    this.el.removeState(this.data.activatedState)
    if (evt.preventDefault) { evt.preventDefault() }
  }
}))
