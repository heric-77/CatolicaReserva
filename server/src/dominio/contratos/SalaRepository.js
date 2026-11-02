// Contrato: persistência das salas.
const Contrato = require('./Contrato');

/**
 * @interface SalaRepository
 * listar(): Promise<Sala[]>
 * buscarPorId(id: number): Promise<Sala | null>
 * salvar(sala: Sala): Promise<Sala>
 * atualizar(sala: Sala): Promise<Sala>
 * remover(id: number): Promise<void>  — também exclui as reservas da sala
 */
module.exports = new Contrato('SalaRepository', [
  'listar',
  'buscarPorId',
  'salvar',
  'atualizar',
  'remover',
]);
