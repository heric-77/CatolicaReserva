// Contrato: emissão do token de login (usado pelo UsuarioService).
const Contrato = require('./Contrato');

/**
 * @interface GeradorToken
 * gerar(dados: { id, nome, tipo }): string
 */
module.exports = new Contrato('GeradorToken', ['gerar']);
