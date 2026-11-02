// Implementação dos contratos GeradorToken e VerificadorToken usando JWT.
// É o único lugar do sistema que conhece a biblioteca jsonwebtoken e o segredo.
const jwt = require('jsonwebtoken');

class JwtServicoToken {
  constructor({ segredo, expiracao = '8h' }) {
    this.segredo = segredo;
    this.expiracao = expiracao;
  }

  gerar(dados) {
    return jwt.sign(dados, this.segredo, { expiresIn: this.expiracao });
  }

  verificar(token) {
    return jwt.verify(token, this.segredo);
  }
}

module.exports = JwtServicoToken;
