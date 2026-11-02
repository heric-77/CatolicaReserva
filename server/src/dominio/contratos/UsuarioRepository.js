// Contrato: persistência dos usuários.
const Contrato = require('./Contrato');

/**
 * @interface UsuarioRepository
 * buscarPorEmail(email: string): Promise<Usuario | null>
 * salvar(usuario: Usuario): Promise<Usuario>
 */
module.exports = new Contrato('UsuarioRepository', ['buscarPorEmail', 'salvar']);
