// Implementação MySQL do contrato UsuarioRepository.
const Usuario = require('../../dominio/entidades/Usuario');

function paraEntidade(linha) {
  return new Usuario({
    id: linha.id,
    nome: linha.nome,
    email: linha.email,
    senhaHash: linha.senha,
    tipo: linha.tipo,
  });
}

class MySqlUsuarioRepository {
  constructor(pool) {
    this.pool = pool;
  }

  async buscarPorEmail(email) {
    const [linhas] = await this.pool.query('SELECT * FROM usuarios WHERE email = ?', [email]);
    return linhas[0] ? paraEntidade(linhas[0]) : null;
  }

  async salvar(usuario) {
    const [resultado] = await this.pool.query(
      'INSERT INTO usuarios (nome, email, senha, tipo) VALUES (?, ?, ?, ?)',
      [usuario.nome, usuario.email, usuario.senhaHash, usuario.tipo]
    );
    return new Usuario({ ...usuario, id: resultado.insertId });
  }
}

module.exports = MySqlUsuarioRepository;
