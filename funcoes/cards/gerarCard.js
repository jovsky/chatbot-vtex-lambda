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

  const emojis ={
    feminino: '🚺',
    masculino: '🚹'
  }

  const botoesSubcategorias = subcategoriasAPI.map( (subcategoria) => {
    return {
      text: `${subcategoria.nome.toUpperCase()} ${emojis[subcategoria.nome]}`,
      value: subcategoria.nome
    }
  })

  return {
    version: 1,
    contentType: "application/vnd.amazonaws.card.generic",
    genericAttachments: [
      {
        title: 'Estilo'.toUpperCase(),
        buttons: botoesSubcategorias
      }
    ]
  }
}

// MONTAR CARD PARA PREENCHER SLOT PRODUTO COM DADOS DA API 
module.exports.produtos = function (produtosAPI) {

  const botoesProdutos = produtosAPI.map((produto) => {
    return {
      text: produto.nome.toUpperCase(),
      value: produto.nome
    }
  })

  return {
    version: 1,
    contentType: "application/vnd.amazonaws.card.generic",
    genericAttachments: [
      {
        title: 'Produtos'.toUpperCase(),
        buttons: botoesProdutos
      }
    ]
  }
}

// ENVIA CARD PARA PREENCHER SLOT SKU COM DADOS DA API 
module.exports.SKUs = function(skusAPI) {

  const slideCards = skusAPI.map((sku) => {
    return {
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
        title: "frete".toUpperCase(),
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
        title: "E agora?".toUpperCase(),
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

module.exports.produtosRelacionados = function(crossAPI) {
  const crossCards = crossAPI.map((sku) => {
    console.log(`Valor do cross sku: ${sku.name}`);
    return {
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
    genericAttachments: crossCards
  }
}

module.exports.repeticao = (slotViolado, dadosAPIs) => {

  let cardRepeticao;

  switch (slotViolado) {
    case 'categoria':
      cardRepeticao = this.categorias(dadosAPIs.categoriasAPI);
      break;
    case 'subcategoria':
      cardRepeticao = this.subcategorias(dadosAPIs.subcategoriasAPI); 
      break;
    case 'produto':
      cardRepeticao = this.produtos(dadosAPIs.produtosAPI);
      break;
    case 'sku':
      cardRepeticao = this.SKUs(dadosAPIs.skusAPI);
      break;
    default:
      break;
    }

    return cardRepeticao;

}