// Implementação do contrato GeradorHash usando a biblioteca bcrypt.
const bcrypt = require('bcryptjs');

class BcryptGeradorHash {
  constructor({ custo = 10 } = {}) {
    this.custo = custo;
  }

  async gerar(senha) {
    return bcrypt.hash(senha, this.custo);
  }

  async comparar(senha, hash) {
    return bcrypt.compare(senha, hash);
  }
}

module.exports = BcryptGeradorHash;
