const axios = require('axios');
const { replaceChar } = require('../util/util')

// PARAMETROS DE ACESSO À API
const api = axios.create({
  baseURL: "https://hiringcoders14.myvtex.com/api/",
  method: "GET",
  headers: {
    'accept': 'application/json',
    'content-type': 'application/json',
    'x-vtex-api-appkey': 'vtexappkey-hiringcoders14-PYVTSB',
    'x-vtex-api-apptoken': 'TLAPVRTTFHVDDIIXBTDIUWDILDKLUKAMFWDQVFNKIMRJMTIGYFRYBIEWIRDRHIZUHIXHFRC'
  }
});

// PEGAR O ID DA CATEOGIRA SELECIONADA A PARTIR DOS DADOS DA API
function getIdCategoria(nomeCategoria, categoriasAPI) {
  const result = categoriasAPI.filter((cat) => cat.nome === nomeCategoria);
  return result[0].id;
}

// PEGAR O ID DO PRODUTO SELECIONADO A PARTIR DOS DADOS DA API
function getIdProduto(nomeProduto, produtosAPI) {
  const result = produtosAPI.filter((prod) => prod.nome === nomeProduto);
  return result[0].id;
}

// PEGAR OS SKUS DO PRODUTO SELECIONADO A PARTIR DOS DADOS DA API
function getSKUProduto(idProduto, produtosAPI) {
  const result = produtosAPI.filter((prod) => prod.id === idProduto);
  return result[0].skus;
}

// RECEBE DA API OS DADOS DE CATEGORIAS EXISTENTES
module.exports.getCategorias = async () => {
  const url = 'catalog_system/pub/category/tree/1'

  const response = await api.get(url)
  const data = response.data

  const result = data.map(result => {
    return {
      // nome: replaceChar(result.name.toLowerCase(), " ", "_"),
      nome: result.name.toLowerCase(),
      id: result.id
    }
  })

  return result
}

// RECEBE DA API OS DADOS DE PRODUTOS EXISTENTES DE UMA CATEGORIA
module.exports.getProdutos = async (categoria, categoriasAPI) => {

  const idCategoria = getIdCategoria(categoria, categoriasAPI);

  const url = `catalog_system/pub/products/search?fq=C:/${idCategoria}/`
  const response = await api.get(url)
  const data = response.data

  if (data.length === 0 || data === null) {
    throw new Error(`Lamento, estamos sem estoque de ${categoria}. Faça outra escolha.`);
  }

  const result = data.map(produto => {
    return {
      // nome: replaceChar(produto.productName.toLowerCase()," ", "_"),
      nome: produto.productName.toLowerCase(),
      id: produto.productId,
      skus: produto.items
    }
  })

  return result
}

// RECEBE DA API OS DADOS DE SKUS EXISTENTES DE UM PRODUTO
module.exports.getSKUs = (produto, produtosAPI) => {

  const idProduto = getIdProduto(produto, produtosAPI);

  const skusProduto = getSKUProduto(idProduto, produtosAPI);

  return skusProduto.map(sku => {
    return {
      // nome: replaceChar(sku.name.toLowerCase(), " ", "_"),
      nome: sku.name.toLowerCase(),
      id: sku.itemId,
      preco: (parseFloat(sku.sellers[0].commertialOffer.Price).toFixed(2)).toString(),
      linkCarrinho: sku.sellers[0].addToCartLink,
      imagem: sku.images[0].imageUrl
    }
  })

}

// PEGAR OS LINKS PARA O CARRINHO DOS SKUS DA API
module.exports.getLinkSKUs = (skusAPI, nomeSKU) => {
  const [sku] = skusAPI.filter( sku => sku.nome === nomeSKU)
  return sku.linkCarrinho;
}