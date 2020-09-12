'use strict';
    
const CONTAINER_TIPOROUPAS = ["camisa", "calca", "calça", "sandalia", "blusa", "camiseta", "chinelo", "sapato", "calçado", "tênis", "tenis",
          "camisas", "calcas", "sandalias", "blusas", "camisetas", "chinelos", "sapatos", "calcados", "calçados"];
const CONTAINER_CATEGORIAS = ["social", "sociais", "esportivo", "esportivos", "esportiva", "esportivas", "casual", "casuais"];
const CONTAINER_NUMERO_PMG = ["pp", "p", "m", "g", "xg"];
const CONTAINER_NUMERO_NUM = ["35", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46"];
const CONTAINER_COR = ["azul", "preto", "verde", "amarelo", "branco", "laranja", "vermelho", "marrom",
                        "preta", "amarela", "branca", "vermelha"]

function validate(slots) {

  const { tipoRoupa, categoria, numero, cor } = slots;

  if (tipoRoupa !== null && !CONTAINER_TIPOROUPAS.includes(tipoRoupa.toLowerCase())) {
    return {
      isValid: false,
      violatedSlot: "tipoRoupa",
      message: {
        contentType: "PlainText",
        content: "Desculpe, não possuimos este tipo de roupa na loja, possuimos camisas, calças e calçados. Qual deseja?"
      }
    }
  }

  if (categoria !== null && !CONTAINER_CATEGORIAS.includes(categoria.toLowerCase())) {
    return {
      isValid: false,
      violatedSlot: "categoria",
      message: {
        contentType: "PlainText",
        content: "Desculpe, trabalhamos apenas com as categorias social, esportiva e casual. Qual deseja?"
      }
    }
  }

  if (numero !== null) {
    // console.log(" TERCEIRO LOG:", numero, numero.toLowerCase(), CONTAINER_NUMERO_PMG.includes(numero.toLowerCase()), CONTAINER_NUMERO_PMG.includes(numero.toLowerCase()) )
    if (["camisas", "camisa", "camisetas", "blusa", "camiseta", "camisetas", "blusas"].includes(tipoRoupa.toLowerCase())) {
      if (!CONTAINER_NUMERO_PMG.includes(numero.toLowerCase())) {
        return {
          isValid: false,
          violatedSlot: "numero",
          message: {
            contentType: "PlainText",
            content: "Não possuímos este tamanho para este item. Temos disponíveis PP, P, M, G, XG. Qual deseja?"
          }
        }
      }
    } else {
      if (!CONTAINER_NUMERO_NUM.includes(numero.toLowerCase())) {
        return {
          isValid: false,
          violatedSlot: "numero",
          message: {
            contentType: "PlainText",
            content: "Não possuímos este tamanho para este item. Escolha um tamanho entre 35 e 46."
          }
        }
      }
    }
  }

  if (cor !== null && !CONTAINER_COR.includes(cor.toLowerCase())) {
    return {
      isValid: false,
      violatedSlot: "cor",
      message: {
        contentType: "PlainText",
        content: "Não possuímos este item nesta cor, escolha outra."
      }
    }
  }

  return {
    isValid: true
  }
}

function dispatch(intentRequest, callback) {
  
  const slots = intentRequest.currentIntent.slots;

  const resultValidation = validate(slots);

  // se algum slot for invalido
  if (!resultValidation.isValid) {
    slots[resultValidation.violatedSlot] = null;
    callback({
      sessionAttributes: intentRequest.sessionAttributes,
      dialogAction: {
        type: 'ElicitSlot',
        intentName: intentRequest.currentIntent.name,
        slots,
        slotToElicit: resultValidation.violatedSlot,
        message: resultValidation.message
      }
    })
  }
  // todos slots estão válidos
  else {
    callback({
      sessionAttributes: intentRequest.sessionAttributes,
      dialogAction: {
        type: 'Delegate',
        slots: intentRequest.currentIntent.slots
      }
    })
  }

  return
}

module.exports.sugerirProduto = (event, context, callback) => {
  try {

    dispatch(event, (response) => callback(null, response));


  } catch (err) {

    callback(err);

  }
};

