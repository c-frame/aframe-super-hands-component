/* global AFRAME */
const inherit = AFRAME.utils.extendDeep
const buttonCore = require('./prototypes/buttons-proto.js')

AFRAME.registerComponent('activatable', inherit({}, buttonCore, {
  multiple: true,
  schema: {
    buttonStartEvent: {default: ''},
    buttonEndEvent: {default: ''},
    activatedState: {default: 'activated'},
    activateEvent: {default: 'activate-start'},
    unactivateEvent: {default: 'activate-end'}
  },
  init: function () {
    this.activateStart = this.activateStart.bind(this)
    this.activateEnd = this.activateEnd.bind(this)

    this.el.addEventListener(this.data.activateEvent, this.activateStart)
    this.el.addEventListener(this.data.unactivateEvent, this.activateEnd)
  },
  remove: function () {
    this.el.removeEventListener(this.data.activateEvent, this.activateStart)
    this.el.removeEventListener(this.data.unactivateEvent, this.activateEnd)
  },
  activateStart: function (evt) {
    if (evt.defaultPrevented || !this.startButtonOk(evt)) { return }
    this.el.addState(this.data.activatedState)
    if (evt.preventDefault) { evt.preventDefault() }
  },
  activateEnd: function (evt) {
    if (evt.defaultPrevented || !this.endButtonOk(evt)) { return }
    this.el.removeState(this.data.activatedState)
    if (evt.preventDefault) { evt.preventDefault() }
  }
}))
