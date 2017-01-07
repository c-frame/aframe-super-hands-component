AFRAME.registerComponent('drag-droppable', {
  init: function () {
    this.HOVERED_STATE = 'hovered';
    this.HOVER_EVENT = 'dragover-start';
    this.UNHOVER_EVENT = 'dragover-end';
    
    this.start = this.start.bind(this);
    this.end = this.end.bind(this);
  },
  pause: function () {
    this.el.removeEventListener(this.HOVER_EVENT, this.start);
    this.el.removeEventListener(this.UNHOVER_EVENT, this.end);
  },
  play: function () {
    this.el.addEventListener(this.HOVER_EVENT, this.start);
    this.el.addEventListener(this.UNHOVER_EVENT, this.end);
  },
  start: function(evt) {
    this.el.addState(this.HOVERED_STATE);
  },
  end: function (evt) {
    this.el.removeState(this.HOVERED_STATE);
  } 
});