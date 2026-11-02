// Contrato: validação do token de login (usado pelo middleware de autenticação).
// Separado do GeradorToken (ISP): quem só verifica não precisa saber gerar.
const Contrato = require('./Contrato');

/**
 * @interface VerificadorToken
 * verificar(token: string): { id, nome, tipo }  — lança erro se o token for inválido
 */
module.exports = new Contrato('VerificadorToken', ['verificar']);
