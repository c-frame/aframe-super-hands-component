AFRAME.registerComponent('drag-droppable', {
  init: function () {
    this.HOVERED_STATE = 'dragover';
    this.HOVER_EVENT = 'dragover-start';
    this.UNHOVER_EVENT = 'dragover-end';
    this.DRAGDROP_EVENT = 'drag-drop';
    
    this.start = this.start.bind(this);
    this.end = this.end.bind(this);
    this.dragDrop = this.dragDrop.bind(this);
    
    this.el.addEventListener(this.HOVER_EVENT, this.start);
    this.el.addEventListener(this.UNHOVER_EVENT, this.end);
    this.el.addEventListener(this.DRAGDROP_EVENT, this.dragDrop);
  },
  remove: function () {
    this.el.removeEventListener(this.HOVER_EVENT, this.start);
    this.el.removeEventListener(this.UNHOVER_EVENT, this.end);    
  },
  start: function(evt) {
    this.el.addState(this.HOVERED_STATE);
    this.dispatchDragEvent('dragenter', evt);
  },
  end: function (evt) {
    this.el.removeState(this.HOVERED_STATE);
    this.dispatchDragEvent('dragleave', evt);
  },
  dragDrop: function (evt) {
    this.dispatchDragEvent('drop', evt);
  },
  dispatchDragEvent: function (type, superHandsEvt) {
    var rt = superHandsEvt.detail.carried || superHandsEvt.detail.dropped;
    if(rt === this.el) {
      rt = superHandsEvt.detail.hovered || superHandsEvt.detail.on;
    }
    this.el.dispatchEvent(new MouseEvent(type, { relatedTarget: rt }));
  }
});