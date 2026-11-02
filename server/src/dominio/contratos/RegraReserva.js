// Contrato: uma regra que a reserva precisa cumprir para ser criada.
// Cada regra nova é uma classe nova com validar() — o ReservaService
// não precisa ser alterado (OCP).
const Contrato = require('./Contrato');

/**
 * @interface RegraReserva
 * validar(reserva: Reserva): Promise<void>  — lança um ErroDeDominio se a regra falhar
 */
module.exports = new Contrato('RegraReserva', ['validar']);
