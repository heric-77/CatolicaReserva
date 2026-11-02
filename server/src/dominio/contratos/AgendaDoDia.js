// Contrato: reservas ativas de todas as salas em uma data (usado na tela de agenda).
const Contrato = require('./Contrato');

/**
 * @interface AgendaDoDia
 * buscarAtivasPorData(data: string): Promise<Reserva[]>
 */
module.exports = new Contrato('AgendaDoDia', ['buscarAtivasPorData']);
