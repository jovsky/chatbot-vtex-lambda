'use strict';

const api = require('../api/api')
const lexResponse = require('../lex/responses');
const gerarCard = require('./cards/gerarCard');
const validar = require("./validarSlots");

// LISTA ORDENADA DOS NOMES DOS SLOTS, ONDE ESTA ORDEM ESTABELECE O FLUXO DA INTERAÇÃO DO CHATBOT COM O USUÁRIO
const nomesSlotsOrdenados = ['nome', 'categoria', 'subcategoria', 'produto', 'sku', 'verFrete', 'CEP', '​linkCarrinho', 'repetirOuAvaliar']

// RESULTADOS DA API
const dadosAPIs = {
  categoriasAPI: undefined,
  subcategoriasAPI: undefined,
  produtosAPI: undefined,
  skusAPI: undefined
}

// FUNÇÃO QUE LIMPA SLOTS E DEVOLVE CARD QUANDO USUARIO OPTA POR VOLTAR POR MENU
function voltarEscolha (slots, slotVoltar) {

  let cardRepeticao;
  switch(slotVoltar) {
    case 'categoria':
      slots.categoria = null;
      slots.subcategoria = null;
      cardRepeticao = gerarCard.categorias(dadosAPIs.categoriasAPI);
      break;
    case 'subcategoria':
      slots.subcategoria = null;
      slots.produto = null;
      cardRepeticao = gerarCard.subcategorias(dadosAPIs.subcategoriasAPI);
      break;
    case 'produto':
      slots.produto = null;
      slots.sku = null;
      cardRepeticao = gerarCard.produtos(dadosAPIs.produtosAPI);
      break;
    default:
      break;
  }
  return cardRepeticao;

}

// FUNÇÃO DISPATCH QUE IDENTIFICA O ESTADO, FAZ VALIDAÇÕES, E RETORNA UMA AÇÃO PARA O LEX
async function dispatch(intentRequest, callback) {

  var ultimoSlotValidado = '';
  var proximoSlot = '';
  var card;
  var ultimoCard;
  
  const slots = intentRequest.currentIntent.slots;

  // CASO NÃO SAIBA O NOME DO USUÁRIO, PERGUNTAR
  if (slots.nome === null) {
    lexResponse.delegate(intentRequest.sessionAttributes, slots, callback)
    return;
  }

  // SE USUARIO RESPONDEU SE DESEJA REPETIR OU AVALIAR
  if(slots.repetirOuAvaliar !== null) {
    
    const resultadoValidacao = validar.repetirOuAvaliar(slots.repetirOuAvaliar)
    intentRequest.currentIntent.confirmationStatus = 'Confirmed';
    
    // RESPOSTA INVALIDA, PERGUNTA DE NOVO
    if(!resultadoValidacao.seValido) {
      slots.repetirOuAvaliar = null;
      const message = {
        contentType: 'PlainText',
        content: 'Desculpe, não entendemos sua resposta. Queremos saber se gostaria de receber mais sugestão ou se deseja finalizar avaliando nosso atendimento.'
      }
      const responseCard = gerarCard.repetirOuAvaliar(slots.sku, dadosAPIs.skusAPI)
      lexResponse.elicitSlot(intentRequest.sessionAttributes, intentRequest.currentIntent.name, slots, 'repetirOuAvaliar', message, responseCard, callback)
      return
    }
    // SE RESPOSTA FOR VALIDA E IGUAL A REPETIR SUGESTÕES
    else if (resultadoValidacao.seValido && resultadoValidacao.acao === "repetir") {
      slots.sku = null; 
      slots.repetirOuAvaliar = null;
      slots.linkCarrinho = null;
      intentRequest.currentIntent.confirmationStatus = 'None';
      dadosAPIs.skusAPI =  await api.getRelacionados(api.getIdProduto(slots.produto, dadosAPIs.produtosAPI));
      const responseCard = gerarCard.produtosRelacionados(dadosAPIs.skusAPI); 
      const message = {
        contentType: 'PlainText',
        content: `Encontrei aqui alguns itens relacionados ao que foi adicionado ao carrinho. Se interessa por algum? Se não, digite "voltar" para voltar no menu.`
      }
      
      lexResponse.elicitSlot(intentRequest.sessionAttributes, intentRequest.currentIntent.name, slots, 'sku', message, responseCard, callback)
      return;
    }
  }

  // RECEBE CATEGORIAS DA API
  dadosAPIs.categoriasAPI = await api.getCategorias();

  // SE CATEGORIA AINDA NÃO FOI INFORMADA PELO USUÁRIO, PERGUNTAR
  if (slots.categoria === null) {
    lexResponse.elicitSlot(intentRequest.sessionAttributes, intentRequest.currentIntent.name, slots, 'categoria', undefined, gerarCard.categorias(dadosAPIs.categoriasAPI), callback)
    return
  }
  // SE CATEGORIA JÁ FOI INFORMADA PELO USUÁRIO, VALIDAR
  if (slots.categoria !== null) {

    const resultadoValidacao = validar.slots(slots, dadosAPIs);
    // console.log(" aaaaa", resultadoValidacao)

    // SE ALGUM SLOT INFORMADO PELO USUÁRIO FOI INVALIDADO
    if (!resultadoValidacao.seValido) {

      slots[resultadoValidacao.slotViolado] = null;
      const cardRepeticao = gerarCard.repeticao(resultadoValidacao.slotViolado, dadosAPIs);
      let addMessage = ""
      if (resultadoValidacao.slotViolado === 'subcategoria' || resultadoValidacao.slotViolado === 'produto') 
        addMessage = `Você pode digitar "voltar" para voltar ao menu anterior.`
      else if (resultadoValidacao.slotViolado === 'sku') 
        addMessage = `Você pode digitar "não" para voltar ao menu anterior.`
      let message = {
        contentType: 'PlainText',
        content: `Desculpe, não temos a opção escolhida. Temos as mostradas abaixo. ${addMessage}`
      }
      lexResponse.elicitSlot(intentRequest.sessionAttributes, intentRequest.currentIntent.name, slots, resultadoValidacao.slotViolado, message, cardRepeticao, callback)
      return
    }

    // SE SLOT PRODUTO = VOLTAR , OU SLOT SKU = NÃO
    else if(resultadoValidacao.seValido && resultadoValidacao.voltar) {

      const cardRepeticao = voltarEscolha(slots, resultadoValidacao.slotVoltar);

      let message = {
        contentType: 'PlainText',
        content: `Tudo bem, você deseja mudar de ${resultadoValidacao.slotVoltar}. Temos as opções a seguir:`
      }
      lexResponse.elicitSlot(intentRequest.sessionAttributes, intentRequest.currentIntent.name, slots, resultadoValidacao.slotVoltar, message, cardRepeticao, callback)
      return

    }

    // SE TODOS SLOTS INFORMADOS (NÃO NULOS) FORAM VALIDADOS
    else {
      // IDENFITICAR O ÚLTIMO SLOT VALIDO PARA SABER QUAL A PRÓXIMA AÇÃO
      for (let i = 0; i < nomesSlotsOrdenados.length - 1; i++) {

        const nomeSlotAtual = nomesSlotsOrdenados[i];
        const valorSlotAtual = slots[nomeSlotAtual];
        const nomeProximoSlot = nomesSlotsOrdenados[i + 1];
        const valorProximoSlot = slots[nomeProximoSlot];

        if (valorSlotAtual != null && valorProximoSlot == null) {
          ultimoSlotValidado = nomeSlotAtual;
          proximoSlot = nomeProximoSlot;

          // DETERMINAR O PRÓXIMO SLOT A PERGUNTAR
          try {
            switch (ultimoSlotValidado) {
              case 'categoria':
                ultimoCard = gerarCard.categorias(dadosAPIs.categoriasAPI);
                dadosAPIs.subcategoriasAPI = await api.getSubcategorias(slots.categoria, dadosAPIs.categoriasAPI); 
                card = gerarCard.subcategorias(dadosAPIs.subcategoriasAPI);
                break;
              case 'subcategoria':
                ultimoCard = gerarCard.subcategorias(dadosAPIs.subcategoriasAPI);
                dadosAPIs.produtosAPI = await api.getProdutos(slots.categoria, slots.subcategoria, dadosAPIs.categoriasAPI, dadosAPIs.subcategoriasAPI); 
                card = gerarCard.produtos(dadosAPIs.produtosAPI);
                break;
              case 'produto':
                ultimoCard = gerarCard.produtos(dadosAPIs.produtosAPI, slots.sku);
                dadosAPIs.skusAPI = api.getSKUs(slots.produto, dadosAPIs.produtosAPI);
                card = gerarCard.SKUs(dadosAPIs.skusAPI);
                break;
              case 'sku':
                slots.linkCarrinho = api.getLinkSKUs(dadosAPIs.skusAPI, slots.sku);
                break;
              default:
                break;
            }
      
            // ENVIAR CARD PERGUNTANDO SOBRE PROXIMO SLOT
            // (a menos que o último slot validado tenha sido SKU. Nesse caso,
            // a própria função Lambda vai definir o valor do proximo slot: linkCarrinho)
            if (['categoria', 'subcategoria', 'produto'].includes(ultimoSlotValidado)) {
              lexResponse.elicitSlot(intentRequest.sessionAttributes, intentRequest.currentIntent.name, slots, proximoSlot, undefined, card, callback)
              return
            }
            break;
      
          }
          // CASO RESULTADO DA API SEJA VAZIA, O ERRO LANÇADO AO CATCH VAI SOLICITAR AO USUÁRIO REPETIR O VALOR DO SLOT
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

  // NESTA ALTURA DO CÓDIGO, JÁ FORAM INFORMADOS E VALIDADOS TODOS SLOTS NECESSÁRIOS
  // ANTES DE AVANÇAR PARA ETAPA DE VER FRETE.

  if (slots.verFrete === null) {
    const responseCard = gerarCard.verFrete();
    lexResponse.elicitSlot(intentRequest.sessionAttributes, intentRequest.currentIntent.name, slots, 'verFrete', undefined, responseCard, callback);
    return;
  }

  // USUARIO INSERIU SE QUER VER FRETE, ENTÃO VALIDAR RESPOSTA
  else if(slots.verFrete !== null && slots.CEP === null) {

    const resultadoValidacao = validar.verFrete(slots.verFrete);

    // RESPOSTA INVALIDA, PERGUNTA DE NOVO
    if(!resultadoValidacao.seValido) {
      slots.verFrete = null;
      const message = {
        contentType: 'PlainText',
        content: 'Desculpe, não entendemos sua resposta. Queremos saber se gostaria de ver informações sobre o frete deste produto para sua localidade.'
      }
      const responseCard = gerarCard.verFrete();
      lexResponse.elicitSlot(intentRequest.sessionAttributes, intentRequest.currentIntent.name, slots, 'verFrete', message, responseCard, callback);
      return;
    }
    // SE RESPOSTA FOR VALIDA E IGUAL A NÃO QUER VER
    else if (resultadoValidacao.seValido && resultadoValidacao.querVer) {
      slots.verFrete = "sim";
      const linkConsulteCEP = "http://www.buscacep.correios.com.br/sistemas/buscacep/";
      const message = {
        contentType: "CustomPayload",
        content: `\{"message": "Por favor, digite o seu CEP. Se não quer mais ver o frete, digite 'cancelar'.",\n "platform":"kommunicate",\n "metadata": \{"contentType":"300",\n "templateId":"3",\n "payload":[\{"type":"link",\n "url":"${linkConsulteCEP}",\n "name":"Consulte seu CEP aqui."\}]\}\}`
      }
      lexResponse.elicitSlot(intentRequest.sessionAttributes, intentRequest.currentIntent.name, slots, 'CEP', message, undefined, callback);
      return;
    }
    // SE RESPOSTA FOR VALIDA E IGUAL A SIM, QUER VER
    else if (resultadoValidacao.seValido && !resultadoValidacao.querVer) {
      slots.verFrete = "nao";
      slots.CEP = "nao";
    }
  }

  // USUARIO QUIS VER CEP E JÁ INSERIU CEP, ENTÃO VALIDAR CEP
  else if (slots.verFrete === "sim" && slots.CEP !== null && slots.CEP !== "nao") {
    
    const resultadoValidacao = validar.CEP(slots.CEP);

    // RESPOSTA INVALIDA, PERGUNTA DE NOVO
    if(!resultadoValidacao.seValido) {
      slots.CEP = null;
      const message = {
        contentType: 'PlainText',
        content: "O CEP informado é inválido, use o botão acima para consultar seu CEP ou digite \"cancelar\" para desistir de ver o frete."
      }
      lexResponse.elicitSlot(intentRequest.sessionAttributes, intentRequest.currentIntent.name, slots, 'CEP', message, undefined, callback);
      return;
    }
    // SE RESPOSTA FOR VALIDA E IGUAL A CANCELAR
    else if (resultadoValidacao.cancelar) {
      slots.verFrete = "nao";
      slots.CEP = "nao";
    }
    // SE INFORMOU CEP VALIDO
    else if (!resultadoValidacao.cancelar) {
      slots.verFrete = "sim";
      slots.CEP = resultadoValidacao.CEP;
    }

  }

  // USUÁRIO JÁ RESPONDEU SE QUIS VER OU NÃO O FRETE, AGORA MOSTRAR RESULTADO E MOSTRAR BOTÃO DE ADICIONAR AO CARRINHO
  if (intentRequest.currentIntent.confirmationStatus === 'None' ) {

    let infoFrete = "";
    if (slots.verFrete === "sim") {
      const { price, transitTime } = await api.getFrete(slots.sku, dadosAPIs.skusAPI, slots.CEP);
      const preco = (parseFloat(price)/100).toFixed(2);
      const tempo = transitTime.slice(0, -2);
      infoFrete = `O valor do frete para sua localidade fica em R$ ${preco} e o prazo de entrega estimado é de ${tempo} dias. `;
    }
    const message = {
      contentType: "CustomPayload",
      content: `\{"message": "${infoFrete}Se quer adicionar o item ${slots.sku} ao carrinho clique no botão abaixo. Digite 'ok' para continuar.",\n "platform":"kommunicate",\n "metadata": \{"contentType":"300",\n "templateId":"3",\n "payload":[\{"type":"link",\n "url":"${slots.linkCarrinho}",\n "name":"Adicionar ao carrinho",\n "openLinkInNewTab": false\}]\}\}`
    }
    lexResponse.confirmIntent(intentRequest.sessionAttributes, intentRequest.currentIntent.name, slots, message, undefined, callback)
    return;
  }

  // SE O BOTÃO JÁ FOI DO CARRINHO JÁ FOI ENVIADO, O LEX DEVE PERGUNTAR SE DESEJA:
  // RECEBER MAIS SUGESTÕES, OU AVALIAR O ATENDIMENTO
  else if (intentRequest.currentIntent.confirmationStatus !== 'None' && slots.repetirOuAvaliar === null){
    const responseCard = gerarCard.repetirOuAvaliar(slots.sku, dadosAPIs.skusAPI)
    lexResponse.elicitSlot(intentRequest.sessionAttributes, intentRequest.currentIntent.name, slots, 'repetirOuAvaliar', undefined, responseCard, callback)
    return  
  }

  // CASO NÃO TENHA FEITO NENHUM CALLBACK ATÉ AQUI, DEIXAR PARA O LEX DECIDIR A PRÓXIMA AÇÃO
  lexResponse.elicitIntent(intentRequest.sessionAttributes, undefined, undefined, callback)
  return
}

module.exports = async (event, context, callback) => {
  try {
    await dispatch(event, (response) => callback(null, response));
  } catch (err) {
    callback(err);
  }
};

