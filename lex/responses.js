module.exports.elicitSlot = function(sessionAttributes, intentName, slots, slotToElicit, message=undefined, responseCard=undefined, callback) {
  return callback({
    sessionAttributes,
    dialogAction: {
      type: 'ElicitSlot',
      intentName,
      slots,
      slotToElicit,
      message,
      responseCard
    }
  })
}

module.exports.delegate = function(sessionAttributes, slots, callback) {
  return callback({
    sessionAttributes,
    dialogAction: {
      type: 'Delegate',
      slots
    }
  })
}

module.exports.confirmIntent = function(sessionAttributes, intentName, slots, message=undefined, responseCard=undefined, callback) {
  return callback({
    sessionAttributes,
    dialogAction: {
      type: 'ConfirmIntent',
      intentName,
      slots,
      message,
      responseCard
    }
  })
}