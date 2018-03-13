// integration with networked-aframe
module.exports = {
  schema: {
    takeOwnership: {default: false}
  },
  networkedInit: function () {
    this.isNetworked = window.NAF &&
        !!window.NAF.utils.getNetworkedEntity(this.el)
  },
  networkedOk: function () {
    if (!this.isNetworked || window.NAF.utils.isMine(this.el)) {
      return true
    }
    if (this.data.takeOwnership) {
      return window.NAF.utils.takeOwnership(this.el)
    }
    return false
  }
}
