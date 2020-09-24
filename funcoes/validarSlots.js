
// FUNÇÃO QUE VALIDA OS SLOTS NÃO NULOS DO AMAZON LEX
module.exports.slots = function(slots, dadosAPI) {

  const { categoria, subcategoria, produto, sku } = slots;
  const { categoriasAPI, subcategoriasAPI, produtosAPI, skusAPI } = dadosAPI;

  console.log(' Dispatch - slots: ', slots)

  // VALIDAR SLOT CATEGORIA
  const nomesCategorias = categoriasAPI.map(categoria => categoria.nome);
  if (!nomesCategorias.includes(categoria.toLowerCase())) {
    return {
      seValido: false,
      slotViolado: "categoria"
    };
  }

  // VALIDAR SLOT SUBCATEGORIA
  if (subcategoriasAPI !== undefined && subcategoria !== null) {
    if (subcategoria.toLowerCase().indexOf('voltar') !== -1) {
      return {
        seValido: true,
        voltar: true,
        slotVoltar: 'categoria'
      };
    }
    const nomesSubcategorias = subcategoriasAPI.map(subcat => subcat.nome);
    if (!nomesSubcategorias.includes(subcategoria.toLowerCase())) {
      return {
        seValido: false,
        slotViolado: "subcategoria"
      };
    }
  }

  // VALIDAR SLOT PRODUTO
  if (produtosAPI !== undefined && produto !== null) {
    if (produto.toLowerCase().indexOf('voltar') !== -1) {
      return {
        seValido: true,
        voltar: true,
        slotVoltar: 'subcategoria'
      };
    }
    const nomesProdutos = produtosAPI.map(produto => produto.nome);
    if (!nomesProdutos.includes(produto.toLowerCase())) {
      return {
        seValido: false,
        slotViolado: "produto"
      };
    }
  }

  // VALIDAR SLOT SKU
  if (skusAPI !== undefined && sku !== null) {
    console.log('')
    if (sku.toLowerCase().indexOf('não') !== -1 || sku.toLowerCase().indexOf('nao') !== -1) {
      return {
        seValido: true,
        voltar: true,
        slotVoltar: 'produto'
      };
    }
    const nomesSKUs = skusAPI.map(sku => sku.nome);
    if (!nomesSKUs.includes(sku.toLowerCase())) {
      return {
        seValido: false,
        slotViolado: "sku"
      };
    }
  }


  // TODAS SLOTS NÃO NULAS SÃO VÁLIDOS
  return {
    seValido: true,
    voltar: false
  };

}

// VALIDAR RESPOSTA DO SLOT VER FRETE
module.exports.verFrete = function(verFrete) {

  const resposta = verFrete.toLowerCase();

  if (resposta.indexOf('sim') !== -1 || resposta.indexOf('quero') !== -1) {
    return {
      seValido: true,
      querVer: true
    };
  }
  else if (resposta.indexOf('não') !== -1 || resposta.indexOf('nao') !== -1) {
    return {
      seValido: true,
      querVer: false
    };
  }
  else {
    return {
      seValido: false
    };
  }

}

// VALIDAR RESPOSTA DO SLOT VER FRETE
module.exports.CEP = function (strCEP) {

  if (strCEP.toLowerCase().indexOf('cancelar') !== -1) {
    return {
      seValido: true,
      cancelar: true
    };
  }

  strCEP = strCEP.replace(/ /g, "");
  strCEP = strCEP.replace(/-/g, "");

  let objER = /^[0-9]{8}$/;

  return {
    seValido: (objER.test(strCEP)),
    cancelar: false,
    CEP: strCEP,
  };

}

// VALIDAR RESPOSTA DO SLOT REPETIR OU AVALIAR E RETORNAR A AÇÃO
module.exports.repetirOuAvaliar = function(repetirOuAvaliar) {

  const resposta = repetirOuAvaliar.toLowerCase();

  if (resposta.indexOf('mais') !== -1
    || resposta.indexOf('sugestões') !== -1
    || resposta.indexOf('sugestoes') !== -1) {
    return {
      seValido: true,
      acao: "repetir"
    };
  }
  else if (resposta.indexOf('avaliar') !== -1 || resposta.indexOf('atendimento') !== -1) {
    return {
      seValido: true,
      acao: "avaliar"
    };
  }
  else {
    return {
      seValido: false
    };
  }

}
