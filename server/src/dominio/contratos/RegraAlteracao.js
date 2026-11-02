// Contrato: uma regra que precisa ser cumprida para alterar uma reserva
// que já existe (editar ou cancelar).
const Contrato = require('./Contrato');

/**
 * @interface RegraAlteracao
 * validar(reserva: Reserva, usuario: { id, tipo }): Promise<void>  — lança um ErroDeDominio se a regra falhar
 */
module.exports = new Contrato('RegraAlteracao', ['validar']);
