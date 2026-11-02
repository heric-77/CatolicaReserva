// Contrato: consulta de uma sala pelo id.
// Fica separado do SalaRepository (ISP): a regra SalaDeveExistir só precisa
// deste método, e não de cadastrar, alterar ou excluir salas.
const Contrato = require('./Contrato');

/**
 * @interface ConsultaDeSala
 * buscarPorId(id: number): Promise<Sala | null>
 */
module.exports = new Contrato('ConsultaDeSala', ['buscarPorId']);
