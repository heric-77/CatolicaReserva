// Contrato: persistência das reservas.
const Contrato = require('./Contrato');

/**
 * @interface ReservaRepository
 * salvar(reserva: Reserva): Promise<Reserva>
 * buscarPorId(id: number): Promise<Reserva | null>
 * listarPorUsuario(usuarioId: number): Promise<Reserva[]>
 * listarTodas(): Promise<Reserva[]>
 * atualizarStatus(id: number, status: string): Promise<Reserva>
 */
module.exports = new Contrato('ReservaRepository', [
  'salvar',
  'buscarPorId',
  'listarPorUsuario',
  'listarTodas',
  'atualizarStatus',
]);
