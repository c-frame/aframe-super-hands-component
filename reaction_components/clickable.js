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
  start: function(evt) {
    this.el.addState(this.CLICKED_STATE);
    if(this.clickers.indexOf(evt.detail.hand) === -1) {
      this.clickers.push(evt.detail.hand);
    }
    this.dispatchMouseEvent('mousedown', evt);
  },
  end: function (evt) {
    var handIndex = this.clickers.indexOf(evt.detail.hand);
    this.dispatchMouseEvent('mouseup', evt);
    if(handIndex !== -1) {
      this.clickers.splice(handIndex, 1);
      this.dispatchMouseEvent('click', evt);
    }
    if(this.clickers.length < 1) {
      this.el.removeState(this.CLICKED_STATE);
    }
  },
  dispatchMouseEvent: function (type, superHandsEvt) {
    var mEvt = new MouseEvent(type, { 
      relatedTarget: superHandsEvt.detail.hand
    });
    this.el.dispatchEvent(mEvt);
  }
});