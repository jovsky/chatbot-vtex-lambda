const axios = require('axios');
const { replaceChar } = require('../util/util')

// PARAMETROS DE ACESSO À API
const api = axios.create({
  baseURL: "https://hiringcoders14.myvtex.com/api/",
  headers: {
    'accept': 'application/json',
    'content-type': 'application/json',
    'x-vtex-api-appkey': 'vtexappkey-hiringcoders14-PYVTSB',
    'x-vtex-api-apptoken': 'TLAPVRTTFHVDDIIXBTDIUWDILDKLUKAMFWDQVFNKIMRJMTIGYFRYBIEWIRDRHIZUHIXHFRC'
  }
});


// PEGAR O ID DA CATEGORIA SELECIONADA A PARTIR DOS DADOS DA API
function getIdCategoria(nomeCategoria, categoriasAPI) {
  const result = categoriasAPI.filter((cat) => cat.nome === nomeCategoria);
  return result[0].id;
}

// PEGAR O ID DA CATEGORIA SELECIONADA A PARTIR DOS DADOS DA API
function getIdSubcategoria(nomeSubcategoria, subcategoriasAPI) {
  const result = subcategoriasAPI.filter((subcat) => subcat.nome === nomeSubcategoria);
  return result[0].id;
}

// PEGAR O ID DO PRODUTO SELECIONADO A PARTIR DOS DADOS DA API
function getIdProduto(nomeProduto, produtosAPI) {
  const result = produtosAPI.filter((prod) => prod.nome === nomeProduto);
  return result[0].id;
}

// PEGAR O ID DO SKU SELECIONADO A PARTIR DOS DADOS DA API
function getIdSKU(nomeSKU, skusAPI) {
  const result = skusAPI.filter((sku) => sku.nome === nomeSKU);
  return result[0].id;
}

// PEGAR OS SKUS DO PRODUTO SELECIONADO A PARTIR DOS DADOS DA API
function getSKUsDoProduto(idProduto, produtosAPI) {
  const result = produtosAPI.filter((prod) => prod.id === idProduto);
  return result[0].skus;
}

// function getSubcategoriasDaCategoria(idCategoria, categoriasAPI) {
//   const result = categoriasAPI.filter((cat) => cat.id === idCategoria);
//   return result[0].skus;
// }

// RECEBE DA API OS DADOS DE CATEGORIAS EXISTENTES
module.exports.getCategorias = async () => {
  const url = 'catalog_system/pub/category/tree/1'

  const response = await api.get(url)
  const data = response.data

  const result = data.map(result => {
    return {
      // nome: replaceChar(result.name.toLowerCase(), " ", "_"),
      nome: result.name.toLowerCase(),
      id: result.id,
      subcategorias: result.children.map( (child) => {
        return {
          id: child.id,
          nome: child.name.toLowerCase()
        }
      })
    }
  })

  return result
}

// RECEBE DA API OS DADOS DE SUBCATEGORIAS EXISTENTES
module.exports.getSubcategorias = async (nomeCategoria, categoriasAPI) => {

  const idCategoria = getIdCategoria(nomeCategoria, categoriasAPI);
  const categoria = categoriasAPI.filter( cat => cat.id === idCategoria);
  return categoria[0].subcategorias;

}

// RECEBE DA API OS DADOS DE PRODUTOS EXISTENTES DE UMA CATEGORIA
module.exports.getProdutos = async (categoria, subcategoria, categoriasAPI, subcategoriasAPI) => {

  const idCategoria = getIdCategoria(categoria, categoriasAPI);
  const idSubcategoria = getIdSubcategoria(subcategoria, subcategoriasAPI);

  const url = `catalog_system/pub/products/search?fq=C:/${idCategoria}/${idSubcategoria}/`
  const response = await api.get(url)
  const data = response.data

  if (data.length === 0 || data === null) {
    throw new Error(`Lamento, estamos sem estoque deste tipo de produto. Faça outra escolha.`);
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

  const skusProduto = getSKUsDoProduto(idProduto, produtosAPI);

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


module.exports.getFrete = async (skuNome, skusAPI, CEP) => {

  const skuID = getIdSKU(skuNome, skusAPI);
  console.log(' GET FRETE::', skuID, CEP);

  const url = `checkout/pub/orderforms/simulation`;
  const response = await api.post(url, 
    {
      items: [
        {
          id: skuID, 
          quantity: 1, 
          seller: 1
        }
      ],
      postalCode: CEP,
      country: "BRA"
    }
  );
  const data = await response.data;

  const { price, transitTime } = data.logisticsInfo[0].slas[0]

  return { price, transitTime }

}

// RECEBE DA API OS DADOS DE SKUS EXISTENTES DE UM PRODUTO
module.exports.getSKUsRelacionados = async (idProduto) => {

  const url = `catalog_system/pub/products/crossselling/whosawalsosaw/${idProduto}/`;
  const response = await api.get(url)
  const data = response.data;

  let lista = [];
  
  data.map(produto => {

    produto.items.map( sku => {

      lista.push({
        nome: sku.name.toLowerCase(),
        id: sku.itemId,
        preco: (parseFloat(sku.sellers[0].commertialOffer.Price).toFixed(2)).toString(),
        linkCarrinho: sku.sellers[0].addToCartLink,
        imagem: sku.images[0].imageUrl
      })
      return;

    })
    return;
  })

  return lista;
}