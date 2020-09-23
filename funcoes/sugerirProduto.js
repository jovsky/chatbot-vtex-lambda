'use strict';

const api = require('../api/api')
const lexResponse = require('../lex/responses');
const gerarCard = require('./cards');

// LISTA ORDENADA DOS NOMES DOS SLOTS, ONDE ESTA ORDEM ESTABELECE O FLUXO DA INTERAÇÃO DO CHATBOT COM O USUÁRIO
const nomesSlotsOrdenados = ['categoria', 'subcategoria', 'produto', 'sku', 'verFrete', 'CEP', '​linkCarrinho', 'repetirOuAvaliar']

// RESULTADOS DA API
var categoriasAPI;
var subcategoriasAPI;
var produtosAPI;
var skusAPI;

// FUNÇÃO QUE VALIDA OS SLOTS NÃO NULOS DO AMAZON LEX
function validarSlots(slots) {

  const { categoria, subcategoria, produto, sku } = slots;

  // VALIDAR SLOT CATEGORIA
  const nomesCategorias = categoriasAPI.map(categoria => categoria.nome)
  if (!nomesCategorias.includes(categoria.toLowerCase())) {
    return {
      seValido: false,
      slotViolado: "categoria"
    }
  }

  // VALIDAR SLOT SUBCATEGORIA
  if (subcategoriasAPI !== undefined && subcategoria !== null) {
    if (subcategoria.toLowerCase().indexOf('voltar') !== -1 ) {
      return {
        seValido: true,
        voltar: true,
        slotVoltar: 'categoria'
      }
    }
    const nomesSubcategorias = subcategoriasAPI.map(subcat => subcat.nome);
    if (!nomesSubcategorias.includes(subcategoria.toLowerCase())) {
      return {
        seValido: false,
        slotViolado: "subcategoria"
      }
    }
  }

  // VALIDAR SLOT PRODUTO
  if (produtosAPI !== undefined && produto !== null) {
    if (produto.toLowerCase().indexOf('voltar') !== -1 ) {
      return {
        seValido: true,
        voltar: true,
        slotVoltar: 'subcategoria'
      }
    }
    const nomesProdutos = produtosAPI.map(produto => produto.nome)
    if (!nomesProdutos.includes(produto.toLowerCase())) {
      return {
        seValido: false,
        slotViolado: "produto"
      }
    }
  }

  // VALIDAR SLOT SKU
  if (skusAPI !== undefined && sku !== null) {
    if (sku.toLowerCase().indexOf('não') !== -1 || sku.toLowerCase().indexOf('nao') !== -1) {
      return {
        seValido: true,
        voltar: true,
        slotVoltar: 'produto'
      }
    }
    const nomesSKUs = skusAPI.map(sku => sku.nome)
    if (!nomesSKUs.includes(sku.toLowerCase())) {
      return {
        seValido: false,
        slotViolado: "sku"
      }
    }
  }


  // TODAS SLOTS NÃO NULAS SÃO VÁLIDOS
  return {
    seValido: true,
    voltar: false
  }
  
}

// VALIDAR RESPOSTA DO SLOT VER FRETE
function validarVerFrete(verFrete) {

  const resposta = verFrete.toLowerCase();

  if(resposta.indexOf('sim') !== -1 || resposta.indexOf('quero') !== -1) {
    return {
      seValido: true,
      querVer: true
    }
  }
  else if (resposta.indexOf('não') !== -1 || resposta.indexOf('nao') !== -1) {
    return {
      seValido: true,
      querVer: false
    }
  }
  else {
    return {
      seValido: false
    }
  }

}

// VALIDAR RESPOSTA DO SLOT VER FRETE
function validarCEP(strCEP) {
  
  if (strCEP.toLowerCase().indexOf('cancelar') !== -1) {
    return {
      seValido: true,
      cancelar: true
    }
  }

  strCEP = strCEP.replace(/ /g, "");
  strCEP = strCEP.replace(/-/g, "");

  let objER = /^[0-9]{8}$/;

  return {
    seValido: (objER.test(strCEP)),
    cancelar: false,
    CEP: strCEP,
  }

}

// VALIDAR RESPOSTA DO SLOT REPETIR OU AVALIAR E RETORNAR A AÇÃO
function validarRepetirOuAvaliar(repetirOuAvaliar) {

  // VALIDAR SLOT REPETIR OU MAIS SUGESTÕES

  const resposta = repetirOuAvaliar.toLowerCase()

  if(resposta.indexOf('mais') !== -1
    || resposta.indexOf('sugestões') !== -1
    || resposta.indexOf('sugestoes') !== -1) {
    return {
      seValido: true,
      acao: "repetir"
    }
  }
  else if (resposta.indexOf('avaliar') !== -1 || resposta.indexOf('atendimento') !== -1 ) {
    return {
      seValido: true,
      acao: "avaliar"
    }
  }
  else {
    return {
      seValido: false
    }
  }

}

// FUNÇÃO DISPATCH QUE IDENTIFICA O ESTADO, FAZ VALIDAÇÕES, E RETORNA UMA AÇÃO PARA O LEX
async function dispatch(intentRequest, callback) {

  var ultimoSlotValidado = '';
  var proximoSlot = '';
  var card;
  var ultimoCard;
  
  const slots = intentRequest.currentIntent.slots;

  // SE USUARIO RESPONDEU SE DESEJA REPETIR OU AVALIAR
  if(slots.repetirOuAvaliar !== null) {
    
    const resultadoValidacao = validarRepetirOuAvaliar(slots.repetirOuAvaliar)
    intentRequest.currentIntent.confirmationStatus = 'Confirmed';
    
    // RESPOSTA INVALIDA, PERGUNTA DE NOVO
    if(!resultadoValidacao.seValido) {
      slots.repetirOuAvaliar = null;
      const message = {
        contentType: 'PlainText',
        content: 'Desculpe, não entendemos sua resposta. Queremos saber se gostaria de receber mais sugestão ou se deseja finalizar avaliando nosso atendimento.'
      }
      const responseCard = gerarCard.repetirOuAvaliar(slots.sku, skusAPI)
      lexResponse.elicitSlot(intentRequest.sessionAttributes, intentRequest.currentIntent.name, slots, 'repetirOuAvaliar', message, responseCard, callback)
      return
    }
    // SE RESPOSTA FOR VALIDA E IGUAL A REPETIR SUGESTÕES
    else if (resultadoValidacao.seValido && resultadoValidacao.acao === "repetir") {
      slots.categoria = null;
      slots.subcategoria = null; 
      slots.produto = null; 
      slots.sku = null; 
      slots.repetirOuAvaliar = null;
      slots.linkCarrinho = null;
      slots.verFrete = null;
      slots.CEP = null;
    }
  }

  // CASO NÃO SAIBA O NOME DO USUÁRIO, PERGUNTAR
  if (slots.nome === null) {
    lexResponse.delegate(intentRequest.sessionAttributes, slots, callback)
    return;
  }
  
  categoriasAPI = await api.getCategorias();
  // SE CATEGORIA AINDA NÃO FOI INFORMADA PELO USUÁRIO
  if (slots.categoria === null) {
    lexResponse.elicitSlot(intentRequest.sessionAttributes, intentRequest.currentIntent.name, slots, 'categoria', undefined, gerarCard.categorias(categoriasAPI), callback)
    return
  }
  // SE CATEGORIA JÁ FOI INFORMADA PELO USUÁRIO, ESTANDO VÁLIDA OU NÃO
  if (slots.categoria !== null) {

    const resultadoValidacao = validarSlots(slots);

    // SE ALGUM SLOT INFORMADO PELO USUÁRIO FOI INVALIDADO
    if (!resultadoValidacao.seValido) {

      slots[resultadoValidacao.slotViolado] = null;
      
      var cardRepeticao;
      
      switch (resultadoValidacao.slotViolado) {
        case 'categoria':
          cardRepeticao = gerarCard.categorias(categoriasAPI);
          break;
        case 'subcategoria':
          cardRepeticao = gerarCard.subcategorias(subcategoriasAPI); //   IMPLEMENTAR <----
          break;
        case 'produto':
          cardRepeticao = gerarCard.produtos(produtosAPI);
          break;
        case 'sku':
          cardRepeticao = gerarCard.SKUs(skusAPI);
          break;
        default:
          break;
      }
            
      let message = {
        contentType: 'PlainText',
        content: 'Desculpe, não temos a opção escolhida. Temos as seguintes:'
      }
      lexResponse.elicitSlot(intentRequest.sessionAttributes, intentRequest.currentIntent.name, slots, resultadoValidacao.slotViolado, message, cardRepeticao, callback)
      return
    }

    // SE SLOT PRODUTO = VOLTAR , OU SLOT SKU = NÃO
    else if(resultadoValidacao.seValido && resultadoValidacao.voltar) {

      switch(resultadoValidacao.slotVoltar) {
        case 'categoria':
          slots.categoria = null;
          slots.subcategoria = null;
          cardRepeticao = gerarCard.categorias(categoriasAPI);
          break;
        case 'subcategoria':
          slots.subcategoria = null;
          slots.produto = null;
          cardRepeticao = gerarCard.subcategorias(subcategoriasAPI);
          break;
        case 'produto':
          slots.produto = null;
          slots.sku = null;
          cardRepeticao = gerarCard.produtos(produtosAPI);
          break;
        default:
          break;
      }

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
          /**
           * receber os dados da API referente ao próximo slot a ser informado
           * card: responseCard para o próximo slot
           * ultimoCard: será utilizado no CATCH caso seja necessário repetir a entrada do slot no Lex
           */
          try {
            switch (ultimoSlotValidado) {
              case 'categoria':
                ultimoCard = gerarCard.categorias(categoriasAPI);
                subcategoriasAPI = await api.getSubcategorias(slots.categoria, categoriasAPI); // implementar
                card = gerarCard.subcategorias(subcategoriasAPI);
                break;
              case 'subcategoria':
                ultimoCard = gerarCard.subcategorias(subcategoriasAPI); // <----- IMPLEMENTAR
                produtosAPI = await api.getProdutos(slots.categoria, slots.subcategoria, categoriasAPI, subcategoriasAPI); // <----- IMPLEMENTAR
                card = gerarCard.produtos(produtosAPI);
                break;
              case 'produto':
                ultimoCard = gerarCard.produtos(produtosAPI, slots.sku);
                skusAPI = api.getSKUs(slots.produto, produtosAPI);
                card = gerarCard.SKUs(skusAPI);
                break;
              case 'sku':
                slots.linkCarrinho = api.getLinkSKUs(skusAPI, slots.sku);
                break;
              default:
                break;
            }
      
            // ENVIAR CARD PERGUNTANDO SOBRE PROXIMO SLOT
            // (a menos que o último slot validado tenha sido SKU. Nesse caso,
            // a própria função Lambda vai definir o valor do proximo slot: linkCarrinho)
            if (['categoria', 'subcategoria', 'produto'].includes(ultimoSlotValidado)) {
            // if (ultimoSlotValidado !== 'sku' || ultimoSlotValidado === 'verFrete') {
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

  else if(slots.verFrete !== null && slots.CEP === null) {

    const resultadoValidacao = validarVerFrete(slots.verFrete);

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
      const linkConsulteCEP = "http://www.buscacep.correios.com.br/sistemas/buscacep/";
      slots.verFrete = "sim";
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
  else if (slots.verFrete === "sim" && slots.CEP !== null && slots.CEP !== "nao") {
    
    const resultadoValidacao = validarCEP(slots.CEP);

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

  // JÁ PASSOU DA PARTE DO FRETE
  // SE AINDA NAO FOI ENVIADO O BOTÃO DE ADICIONAR AO CARRINHO E O USUÁRIO NÃO RESPONDEU "ok"/"no"
  if (intentRequest.currentIntent.confirmationStatus === 'None' ) {

    let infoFrete = "";
    if (slots.verFrete === "sim") {
      const { price, transitTime } = await api.getFrete(slots.sku, skusAPI, slots.CEP);
      const preco = (parseFloat(price)/100).toFixed(2);
      const tempo = transitTime.slice(0, -2);
      infoFrete = `O valor do frete para sua localidade fica em R$ ${preco} e o prazo de entrega estimado é de ${tempo} dias. `;
    }

    const message = {
      contentType: "CustomPayload",
      content: `\{"message": "${infoFrete}Adicione ao carrinho e/ou digite 'ok' para continuar.",\n "platform":"kommunicate",\n "metadata": \{"contentType":"300",\n "templateId":"3",\n "payload":[\{"type":"link",\n "url":"${slots.linkCarrinho}",\n "name":"Adicionar ao carrinho",\n "openLinkInNewTab": false\}]\}\}`
    }

    lexResponse.confirmIntent(intentRequest.sessionAttributes, intentRequest.currentIntent.name, slots, message, undefined, callback)
    return;
  }

  // SE O BOTÃO JÁ FOI ENVIADO, O LEX DEVE PERGUNTAR SE DESEJA:
  // RECEBER MAIS SUGESTÕES, OU AVALIAR O ATENDIMENTO
  else if (intentRequest.currentIntent.confirmationStatus !== 'None' && slots.repetirOuAvaliar === null){
    const responseCard = gerarCard.repetirOuAvaliar(slots.sku, skusAPI)
    lexResponse.elicitSlot(intentRequest.sessionAttributes, intentRequest.currentIntent.name, slots, 'repetirOuAvaliar', undefined, responseCard, callback)
    return  
  }

  // CASO NÃO TENHA FEITO NENHUM CALLBACK ATÉ AQUI, DEIXAR PARA O LEX DECIDIR A PRÓXIMA AÇÃO
  // slots.repetirOuAvaliar = null;
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

