/* global AFRAME */
AFRAME.registerComponent('drop-target', {
  schema: {
    accepts: {type: 'selectorAll'},
    acceptEvent: {default: ''},
    rejectEvent: {default: ''}
  },
  multiple: true,
  init: function () {
    this.HOVERED_STATE = 'dragover';
    this.HOVER_EVENT = 'dragover-start';
    this.UNHOVER_EVENT = 'dragover-end';
    this.DRAGDROP_EVENT = 'drag-drop';

    // better for Sinon spying if original method not overwritten
    this.hoverStartBound = this.hoverStart.bind(this);
    this.hoverEndBound = this.hoverEnd.bind(this);
    this.dragDropBound = this.dragDrop.bind(this);

    this.el.addEventListener(this.HOVER_EVENT, this.hoverStartBound);
    this.el.addEventListener(this.UNHOVER_EVENT, this.hoverEndBound);
    this.el.addEventListener(this.DRAGDROP_EVENT, this.dragDropBound);
  },
  remove: function () {
    this.el.removeEventListener(this.HOVER_EVENT, this.hoverStartBound);
    this.el.removeEventListener(this.UNHOVER_EVENT, this.hoverEndBound);
    this.el.removeEventListener(this.DRAGDROP_EVENT, this.dragDropBound);
  },
  entityAcceptable: function (entity) {
    const accepts = this.data.accepts;
    if (accepts == null || accepts.length === 0) { return true; }
    for (let item of accepts) {
      if (item === entity) {
        return true;
      }
    }
    return false;
  },
  hoverStart: function (evt) {
    if (!this.entityAcceptable(evt.detail.carried)) { return; }
    this.el.addState(this.HOVERED_STATE);
    if (evt.preventDefault) { evt.preventDefault(); }
  },
  hoverEnd: function (evt) {
    this.el.removeState(this.HOVERED_STATE);
  },
  dragDrop: function (evt) {
    const carried = evt.detail.carried;
    if (!this.entityAcceptable(carried)) {
      if (this.data.rejectEvent.length) {
        this.el.emit(this.data.rejectEvent, {el: carried});
      }
      return;
    }
    if (this.data.acceptEvent.length) {
      this.el.emit(this.data.acceptEvent, {el: carried});
    }
    if (evt.preventDefault) { evt.preventDefault(); }
  }
});
