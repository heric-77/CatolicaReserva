// Contrato: geração e conferência de hash de senha.
const Contrato = require('./Contrato');

/**
 * @interface GeradorHash
 * gerar(senha: string): Promise<string>
 * comparar(senha: string, hash: string): Promise<boolean>
 */
module.exports = new Contrato('GeradorHash', ['gerar', 'comparar']);
