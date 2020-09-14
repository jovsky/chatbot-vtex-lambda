const axios = require('axios');
const { replaceChar } = require('../util/util')

const api = axios.create({
  baseURL: "https://storebot--hiringcoders14.myvtex.com/api",
  method: "GET",
  headers: {
    'accept': 'application/json',
    'content-type': 'application/json',
    'x-vtex-api-appkey': 'vtexappkey-hiringcoders14-PYVTSB',
    'x-vtex-api-apptoken': 'TLAPVRTTFHVDDIIXBTDIUWDILDKLUKAMFWDQVFNKIMRJMTIGYFRYBIEWIRDRHIZUHIXHFRC'
  }
});

function getIdCategoria(nomeCategoria, categoriasAPI) {
  const result = categoriasAPI.filter((cat) => cat.nome === nomeCategoria);
  return result[0].id;
}

function getIdProduto(nomeProduto, produtosAPI) {
  const result = produtosAPI.filter((prod) => prod.nome === nomeProduto);
  return result[0].id;
}

function getSKUProduto(idProduto, produtosAPI) {
  const result = produtosAPI.filter((prod) => prod.id === idProduto);
  console.log(' Get SKU produto:', idProduto, result)
  return result[0].skus;
}

module.exports.getCategoriasAPI = async () => {
  const url = 'catalog_system/pub/category/tree/1'

  const response = await api.get(url)
  const data = response.data

  const result = data.map(result => {
    return {
      nome: replaceChar(result.name.toLowerCase(), " ", "_"),
      id: result.id
    }
  })

  return result
}

module.exports.getProdutosAPI = async (categoria, categoriasAPI) => {

  const idCategoria = getIdCategoria(categoria, categoriasAPI);

  const url = `catalog_system/pub/products/search?fq=C:/${idCategoria}/`

  const response = await api.get(url)
  const data = response.data

  if (data.length === 0 || data === null) {
    throw new Error(`Lamento, estamos sem estoque de ${categoria}. Faça outra escolha.`);
  }

  const result = data.map(produto => {
    return {
      nome: replaceChar(produto.productName.toLowerCase()," ", "_"),
      id: produto.productId,
      skus: produto.items
    }
  })

  return result
}

module.exports.getSKUsAPI = (produto, produtosAPI) => {

  const idProduto = getIdProduto(produto, produtosAPI);

  const skusProduto = getSKUProduto(idProduto, produtosAPI) // []

  console.log('  --> SKUS:', skusProduto[0].sellers);

  const result = skusProduto.map(sku => {
    return {
      nome: replaceChar(sku.name.toLowerCase(), " ", "_"),
      id: sku.itemId,
      preco: sku.sellers[0].commertialOffer.Price,
      linkCarrinho: sku.sellers[0].addToCartLink,
      imagem: sku.images[0].imageUrl
    }
  })

  console.log(' Resultttt', result)

  return result
  
}