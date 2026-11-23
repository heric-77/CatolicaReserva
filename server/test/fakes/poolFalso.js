// Pool "falso" do mysql2, usado para testar os repositórios sem banco.
// Guarda cada SQL executado e devolve as respostas na ordem em que foram
// programadas, no mesmo formato do mysql2: [linhas] ou [{ insertId }].
class ConexaoFalsa {
  constructor(pool) {
    this.pool = pool;
    this.eventos = [];
  }

  async beginTransaction() {
    this.eventos.push('begin');
  }

  async query(sql, parametros) {
    return this.pool.query(sql, parametros);
  }

  async commit() {
    this.eventos.push('commit');
  }

  async rollback() {
    this.eventos.push('rollback');
  }

  release() {
    this.eventos.push('release');
  }
}

class PoolFalso {
  constructor(respostas = []) {
    this.respostas = [...respostas];
    this.consultas = [];
    this.conexao = new ConexaoFalsa(this);
  }

  async query(sql, parametros = []) {
    this.consultas.push({ sql: sql.replace(/\s+/g, ' ').trim(), parametros });
    const resposta = this.respostas.shift();
    if (resposta instanceof Error) throw resposta;
    return [resposta ?? []];
  }

  async getConnection() {
    return this.conexao;
  }
}

module.exports = PoolFalso;
