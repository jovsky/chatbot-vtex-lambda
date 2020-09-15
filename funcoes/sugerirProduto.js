'use strict';

const { getCategoriasAPI, getProdutosAPI, getSKUsAPI, getLinkSKUsAPI } = require('../api/api')
const lexResponse = require('../lex/responses');
const gerarCard = require('./cards');

const nomesSlotsOrdenados = ['categoria', 'produto', 'sku', '​linkCarrinho', 'repetirOuAvaliar']
var categoriasAPI;
var produtosAPI;
var skusAPI;

async function validate(slots) {

  const { categoria, produto, sku } = slots;

  const nomesCategorias = categoriasAPI.map(categoria => categoria.nome)
  if (!nomesCategorias.includes(categoria.toLowerCase())) {
    return {
      isValid: false,
      violatedSlot: "categoria"
    }
  }


  // console.log(' check validation prods >', produtosAPI !== undefined, produto !== null)
  if (produtosAPI !== undefined && produto !== null) {
    const nomesProdutos = produtosAPI.map(produto => produto.nome)
    // console.log(nomesProdutos, produto)
    if (!nomesProdutos.includes(produto.toLowerCase())) {
      return {
        isValid: false,
        violatedSlot: "produto"
      }
    }
  }

  // console.log(' check validation skus >', skusAPI !== undefined, sku !== null)
  if (skusAPI !== undefined && sku !== null) {
    const nomesSKUs = skusAPI.map(sku => sku.nome)
    // console.log(nomesSKUs, sku)
    if (!nomesSKUs.includes(sku.toLowerCase())) {
      return {
        isValid: false,
        violatedSlot: "sku"
      }
    }
  }

  
  return {
    isValid: true
  }
  

}


async function dispatch(intentRequest, callback) {

  var ultimoSlotValidado = '';
  var proximoSlot = '';
  var card, ultimoCard;

  categoriasAPI = await getCategoriasAPI();

  const slots = intentRequest.currentIntent.slots;

  if(slots.repetirOuAvaliar === 'Mais') {
    slots.categoria = null;
    slots.produto = null;
    slots.sku = null;
    slots.repetirOuAvaliar = null;
    slots.linkCarrinho = null;
  }

  if (slots.nome === null) {
    lexResponse.delegate(intentRequest.sessionAttributes, slots, callback)
    return;
  }

  // a categoria ainda nao foi informada
  if (slots.categoria === null) {

    lexResponse.elicitSlot(intentRequest.sessionAttributes, intentRequest.currentIntent.name, slots, 'categoria', undefined, gerarCard.categorias(categoriasAPI), callback)
    return

  }

  // verificar se a categoria ainda precisa ser validada
  if (slots.categoria !== null) {

    const resultValidation = await validate(slots);
    // console.log(' validação:', resultValidation.isValid, resultValidation.violatedSlot)

    // se alguma slot for invalida
    if (!resultValidation.isValid) {

      slots[resultValidation.violatedSlot] = null;

      var card;

      switch (resultValidation.violatedSlot) {
        case 'categoria':
          card = gerarCard.categorias(categoriasAPI);
          break;
        case 'produto':
          card = gerarCard.produtos(produtosAPI);
          break;
        case 'sku':
          card = gerarCard.SKUs(skusAPI).card;
          break;
        default:
          break;
      }

      const message = {
        contentType: 'PlainText',
        content: 'Desculpe, não temos a opção escolhida. Temos as seguintes:'
      }
      lexResponse.elicitSlot(intentRequest.sessionAttributes, intentRequest.currentIntent.name, slots, resultValidation.violatedSlot, message, card, callback)
      return
    }

    else {

      // console.log(' antes do for:', slots)
      for (let i = 0; i < nomesSlotsOrdenados.length - 1; i++) {

        // console.log('  >> ', entriesSlots[i])

        const nomeSlotAtual = nomesSlotsOrdenados[i];
        const valorSlotAtual = slots[nomeSlotAtual];

        const nomeProximoSlot = nomesSlotsOrdenados[i + 1];
        const valorProximoSlot = slots[nomeProximoSlot];

        // console.log('  >> ', nomeSlotAtual, valorSlotAtual, nomeProximoSlot, valorProximoSlot )
        // console.log('  >>> ', valorSlotAtual != null && valorProximoSlot == null)            


        /* DEFINIU O ULTIMO SLOT VALIDADO */

        if (valorSlotAtual != null && valorProximoSlot == null) {
          ultimoSlotValidado = nomeSlotAtual;
          proximoSlot = nomeProximoSlot;

          // DETERMINAR O PRÓXIMO SLOT A PERGUNTAR
          try {
            switch (ultimoSlotValidado) {
              case 'categoria':
                ultimoCard = gerarCard.categorias(categoriasAPI);
                produtosAPI = await getProdutosAPI(slots.categoria, categoriasAPI);
                card = gerarCard.produtos(produtosAPI);
                break;
              case 'produto':
                ultimoCard = gerarCard.produtos(produtosAPI, slots.sku);
                skusAPI = getSKUsAPI(slots.produto, produtosAPI);
                card = gerarCard.SKUs(skusAPI);
                break;
              case 'sku':
                slots.linkCarrinho = getLinkSKUsAPI(skusAPI, slots.sku);
                break;
              default:
                break;
            }
      
            if (ultimoSlotValidado !== 'sku') {
              lexResponse.elicitSlot(intentRequest.sessionAttributes, intentRequest.currentIntent.name, slots, proximoSlot, undefined, card, callback)
              return
            }
            break;
      
          }
          catch (msgErro) {
            slots[ultimoSlotValidado] = null;
            const message = {
              contentType: 'PlainText',
              content: msgErro.message
            }
            lexResponse.elicitSlot(intentRequest.sessionAttributes, intentRequest.currentIntent.name, slots, ultimoSlotValidado, message, ultimoCard, callback)
            return
          }
        }
      }
    }

  }

  if (intentRequest.currentIntent.confirmationStatus === 'None' ) {
    const message = {
      contentType: "CustomPayload",
      content: `\{"message": "Adicione ao carrinho e digite ok para continuar.",\n "platform":"kommunicate",\n "metadata": \{"contentType":"300",\n "templateId":"3",\n "payload":[\{"type":"link",\n "url":"${slots.linkCarrinho}",\n "name":"Adicionar ao carrinho"\}]\}\}`
    }
    lexResponse.confirmIntent(intentRequest.sessionAttributes, intentName, slots, message, undefined, callback)
    return;
  }

  else if (intentRequest.currentIntent.confirmationStatus === 'Confirmed' || intentRequest.currentIntent.confirmationStatus === 'Denied' ){
    const message = {
      contentType: 'PlainText',
      content: 'Obrigado! Deseja receber mais sugestões ou avaliar o atendimento?'
    }
    const responseCard = repetirOuAvaliar()
    lexResponse.elicitSlot(intentRequest.sessionAttributes, intentRequest.currentIntent.name, slots, 'repetirOuAvaliar', message, responseCard, callback)
    return
    
  }

  lexResponse.delegate(intentRequest.sessionAttributes, slots)
  return
}

module.exports = async (event, context, callback) => {
  try {

    await dispatch(event, (response) => callback(null, response));

  } catch (err) {

    callback(err);

  }
};

