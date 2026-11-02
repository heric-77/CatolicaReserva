// Contrato: operações de administração de usuários.
// Fica separado do UsuarioRepository (ISP): o cadastro e o login não precisam
// listar, alterar o tipo nem excluir usuários.
const Contrato = require('./Contrato');

/**
 * @interface GestaoDeUsuariosRepository
 * listar(): Promise<Usuario[]>
 * buscarPorId(id: number): Promise<Usuario | null>
 * atualizarTipo(id: number, tipo: string): Promise<Usuario>
 * remover(id: number): Promise<void>  — também exclui as reservas do usuário
 */
module.exports = new Contrato('GestaoDeUsuariosRepository', [
  'listar',
  'buscarPorId',
  'atualizarTipo',
  'remover',
]);
