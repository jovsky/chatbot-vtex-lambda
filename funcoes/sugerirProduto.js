'use strict';

const api = require('../api')
const nomesSlotsOrdenados = ['categoria', 'produto', 'sku']

String.prototype.replaceChar=function(c1, c2) {
  let newStr = "";
  for(let i=0; i<this.length; i++) this[i]===c1 ? (newStr+=c2) : (newStr+=this[i])
  return newStr;
}
String.prototype.toTitleCase=function() {
  return this[0].toUpperCase() + this.slice(1);
}

const getCategorias = async () => {
  const url = 'catalog_system/pub/category/tree/1'

  const response = await api.get(url)
  const data = response.data

  const result = data.map(result => {
    return {
      nome: result.name.replaceChar(" ", "_").toLowerCase(),
      id: result.id
    }
  })

  return result
}

const getProdutos = async (categoria) => {

  const idCategoria = getIdCategoria(categoria);

  const url = `catalog_system/pub/products/search?fq=C:/${idCategoria}/`

  const response = await api.get(url)
  const data = response.data

  if (data.length === 0 || data === null) {
    throw new Error(`Lamento, estamos sem estoque de ${categoria}. Faça outra escolha.`);
  }

  const result = data.map(produto => {
    return {
      nome: produto.productName.replaceChar(" ", "_").toLowerCase(),
      id: produto.productId,
      skus: produto.items
    }
  })

  return result
}

const getSKUs = (produto) => {

  const idProduto = getIdProduto(produto);

  const skusProduto = getSKUProduto(idProduto) // []

  console.log('  --> SKUS:', skusProduto[0].sellers);

  // const url = `catalog_system/pub/products/search?fq=productId:${idProduto}`

  // const response = await api.get(url)
  // const data = response.data

  // if(data.length === 0 || data === null) {
  //   throw new Error(`Lamento, estamos sem estoque de ${produto}. Faça outra escolha.`);
  // }

  const result = skusProduto.map(sku => {
    return {
      nome: sku.name.replaceChar(" ", "_").toLowerCase(),
      id: sku.itemId,
      preco: sku.sellers[0].commertialOffer.Price,
      linkCarrinho: sku.sellers[0].addToCartLink,
      imagem: sku.images[0].imageUrl
    }
  })

  console.log(' Resultttt', result)

  return result

}

var categoriasAPI;
var produtosAPI;
var skusAPI;


async function validate(slots) {

  const { categoria, produto } = slots;

  const nomesCategorias = categoriasAPI.map(categoria => categoria.nome)
  if (!nomesCategorias.includes(categoria.toLowerCase())) {
    return {
      isValid: false,
      violatedSlot: "categoria"
    }
  }

  console.log(' check validation >', produtosAPI !== undefined, produto !== null)
  if (produtosAPI !== undefined && produto !== null) {
    const nomesProdutos = produtosAPI.map(produto => produto.nome)
    console.log(nomesProdutos, produto)
    if (!nomesProdutos.includes(produto.toLowerCase())) {
      return {
        isValid: false,
        violatedSlot: "produto"
      }
    }
  }

  
  return {
    isValid: true
  }
  

}

function getIdCategoria(categoria) {
  const result = categoriasAPI.filter((cat) => cat.nome === categoria);
  return result[0].id;
}

function getIdProduto(produto) {
  const result = produtosAPI.filter((prod) => prod.nome === produto);
  return result[0].id;
}

function getSKUProduto(idProduto) {
  const result = produtosAPI.filter((prod) => prod.id === idProduto);
  console.log(' Get SKU produto:', idProduto, result)
  return result[0].skus;
}

function cardCategorias() {

  // console.log(' Categorias da API:', categoriasAPI)
  const botoesCategorias = categoriasAPI.map((categoria) => {
    console.log(' ... '+categoria.nome)
    return {
      text: categoria.nome.replaceChar("_", " ").toTitleCase(),
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

function cardProdutos() {

  console.log('aaaaaa', produtosAPI)
  const botoesProdutos = produtosAPI.map((produto) => {
    console.log(' ... '+produto.nome)
    return {
      text: produto.nome.replaceChar("_", " ").toTitleCase(),
      value: produto.nome
    }
  })

  return {
    version: 1,
    contentType: "application/vnd.amazonaws.card.generic",
    genericAttachments: [
      {
        buttons: botoesProdutos
      }
    ]
  }
}


function cardSKUs() {

  console.log(' <<<>>>> skusAPI', skusAPI)
  const slideCards = skusAPI.map((sku) => {
    return {
      title: sku.nome.replaceChar("_"," ").toUpperCase(),
      subTitle: sku.price,
      imageUrl: sku.imagem,
      attachmentLinkUrl: sku.linkCarrinho,
      buttons: [{
        text: 'Comprar',
        value: 'teste'
      }]
    }
  })

  return {
    version: 1,
    contentType: "application/vnd.amazonaws.card.generic",
    genericAttachments: slideCards
  }
}

async function dispatch(intentRequest, callback) {

  var ultimoSlotValidado = '';
  var proximoSlot = '';

  categoriasAPI = await getCategorias();

  const slots = intentRequest.currentIntent.slots;

  console.log(' SLOTS: ', slots)

  // a categoria ainda nao foi informada
  if (slots.categoria === null) {

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
        responseCard: cardCategorias()
      }
    })
    return

  }

  // verificar se a categoria ainda precisa ser validada
  if (slots.categoria !== null) {

    const resultValidation = await validate(slots);

    // se alguma slot for invalida
    if (!resultValidation.isValid) {

      slots[resultValidation.violatedSlot] = null;

      var card;

      switch (resultValidation.violatedSlot) {
        case 'categoria':
          card = cardCategorias();
          break;
        case 'produto':
          card = cardProdutos();
          break;
        case 'sku':
          card = cardSKUs();
          break;
        default:
          break;
      }

      callback({
        sessionAttributes: intentRequest.sessionAttributes,
        dialogAction: {
          type: 'ElicitSlot',
          intentName: intentRequest.currentIntent.name,
          slots,
          slotToElicit: resultValidation.violatedSlot,
          message: {
            contentType: 'PlainText',
            content: 'Desculpe, não temos a opção escolhida. Temos as seguintes:'
          },
          responseCard: card
        }
      })
      return
    }

    // se todas slots preenchidos forem validos
    // determinar o proximo slot
    else {

      // console.log(' CONSOLE 1')

      //  [categoria, produto,   sku1, sku2] 
      // const entriesSlots = Object.entries(slots).reverse();    //  ['casacos', 'moletom', null, null] --> proximoSlot

      // console.log('  >> ENTRIES ', entriesSlots);
      // [ ['categoria','blusas'], ['produto', null] ]

      for (let i = 0; i < nomesSlotsOrdenados.length - 1; i++) {

        // console.log('  >> ', entriesSlots[i])

        const nomeSlotAtual = nomesSlotsOrdenados[i];
        const valorSlotAtual = slots[nomeSlotAtual];

        const nomeProximoSlot = nomesSlotsOrdenados[i + 1];
        const valorProximoSlot = slots[nomeProximoSlot];

        // console.log('  >> ', valorSlotAtual, valorProximoSlot, nomeProximoSlot, nomeSlotAtual)
        //      null           casacos          

        if (valorSlotAtual !== null && valorProximoSlot === null) {
          ultimoSlotValidado = nomeSlotAtual;
          proximoSlot = nomeProximoSlot;
          // console.log('  proximoSlot:', proximoSlot, '   ultimoSlotValidado:', ultimoSlotValidado)
          break;
        }
      }
    }

  }

  // console.log('  proximoSlot:', proximoSlot, '   ultimoSlotValidado:', ultimoSlotValidado)

  // os ultimos slots preenchidos estão validados, agora precisa elicitar o proximo Slot
  if (proximoSlot !== '' && ultimoSlotValidado !== '') {

    var card, ultimoCard;

    try {
      switch (proximoSlot) {
        case 'categoria':
          break;
        case 'produto':
          produtosAPI = await getProdutos(slots.categoria);
          card = cardProdutos();
          ultimoCard = cardCategorias();
          break;
        case 'sku':
          skusAPI = getSKUs(slots.produto);
          card = cardSKUs();
          ultimoCard = cardProdutos();
          break;
        default:
          break;
      }

      callback({
        sessionAttributes: intentRequest.sessionAttributes,
        dialogAction: {
          type: 'ElicitSlot',
          intentName: intentRequest.currentIntent.name,
          slots,
          slotToElicit: proximoSlot,
          responseCard: card
        }
      })

      console.log(' proximo slotttt:', proximoSlot)

      return

    }
    catch (msgErro) {
      console.log('puts deu ruim!!!!!!!!!!')
      // se cair nesse catch, é pq deu um erro pra pegar o card. Ex: não tem o estoque do item selecionado
      slots[ultimoSlotValidado] = null;
      callback({
        sessionAttributes: intentRequest.sessionAttributes,
        dialogAction: {
          type: 'ElicitSlot',
          intentName: intentRequest.currentIntent.name,
          slots,
          slotToElicit: ultimoSlotValidado,
          message: {
            contentType: 'PlainText',
            content: msgErro.message
          },
          responseCard: ultimoCard
        }
      })
      return
    }

  }

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

