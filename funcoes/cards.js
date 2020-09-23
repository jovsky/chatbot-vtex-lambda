const { replaceChar } = require('../util/util')

// MONTAR CARD PARA PREENCHER SLOT CATEGORIA COM DADOS DA API 
module.exports.categorias = function(categoriasAPI) {

  const emojis = {
    blusas:'👕',
    calças:'👖',
    casacos: '🧥',
    sapatos: '👟',
    chapeus: '👒'
  }

  const botoesCategorias = categoriasAPI.map( (categoria) => {
    return {
      // text: replaceChar(categoria.nome.toUpperCase(), "_", " "),
      text: `${categoria.nome.toUpperCase()} ${emojis[categoria.nome]}`,
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



// MONTAR CARD PARA PREENCHER SLOT SUBCATEGORIAS COM DADOS DA API 
module.exports.subcategorias = function(subcategoriasAPI) {

  const botoesCategorias = subcategoriasAPI.map( (subcategoria) => {
    return {
      // text: replaceChar(categoria.nome.toUpperCase(), "_", " "),
      text: subcategoria.nome.toUpperCase(),
      value: subcategoria.nome
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

// MONTAR CARD PARA PREENCHER SLOT SUBCATEGORIAS COM DADOS DA API 
module.exports.subcategorias = function(subcategoriasAPI) {

  const emojis ={
    feminino: '🚺',
    masculino: '🚹'
  }

  const botoesSubcategorias = subcategoriasAPI.map( (subcategoria) => {
    return {
      // text: replaceChar(categoria.nome.toUpperCase(), "_", " "),
      text: `${subcategoria.nome.toUpperCase()} ${emojis[subcategoria.nome]}`,
      value: subcategoria.nome
    }
  })

  return {
    version: 1,
    contentType: "application/vnd.amazonaws.card.generic",
    genericAttachments: [
      {
        title: 'Subcategorias'.toUpperCase(),
        buttons: botoesSubcategorias
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


function getIdSKU(nomeSKU, skusAPI) {
  const result = skusAPI.filter((sku) => sku.nome === nomeSKU);
  return result[0].id;
}



// ENVIA CARD PARA SABER SE QUER REPETIR AS SUGESTÕES OU SE QUER AVALIAR ATENDIMENTO
module.exports.verFrete = function() {

  return {
    version: 1,
    contentType: "application/vnd.amazonaws.card.generic",
    genericAttachments: [
      {
        title: "Quer saber sobre o frete?".toUpperCase(),
        buttons: [
          {
            text: 'Sim, quero ver o frete',
            value: `sim`
          },
          {
            text: 'Não, obrigado',
            value: 'nao'
          }
        ]
      }
    ]
  }
}

// ENVIA CARD PARA SABER SE QUER REPETIR AS SUGESTÕES OU SE QUER AVALIAR ATENDIMENTO
module.exports.repetirOuAvaliar = function(sku, skusAPI) {
  const skuID = getIdSKU(sku, skusAPI);
  console.log(' skuID:', skuID);
  return {
    version: 1,
    contentType: "application/vnd.amazonaws.card.generic",
    genericAttachments: [
      {
        title: "Qual sua escolha?".toUpperCase(),
        buttons: [
          {
            text: 'Mais sugestões',
            value: `Mais sugestões`
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