/* global AFRAME */
AFRAME.registerComponent('clickable', {
  schema: {
    onclick: { type: 'string' }
  },
  init: function () {
    this.CLICKED_STATE = 'clicked';
    this.CLICK_EVENT = 'grab-start';
    this.UNCLICK_EVENT = 'grab-end';
    this.clickers = [];

    this.start = this.start.bind(this);
    this.end = this.end.bind(this);
    this.el.addEventListener(this.CLICK_EVENT, this.start);
    this.el.addEventListener(this.UNCLICK_EVENT, this.end);
  },
  remove: function () {
    this.el.removeEventListener(this.CLICK_EVENT, this.start);
    this.el.removeEventListener(this.UNCLICK_EVENT, this.end);
  },
  start: function (evt) {
    this.el.addState(this.CLICKED_STATE);
    if (this.clickers.indexOf(evt.detail.hand) === -1) {
      this.clickers.push(evt.detail.hand);
      if (evt.preventDefault) { evt.preventDefault(); }
    }
  },
  end: function (evt) {
    var handIndex = this.clickers.indexOf(evt.detail.hand);
    if (handIndex !== -1) {
      this.clickers.splice(handIndex, 1);
    }
    if (this.clickers.length < 1) {
      this.el.removeState(this.CLICKED_STATE);
    }
    if (evt.preventDefault) { evt.preventDefault(); }
  }
});
