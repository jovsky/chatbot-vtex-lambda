const { toTitleCase, replaceChar } = require('../util/util')

module.exports.categorias = function(categoriasAPI) {

  // console.log(' Categorias da API:', categoriasAPI)
  const botoesCategorias = categoriasAPI.map((categoria) => {
    // console.log(' ... '+categoria.nome)
    return {
      text: replaceChar(toTitleCase(categoria.nome), "_", " "),
      value: categoria.nome
    }
  })

  return {
    version: 1,
    contentType: "application/vnd.amazonaws.card.generic",
    genericAttachments: [
      {
        title: 'Categorias',
        buttons: botoesCategorias
      }
    ]
  }
}

module.exports.produtos = function (produtosAPI) {

  // console.log('aaaaaa', produtosAPI)
  const botoesProdutos = produtosAPI.map((produto) => {
    console.log(' ... '+produto.nome)
    return {
      text: replaceChar(toTitleCase(produto.nome), "_", " "),
      value: produto.nome
    }
  })

  return {
    version: 1,
    contentType: "application/vnd.amazonaws.card.generic",
    genericAttachments: [
      {
        title: 'Produtos da categoria',
        buttons: botoesProdutos
      }
    ]
  }
}

module.exports.SKUs = function(skusAPI) {

  const slideCards = skusAPI.map((sku) => {
    return {
      title: replaceChar(toTitleCase(sku.nome), "_", " "),
      subTitle: `R$ ${sku.preco}`,
      imageUrl: sku.imagem,
      attachmentLinkUrl: sku.linkCarrinho,
      buttons: [{
        text: 'Gostei',
        value: sku.linkCarrinho
      }]
    }
  })

  return {
    version: 1,
    contentType: "application/vnd.amazonaws.card.generic",
    genericAttachments: slideCards
  }
}
