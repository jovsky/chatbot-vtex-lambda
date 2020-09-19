const { replaceChar } = require('../util/util')

// MONTAR CARD PARA PREENCHER SLOT CATEGORIA COM DADOS DA API 
module.exports.categorias = function(categoriasAPI) {

  const botoesCategorias = categoriasAPI.map( (categoria) => {
    return {
      // text: replaceChar(categoria.nome.toUpperCase(), "_", " "),
      text: categoria.nome.toUpperCase(),
      value: categoria.nome
    }
  })

  return {
    version: 1,
    contentType: "application/vnd.amazonaws.card.generic",
    genericAttachments: [
      {
        title: 'Categorias'.toUpperCase(),
        buttons: botoesCategorias
      }
    ]
  }
}

// MONTAR CARD PARA PREENCHER SLOT PRODUTO COM DADOS DA API 
module.exports.produtos = function (produtosAPI) {

  const botoesProdutos = produtosAPI.map((produto) => {
    return {
      // text: replaceChar(produto.nome.toUpperCase(), "_", " "),
      text: produto.nome.toUpperCase(),
      value: produto.nome
    }
  })

  return {
    version: 1,
    contentType: "application/vnd.amazonaws.card.generic",
    genericAttachments: [
      {
        title: 'Produtos da categoria'.toUpperCase(),
        buttons: botoesProdutos
      }
    ]
  }
}

// ENVIA CARD PARA PREENCHER SLOT SKU COM DADOS DA API 
module.exports.SKUs = function(skusAPI) {

  const slideCards = skusAPI.map((sku) => {
    return {
      // title: replaceChar(sku.nome.toUpperCase(), "_", " "),
      title: sku.nome.toUpperCase(),
      subTitle: `R$ ${sku.preco}`,
      imageUrl: sku.imagem,
      attachmentLinkUrl: sku.linkCarrinho,
      buttons: [{
        text: 'Gostei',
        value: sku.nome
      }]
    }
  })

  return {
    version: 1,
    contentType: "application/vnd.amazonaws.card.generic",
    genericAttachments: slideCards
  }
}

// ENVIA CARD PARA SABER SE QUER REPETIR AS SUGESTÕES OU SE QUER AVALIAR ATENDIMENTO
module.exports.repetirOuAvaliar = function() {
  return {
    version: 1,
    contentType: "application/vnd.amazonaws.card.generic",
    genericAttachments: [
      {
        title: "Mais sugestões ou avaliar o atendimento?".toUpperCase(),
        buttons: [
          {
            text: 'Mais sugestões',
            value: 'Mais sugestoes'
          },
          {
            text: 'Avaliar atendimento',
            value: 'Avaliar atendimento'
          }
        ]
      }
    ]
  }
}