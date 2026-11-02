// Implementação MySQL dos contratos UsuarioRepository e GestaoDeUsuariosRepository.
const Usuario = require('../../dominio/entidades/Usuario');
const { emTransacao } = require('./transacao');

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

  async listar() {
    const [linhas] = await this.pool.query('SELECT * FROM usuarios ORDER BY nome');
    return linhas.map(paraEntidade);
  }

  async buscarPorId(id) {
    const [linhas] = await this.pool.query('SELECT * FROM usuarios WHERE id = ?', [id]);
    return linhas[0] ? paraEntidade(linhas[0]) : null;
  }

  async atualizarTipo(id, tipo) {
    await this.pool.query('UPDATE usuarios SET tipo = ? WHERE id = ?', [tipo, id]);
    return this.buscarPorId(id);
  }

  async remover(id) {
    await emTransacao(this.pool, async (conexao) => {
      await conexao.query('DELETE FROM reservas WHERE usuario_id = ?', [id]);
      await conexao.query('DELETE FROM usuarios WHERE id = ?', [id]);
    });
  }
}

module.exports = MySqlUsuarioRepository;
