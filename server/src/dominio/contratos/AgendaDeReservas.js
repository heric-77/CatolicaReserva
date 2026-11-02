// Contrato: consulta da agenda de uma sala (usado para checar conflito).
// Fica separado do ReservaRepository (ISP): a regra de conflito só
// precisa deste método, e não de salvar/cancelar/listar.
const Contrato = require('./Contrato');

/**
 * @interface AgendaDeReservas
 * buscarAtivasPorSalaEData(salaId: number, data: string): Promise<Reserva[]>
 */
module.exports = new Contrato('AgendaDeReservas', ['buscarAtivasPorSalaEData']);
