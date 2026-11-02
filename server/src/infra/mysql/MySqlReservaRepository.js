// Implementação MySQL dos contratos ReservaRepository e AgendaDeReservas.
// Única parte do sistema que conhece o SQL e os nomes das colunas de reservas.
const Reserva = require('../../dominio/entidades/Reserva');

// SELECT com JOIN para já trazer o nome da sala e do usuário.
const SELECT_BASE = `
  SELECT r.*, s.nome AS sala_nome, u.nome AS usuario_nome
  FROM reservas r
  JOIN salas s    ON s.id = r.sala_id
  JOIN usuarios u ON u.id = r.usuario_id
`;

// Converte uma linha do banco (snake_case) em uma entidade do domínio.
function paraEntidade(linha) {
  return new Reserva({
    id: linha.id,
    usuarioId: linha.usuario_id,
    salaId: linha.sala_id,
    data: linha.data,
    horaInicio: linha.hora_inicio,
    horaFim: linha.hora_fim,
    status: linha.status,
    salaNome: linha.sala_nome ?? null,
    usuarioNome: linha.usuario_nome ?? null,
  });
}

class MySqlReservaRepository {
  constructor(pool) {
    this.pool = pool;
  }

  async salvar(reserva) {
    const [resultado] = await this.pool.query(
      `INSERT INTO reservas (usuario_id, sala_id, data, hora_inicio, hora_fim, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [reserva.usuarioId, reserva.salaId, reserva.data, reserva.horaInicio, reserva.horaFim, reserva.status]
    );
    return this.buscarPorId(resultado.insertId);
  }

  async buscarPorId(id) {
    const [linhas] = await this.pool.query(`${SELECT_BASE} WHERE r.id = ?`, [id]);
    return linhas[0] ? paraEntidade(linhas[0]) : null;
  }

  async buscarAtivasPorSalaEData(salaId, data) {
    const [linhas] = await this.pool.query(
      `SELECT * FROM reservas WHERE sala_id = ? AND data = ? AND status = ?`,
      [salaId, data, Reserva.STATUS.ATIVA]
    );
    return linhas.map(paraEntidade);
  }

  async listarPorUsuario(usuarioId) {
    const [linhas] = await this.pool.query(
      `${SELECT_BASE} WHERE r.usuario_id = ? ORDER BY r.data DESC, r.hora_inicio`,
      [usuarioId]
    );
    return linhas.map(paraEntidade);
  }

  async listarTodas() {
    const [linhas] = await this.pool.query(`${SELECT_BASE} ORDER BY r.data DESC, r.hora_inicio`);
    return linhas.map(paraEntidade);
  }

  async atualizarStatus(id, status) {
    await this.pool.query('UPDATE reservas SET status = ? WHERE id = ?', [status, id]);
    return this.buscarPorId(id);
  }
}

module.exports = MySqlReservaRepository;
