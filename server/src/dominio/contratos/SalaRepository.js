// Contrato: persistência das salas.
const Contrato = require('./Contrato');

/**
 * @interface SalaRepository
 * listar(): Promise<Sala[]>
 * buscarPorId(id: number): Promise<Sala | null>
 * salvar(sala: Sala): Promise<Sala>
 */
module.exports = new Contrato('SalaRepository', ['listar', 'buscarPorId', 'salvar']);
