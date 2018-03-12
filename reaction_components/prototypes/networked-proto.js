// integration with networked-aframe
module.exports = {
  schema: {
    takeOwnership: {default: false}
  },
  networkedOk: function () {
    if (!window.NAF || window.NAF.utils.isMine(this.el)) {
      return true
    }
    if (this.data.takeOwnership) {
      return window.NAF.utils.takeOwnership(this.el)
    }
    return false
  }
}
