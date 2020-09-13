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

  const result = data.map(result => {
    return {
      nome: result.name.toLowerCase(),
      id: result.id
    }
  })

  return result
}

const getProdutos = async (idCategoria, categoria) => {

  // console.log(' ID do blusas:', idCategoria)

  const url = `catalog_system/pub/products/search?fq=C:/${idCategoria}/`

  const response = await api.get(url)
  const data = response.data

  if(data.length === 0 || data === null) {
    throw new Error(`Lamento, estamos sem estoque de ${categoria}. Faça outra escolha.`);
  }

  const result = data.map( produto => {
    return {
      nome: produto.productName,
      id: produto.productId
    }
  })

  return result
}

async function validate(slots, categorias) {

  console.log(' SLOTS NO VALIDATE:', slots);
  const categoria = slots.categoria;
  
  const nomesCategorias = categorias.map( categoria => categoria.nome)

  if (!nomesCategorias.includes(categoria.toLowerCase())) {
    return {
      isValid: false,
      violatedSlot: "categoria"
    }
  }
  else {
    return {
      isValid: true
    }
  }

}

async function cardOpcao(categoria, categorias) {

  const result = categorias.filter( (cat) => cat.nome === categoria);
  const idCategoria = result[0].id;


  const produtosAPI = await getProdutos(idCategoria, categoria);


  const botoesOpcoes = produtosAPI.map( (produto) => {
    return {
      text: produto.nome,
      value: produto.nome
    }
  })

  return {
    version: 1,
    contentType: "application/vnd.amazonaws.card.generic",
    genericAttachments: [
      {
        buttons: botoesOpcoes
      }
    ]
  }
}

async function cardCategorias() {

  const categorias = await getCategorias()  // ['blusa', 'calca', 'sapatos']
  console.log(' Categorias da API:', categorias)

  const botoesCategorias = categorias.map( (categoria) => {
    return {
      text: categoria.nome,
      value: categoria.nome
    }
  })

  return {
    version: 1,
    contentType: "application/vnd.amazonaws.card.generic",
    genericAttachments: [
      {
        buttons: botoesCategorias
      }
    ]
  }
}


async function dispatch(intentRequest, callback) {

  let categoriaValida = false;
  
  const slots = intentRequest.currentIntent.slots;
  var categorias;

  console.log(' SLOTS: ', slots)
  

  // a categoria ainda nao foi informada
  if (slots.categoria === null && slots.opcao === null) {

    console.log(' ENTROU NO PRIMEIRO IF', slots.categoria, slots.opcao)

    callback({
      sessionAttributes: intentRequest.sessionAttributes,
      dialogAction: {
        type: 'ElicitSlot',
        intentName: intentRequest.currentIntent.name,
        slots,
        slotToElicit: 'categoria',
        message: {
          contentType: 'PlainText',
          content: 'Para lhe ajudar, precisamos saber que tipo de roupa está procurando. Temos as seguintes categorias:'
        },
        responseCard: await cardCategorias()
      }
    })
    return

  }

  // verificar se a categoria ainda precisa ser validada
  else if (slots.categoria !== null && slots.opcao === null) {
    
    // console.log(' ENTROU NO SEGUNDO IF', slots.categoria, slots.opcao)

    categorias = await getCategorias(); 

    const resultValidation = await validate(slots, categorias);

    // se a categoria for ivnalida
    if (!resultValidation.isValid) {
      slots.categoria = null;
      callback({
        sessionAttributes: intentRequest.sessionAttributes,
        dialogAction: {
          type: 'ElicitSlot',
          intentName: intentRequest.currentIntent.name,
          slots,
          slotToElicit: 'categoria',
          message: {
            contentType: 'PlainText',
            content: 'Desculpe, não temos esta categoria. Temos as seguintes:'
          },
          responseCard: await cardCategorias()
        }
      })
      return
    }
    // se a cateogira está certa
    else {
      categoriaValida = true;

    }

  }
  
  // categoria já está ok, agora vamos mandar o response Card com as opcoes da API
  if (categoriaValida) {

    var card;

    try{

      card = await cardOpcao(slots.categoria, categorias);

    } 
    catch (msgErro) {
      slots.categoria = null;
      callback({
        sessionAttributes: intentRequest.sessionAttributes,
        dialogAction: {
          type: 'ElicitSlot',
          intentName: intentRequest.currentIntent.name,
          slots,
          slotToElicit: 'categoria',
          message: {
            contentType: 'PlainText',
            content: msgErro.message
          },
          responseCard: await cardCategorias()
        }
      })
      return
    }
    

    callback({
      sessionAttributes: intentRequest.sessionAttributes,
      dialogAction: {
        type: 'ElicitSlot',
        intentName: intentRequest.currentIntent.name,
        slots,
        slotToElicit: 'opcao',
        responseCard: card
      }
    })
    return

  }


  // // se algum slot está invalido
  // if (!resultValidation.isValid) {
  //   slots[resultValidation.violatedSlot] = null;
  //   callback({
  //     sessionAttributes: intentRequest.sessionAttributes,
  //     dialogAction: {
  //       type: 'ElicitSlot',
  //       intentName: intentRequest.currentIntent.name,
  //       slots,
  //       slotToElicit: resultValidation.violatedSlot,
  //       responseCard: resultValidation.responseCard
  //     }
  //   })
  //   return
  // }
  
  // // todos slots estão válidos


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

