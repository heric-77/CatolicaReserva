// Implementação MySQL dos contratos SalaRepository e ConsultaDeSala.
const Sala = require('../../dominio/entidades/Sala');
const { emTransacao } = require('./transacao');

function paraEntidade(linha) {
  return new Sala({
    id: linha.id,
    nome: linha.nome,
    tipo: linha.tipo,
    capacidade: linha.capacidade,
    recursos: linha.recursos,
  });
}

class MySqlSalaRepository {
  constructor(pool) {
    this.pool = pool;
  }

  async listar() {
    const [linhas] = await this.pool.query('SELECT * FROM salas ORDER BY nome');
    return linhas.map(paraEntidade);
  }

  async buscarPorId(id) {
    const [linhas] = await this.pool.query('SELECT * FROM salas WHERE id = ?', [id]);
    return linhas[0] ? paraEntidade(linhas[0]) : null;
  }

  async salvar(sala) {
    const [resultado] = await this.pool.query(
      'INSERT INTO salas (nome, tipo, capacidade, recursos) VALUES (?, ?, ?, ?)',
      [sala.nome, sala.tipo, sala.capacidade, sala.recursos]
    );
    return new Sala({ ...sala, id: resultado.insertId });
  }

  async atualizar(sala) {
    await this.pool.query(
      'UPDATE salas SET nome = ?, tipo = ?, capacidade = ?, recursos = ? WHERE id = ?',
      [sala.nome, sala.tipo, sala.capacidade, sala.recursos, sala.id]
    );
    return this.buscarPorId(sala.id);
  }

  async remover(id) {
    await emTransacao(this.pool, async (conexao) => {
      await conexao.query('DELETE FROM reservas WHERE sala_id = ?', [id]);
      await conexao.query('DELETE FROM salas WHERE id = ?', [id]);
    });
  }
}

module.exports = MySqlSalaRepository;
