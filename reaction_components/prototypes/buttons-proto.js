// common code used in customizing reaction components by button
module.exports = (function () {
  function buttonIsValid (evt, buttonList) {
    return buttonList.length === 0 ||
        buttonList.indexOf(evt.detail.buttonEvent.type) !== -1
  }
  return {
    schema: {
      startButtons: { default: [] },
      endButtons: { default: [] }
    },
    startButtonOk: function (evt) {
      return buttonIsValid(evt, this.data.startButtons)
    },
    endButtonOk: function (evt) {
      return buttonIsValid(evt, this.data.endButtons)
    }
  }
})()
