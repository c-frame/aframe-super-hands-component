AFRAME.registerComponent('hoverable', {
  init: function () {
    this.HOVERED_STATE = 'hovered';
    this.HOVER_EVENT = 'hover-start';
    this.UNHOVER_EVENT = 'hover-end';
    
    this.hoverers = [];
    
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
    if(this.hoverers.indexOf(evt.detail.hand) === -1) {
      this.hoverers.push(evt.detail.hand);
    }
  },
  end: function (evt) {
    var handIndex = this.hoverers.indexOf(evt.detail.hand);
    if(handIndex !== -1) {
      this.hoverers.splice(handIndex, 1);
    }
    if(this.hoverers.length < 1) {
      this.el.removeState(this.HOVERED_STATE);
    }
  } 
});