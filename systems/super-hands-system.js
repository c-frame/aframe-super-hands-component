AFRAME.registerSystem('super-hands', {
  init: function () {
    this.controllers = [];
  },
  registerMe: function (el) {
    //when second controller registers, store links
    if(this.controllers.length === 1) {
      this.controllers[0].components['super-hands'].otherController = el;
      el.components['super-hands'].otherController = this.controllers[0];
    }
    this.controllers.push(el);
  },
  unregisterMe: function (el) {
    var index = this.controllers.indexOf(el);
    if(index !== -1) {
      this.controllers.splice(index, 1);
    }
    this.controllers.forEach(x => {
      if(x.otherController === el) { x.otherControler = null; }
    });
  } 
});
