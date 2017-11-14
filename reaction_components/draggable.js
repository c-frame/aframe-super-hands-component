/* global AFRAME */
const inherit = AFRAME.utils.extendDeep
const buttonCore = require('./prototypes/buttons-proto.js')

AFRAME.registerComponent('draggable', inherit({}, buttonCore, {
  init: function () {
    this.DRAGGED_STATE = 'dragged'
    this.DRAG_EVENT = 'drag-start'
    this.UNDRAG_EVENT = 'drag-end'

    this.dragStartBound = this.dragStart.bind(this)
    this.dragEndBound = this.dragEnd.bind(this)

    this.el.addEventListener(this.DRAG_EVENT, this.dragStartBound)
    this.el.addEventListener(this.UNDRAG_EVENT, this.dragEndBound)
  },
  remove: function () {
    this.el.removeEventListener(this.DRAG_EVENT, this.dragStart)
    this.el.removeEventListener(this.UNDRAG_EVENT, this.dragEnd)
  },
  dragStart: function (evt) {
    if (evt.defaultPrevented || !this.startButtonOk(evt)) { return }
    this.el.addState(this.DRAGGED_STATE)
    if (evt.preventDefault) { evt.preventDefault() }
  },
  dragEnd: function (evt) {
    if (evt.defaultPrevented || !this.endButtonOk(evt)) { return }
    this.el.removeState(this.DRAGGED_STATE)
    if (evt.preventDefault) { evt.preventDefault() }
  }
}))
