// DIALOG ACTION PARA O LEX: ELICIT SLOT
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

// DIALOG ACTION PARA O LEX: DELEGATE
module.exports.delegate = function(sessionAttributes, slots, callback) {
  return callback({
    sessionAttributes,
    dialogAction: {
      type: 'Delegate',
      slots
    }
  })
}

// DIALOG ACTION PARA O LEX: CONFIRM INTENT
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

// DIALOG ACTION PARA O LEX: ELICIT INTENT
module.exports.elicitIntent = function(sessionAttributes, message=undefined, responseCard=undefined, callback) {
  return callback({
    sessionAttributes,
    dialogAction: {
      type: 'ElicitIntent',
      message,
      responseCard
    }
  })
}

// DIALOG ACTION PARA O LEX: CLOSE
module.exports.close = function(sessionAttributes, fulfillmentState, message=undefined, responseCard=undefined, callback) {
  return callback({
    sessionAttributes,
    dialogAction: {
      type: 'Close',
      fulfillmentState,
      message,
      responseCard
    }
  })
}