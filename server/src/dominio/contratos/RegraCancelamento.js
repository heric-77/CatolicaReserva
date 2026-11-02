// Contrato: uma regra que precisa ser cumprida para cancelar uma reserva.
const Contrato = require('./Contrato');

/**
 * @interface RegraCancelamento
 * validar(reserva: Reserva, usuario: { id, tipo }): Promise<void>  — lança um ErroDeDominio se a regra falhar
 */
module.exports = new Contrato('RegraCancelamento', ['validar']);
