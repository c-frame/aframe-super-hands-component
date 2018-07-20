/* global AFRAME */
const inherit = AFRAME.utils.extendDeep
const buttonCore = require('./prototypes/buttons-proto.js')

AFRAME.registerComponent('activatable', inherit({}, buttonCore, {
  multiple: true,
  schema: {
    buttonStartEvent: {default: ''},
    buttonEndEvent: {default: ''},
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
    if (evt.detail.buttonEvent.type !== this.data.buttonStartEvent) { return }
    this.el.addState(this.data.activatedState)
    if (evt.preventDefault) { evt.preventDefault() }
  },
  activateEnd: function (evt) {
    if (evt.defaultPrevented || !this.endButtonOk(evt)) { return }
    if (evt.detail.buttonEvent.type !== this.data.buttonEndEvent) { return }
    this.el.removeState(this.data.activatedState)
    if (evt.preventDefault) { evt.preventDefault() }
  }
}))
