/**
 * Função Lambda para redirecionar o Lex para a nova intent doacoesTETO
 * após o usuário avaliar o atendimento
 */
const lexResponse = require('../lex/responses');

const LINK_35 = "https://pag.ae/7WqUG7HsM"
const LINK_50 = "https://pag.ae/7WqUGspB7"
const LINK_100 = "https://pag.ae/7WqUGHr61"
const LINK_OUTROS = "https://pag.ae/7WqUsNdNN"
const LINK_EMPRESA = "https://amigos.teto.org.br/parcerias-corporativas"
const LINK_MAIS = "https://hiringcoders14.myvtex.com/teto"

async function dispatch(intentRequest, callback) {

  const slots = intentRequest.currentIntent.slots;

  if (slots.avaliacao !== null) {

    const object_kommunicate = `\{"message": "Obrigado pela avaliação! Poderia nos dar só mais 1 minuto da sua atenção para uma causa importante? Conheça o TETO. O TETO é uma organização da sociedade civil, sem fins lucrativos, que funciona graças à contribuição econômica das empresas, à cooperação internacional e a doações de pessoas como você, que acreditam em nosso trabalho. Essas contribuições nos permitem continuar trabalhando para superar a pobreza em comunidades precárias na América Latina. Deseja realizar uma doação para a TETO?",\n "platform":"kommunicate",\n "metadata": \{"contentType":"300",\n "templateId":3,\n "payload":[\{"type":"link",\n "url":"${LINK_35}",\n "name":"Doe R$ 35,00"\},\{"type":"link",\n "url":"${LINK_50}",\n "name":"Doe R$ 50,00"\},\{"type":"link",\n "url":"${LINK_100}",\n "name":"Doe R$ 100,00"\},\{"type":"link",\n "url":"${LINK_OUTROS}",\n "name":"Outro valor"\},\{"type":"link",\n "url":"${LINK_EMPRESA}",\n "name":"Doar como empresa"\},\{"type":"link",\n "url":"${LINK_MAIS}",\n "name":"Conheça a TETO"\}]\}\}`

    const message = {
      contentType: 'CustomPayload',
      content: object_kommunicate
    }
    lexResponse.close(intentRequest.sessionAttributes, 'Fulfilled', message, undefined, callback);
    return;
  }
  lexResponse.delegate(intentRequest.sessionAttributes, slots, callback)
  return;

}
 
module.exports = async (event, context, callback) => {
  try {

    await dispatch(event, (response) => callback(null, response));

  } catch (err) {
    callback(err);
  }
};
