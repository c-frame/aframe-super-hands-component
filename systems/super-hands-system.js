/* global AFRAME */
AFRAME.registerSystem('super-hands', {
  init: function () {
    this.superHands = []
  },
  registerMe: function (comp) {
    // when second hand registers, store links
    if (this.superHands.length === 1) {
      this.superHands[0].otherSuperHand = comp
      comp.otherSuperHand = this.superHands[0]
    }
    this.superHands.push(comp)
  },
  unregisterMe: function (comp) {
    const index = this.superHands.indexOf(comp)
    if (index !== -1) {
      this.superHands.splice(index, 1)
    }
    this.superHands.forEach(x => {
      if (x.otherSuperHand === comp) { x.otherSuperHand = null }
    })
  }
})
