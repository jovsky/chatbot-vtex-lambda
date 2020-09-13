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

  const result = data.map(result => (
    result.name.toLowerCase()
  ))

  return result
}


async function validate(slots) {

  
  const { categoria, numero, cor } = slots;
  
  
  const categorias = await getCategorias()
  console.log(' Categorias da API:', categorias)

  /* if (categoria !== null && !categorias.includes(categoria.toLowerCase())) {
    //console.log(' >>> ', categorias, tipoRoupa.toLowerCase(), categorias.includes(tipoRoupa.toLowerCase()))
    return {
      isValid: false,
      violatedSlot: "tipoRoupa",
      message: {
        contentType: "PlainText",
        content: "Desculpe, não possuimos esta categoria na loja, temos por exemplo " + categorias[4]+ ". Qual deseja?"
      }
    }
  }  */

  if (categoria !== null && !categorias.includes(categoria.toLowerCase())) {
    return {
      isValid: false,
      violatedSlot: "categoria",
      /* message: {
        contentType: "PlainText",
        content: `Desculpe, trabalhamos apenas com as categorias: ${categorias}. Qual deseja?`,
      }, */
      responseCard: {
        version: 1,
        contentType: "application/vnd.amazonaws.card.generic",
        genericAttachments: [
          {
            title: `Desculpe, trabalhamos apenas com as seguintes categorias. Qual deseja?`,
            subTitle: "Escolha uma das opcoes", 
            imageUrl: "https://hiringcoders14.vtexassets.com/assets/vtex/assets-builder/vtex.minimumtheme/0.1.0/jaquetaAzul___a3a35d6a629d8738bd26dc2628486c69.jpg",
            buttons: [
              {
                text: categorias[0],
                value: "blusas"
              },
              {
                text: categorias[1],
                value: "chapeus"
              },
              {
                text: categorias[2],
                value: "camisas"
              },
              {
                text: categorias[3],
                value: "camisas"
              },
              {
                text: categorias[4],
                value: "camisas"
              }
            ]
          }
        ]
      }
    }
  } /* else if(categoria !== null && categorias.includes(categoria.toLowerCase())){
    return {
      isValid: true,
      currentSlot: "categoria",
      botVersion: "$LATEST",
      dialogState: "ElicitSlot",
      violatedSlot: "opcao",
      message: {
        contentType: "PlainText",
        content: "Temos os siguintes produtos para esta categoria, qual precisa?"
      }
    }
  }  */

  if (numero !== null) {
    // console.log(" TERCEIRO LOG:", numero, numero.toLowerCase(), CONTAINER_NUMERO_PMG.includes(numero.toLowerCase()), CONTAINER_NUMERO_PMG.includes(numero.toLowerCase()) )
    if (categorias.includes(categoria.toLowerCase())) {
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

async function cardOpcao(categoria) {
  const url = 'catalog_system/pub/category/tree/1'

  const response = await api.get(url)
  const data = response.data

  return {
    slotToElicit: "opcao",
    // message: {
    // contentType: "PlainText",
    // content: "Temos os siguintes produtos para esta categoria, qual precisa?"
    // },
    responseCard: {

    }
  }
}

async function dispatch(intentRequest, callback) {
  
  const slots = intentRequest.currentIntent.slots;

  // verificar se a categoria ainda precisa ser validada
  if (true) {
    
    const resultValidation = await validate(slots);

  }
  // categoria já está ok, agora vamos mandar o response Card com as opcoes da API
  else if (true) {

    const cardOpcao = await cardOpcao();

  }


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
        responseCard: resultValidation.responseCard
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

