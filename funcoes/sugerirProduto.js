'use strict';
    
const api = require('../api')

const CONTAINER_TIPOROUPAS = ["camisa", "calca", "calça", "sandalia", "blusa", "camiseta", "chinelo", "sapato", "calçado", "tênis", "tenis",
          "camisas", "calcas", "sandalias", "blusas", "camisetas", "chinelos", "sapatos", "calcados", "calçados"];
const CONTAINER_CATEGORIAS = ["social", "sociais", "esportivo", "esportivos", "esportiva", "esportivas", "casual", "casuais"];
const CONTAINER_NUMERO_PMG = ["pp", "p", "m", "g", "xg"];
const CONTAINER_NUMERO_NUM = ["35", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46"];
const CONTAINER_COR = ["azul", "preto", "verde", "amarelo", "branco", "laranja", "vermelho", "marrom",
                        "preta", "amarela", "branca", "vermelha"];


const getCategorias = async () => {
  const url = 'catalog_system/pub/category/tree/1'

  const response = await api.get(url)
  const data = response.data

  console.log(' response:', response)
  console.log(' data:', data)

  const categorias = data.map(categoria => (
    categoria.name
  ))

  console.log(' response:', response)
  console.log(' data:', data)

  return categorias
}


async function validate(slots) {

  console.log(' Categorias da API:', await getCategorias())

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

async function dispatch(intentRequest, callback) {
  
  const slots = intentRequest.currentIntent.slots;

  const resultValidation = await validate(slots);

  // se algum slot está invalido
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
    return
  }
  
  // todos slots estão válidos
  callback({
    sessionAttributes: intentRequest.sessionAttributes,
    dialogAction: {
      type: 'Delegate',
      slots: intentRequest.currentIntent.slots
    }
  })

  return
}

module.exports = async (event, context, callback) => {
  try {

    await dispatch(event, (response) => callback(null, response));

  } catch (err) {

    callback(err);

  }
};

