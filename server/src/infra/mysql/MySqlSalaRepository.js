// Implementação MySQL do contrato SalaRepository.
const Sala = require('../../dominio/entidades/Sala');

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
}

module.exports = MySqlSalaRepository;
