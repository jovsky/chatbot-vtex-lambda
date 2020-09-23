/**
 * Função Lambda para redirecionar o Lex para a nova intent doacoesTETO
 * após o usuário avaliar o atendimento
 */
const lexResponse = require('../lex/responses');

const LINK_5 = "https://pag.ae/7WqB_TZ4t"
const LINK_10 = "https://pag.ae/7WqC2fHKt"
const LINK_20 = "https://pag.ae/7WqC2Adm4"
const LINK_MAIS = "https://amigos.teto.org.br/parcerias-corporativas#rd-section-jsc3dnf3"

async function dispatch(intentRequest, callback) {

  const slots = intentRequest.currentIntent.slots;

  console.log('slots av:', slots)
  if (slots.avaliacao !== null) {

    const object_kommunicate = `\{"message": "Obrigado pela avaliação! Poderia nos dar só mais 1 minuto da sua atenção para uma causa importante? Conheça o TETO. O TETO é uma organização da sociedade civil, sem fins lucrativos, que funciona graças à contribuição econômica das empresas, à cooperação internacional e a doações de pessoas como você, que acreditam em nosso trabalho. Essas contribuições nos permitem continuar trabalhando para superar a pobreza em comunidades precárias na América Latina. Deseja realizar uma doação para a TETO?",\n "platform":"kommunicate",\n "metadata": \{"contentType":"300",\n "templateId":3,\n "payload":[\{"type":"link",\n "url":"${LINK_5}",\n "name":"Doe R$ 5,00."\},\{"type":"link",\n "url":"${LINK_10}",\n "name":"Doe R$ 10,00."\},\{"type":"link",\n "url":"${LINK_20}",\n "name":"Doe R$ 20,00."\},\{"type":"link",\n "url":"${LINK_MAIS}",\n "name":"Conheça a TETO"\}]\}\}`

    // ,\{"type":"quickReply",\n "title":"Não quero doar",\n "message":"Não quero doar"\}

    // ,\{"type":"link",\n "url":"${LINK_10}",\n "name":"Doe R$ 10,00."\},\{"type":"link",\n "url":"${LINK_20}",\n "name":"Doe R$ 20,00."\},\{"type":"link",\n "url":"${LINK_MAIS}",\n "name":"Conheça a TETO"\}

    const message = {
      contentType: 'CustomPayload',
      content: object_kommunicate
    }
    lexResponse.close(intentRequest.sessionAttributes, 'Fulfilled', message, undefined, callback);
    return;
  }
  console.log('passou direto')
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
