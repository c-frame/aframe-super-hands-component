/* global AFRAME */
function elementMatches (el, selector) {
  if (el.matches) { return el.matches(selector) }
  if (el.msMatchesSelector) { return el.msMatchesSelector(selector) }
  if (el.webkitMatchesSelector) { return el.webkitMatchesSelector(selector) }
}
AFRAME.registerComponent('droppable', {
  schema: {
    accepts: {default: ''},
    autoUpdate: {default: true},
    acceptEvent: {default: ''},
    rejectEvent: {default: ''}
  },
  multiple: true,
  init: function () {
    this.HOVERED_STATE = 'dragover'
    this.HOVER_EVENT = 'dragover-start'
    this.UNHOVER_EVENT = 'dragover-end'
    this.DRAGDROP_EVENT = 'drag-drop'

    // better for Sinon spying if original method not overwritten
    this.hoverStartBound = this.hoverStart.bind(this)
    this.hoverEndBound = this.hoverEnd.bind(this)
    this.dragDropBound = this.dragDrop.bind(this)
    this.mutateAcceptsBound = this.mutateAccepts.bind(this)

    this.acceptableEntities = []
    this.observer = new window.MutationObserver(this.mutateAcceptsBound)
    this.observerOpts = {childList: true, subtree: true}

    this.el.addEventListener(this.HOVER_EVENT, this.hoverStartBound)
    this.el.addEventListener(this.UNHOVER_EVENT, this.hoverEndBound)
    this.el.addEventListener(this.DRAGDROP_EVENT, this.dragDropBound)
  },
  update: function () {
    if (this.data.accepts.length) {
      this.acceptableEntities = Array.prototype.slice.call(
        this.el.sceneEl.querySelectorAll(this.data.accepts)
      )
    } else {
      this.acceptableEntities = null
    }
    if (this.data.autoUpdate && this.acceptableEntities != null) {
      this.observer.observe(this.el.sceneEl, this.observerOpts)
    } else {
      this.observer.disconnect()
    }
  },
  remove: function () {
    this.el.removeEventListener(this.HOVER_EVENT, this.hoverStartBound)
    this.el.removeEventListener(this.UNHOVER_EVENT, this.hoverEndBound)
    this.el.removeEventListener(this.DRAGDROP_EVENT, this.dragDropBound)
    this.observer.disconnect()
  },
  mutateAccepts: function (mutations) {
    const query = this.data.accepts
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(added => {
        if (elementMatches(added, query)) {
          this.acceptableEntities.push(added)
        }
      })
    })
  },
  entityAcceptable: function (entity) {
    const acceptableEntities = this.acceptableEntities
    if (acceptableEntities == null) { return true }
    for (let item of acceptableEntities) {
      if (item === entity) {
        return true
      }
    }
    return false
  },
  hoverStart: function (evt) {
    if (evt.defaultPrevented || !this.entityAcceptable(evt.detail.carried)) {
      return
    }
    this.el.addState(this.HOVERED_STATE)
    if (evt.preventDefault) { evt.preventDefault() }
  },
  hoverEnd: function (evt) {
    if (evt.defaultPrevented) { return }
    this.el.removeState(this.HOVERED_STATE)
  },
  dragDrop: function (evt) {
    if (evt.defaultPrevented) { return }
    const dropped = evt.detail.dropped
    if (!this.entityAcceptable(dropped)) {
      if (this.data.rejectEvent.length) {
        this.el.emit(this.data.rejectEvent, {el: dropped})
      }
      return
    }
    if (this.data.acceptEvent.length) {
      this.el.emit(this.data.acceptEvent, {el: dropped})
    }
    if (evt.preventDefault) { evt.preventDefault() }
  }
})
