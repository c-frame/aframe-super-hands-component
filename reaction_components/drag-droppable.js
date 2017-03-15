AFRAME.registerComponent('drag-droppable', {
  init: function () {
    this.HOVERED_STATE = 'dragover';
    this.DRAGGED_STATE = 'dragged';
    this.HOVER_EVENT = 'dragover-start';
    this.UNHOVER_EVENT = 'dragover-end';
    this.DRAG_EVENT = 'drag-start';
    this.DRAGDROP_EVENT = 'drag-drop';  
    
    this.hoverStart = this.hoverStart.bind(this);
    this.dragStart = this.dragStart.bind(this);
    this.hoverEnd = this.hoverEnd.bind(this);
    this.dragEnd = this.dragEnd.bind(this);
    
    this.el.addEventListener(this.HOVER_EVENT, this.hoverStart);
    this.el.addEventListener(this.DRAG_EVENT, this.dragStart);
    this.el.addEventListener(this.UNHOVER_EVENT, this.hoverEnd);    
    this.el.addEventListener(this.DRAGDROP_EVENT, this.dragEnd);  
  },
  remove: function () {
    this.el.removeEventListener(this.HOVER_EVENT, this.hoverStart);
    this.el.removeEventListener(this.DRAG_EVENT, this.dragStart);
    this.el.removeEventListener(this.UNHOVER_EVENT, this.hoverEnd);    
    this.el.removeEventListener(this.DRAGDROP_EVENT, this.dragEnd);    
  },
  hoverStart: function(evt) {
    this.el.addState(this.HOVERED_STATE);
    evt.preventDefault();
  },
  dragStart: function(evt) {
    this.el.addState(this.DRAGGED_STATE);
    evt.preventDefault();
  },
  hoverEnd: function (evt) {
    this.el.removeState(this.HOVERED_STATE);
  },
  dragEnd: function (evt) {
    this.el.removeState(this.DRAGGED_STATE);
    evt.preventDefault();
  }
});