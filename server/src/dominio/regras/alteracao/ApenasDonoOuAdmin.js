// Regra: só o dono da reserva ou um administrador pode alterá-la (RNF03 - Segurança).
const { AcessoNegadoError } = require('../../erros');
const Usuario = require('../../entidades/Usuario');

class ApenasDonoOuAdmin {
  // acao entra na mensagem de erro: 'cancelar' ou 'editar'.
  constructor({ acao }) {
    this.acao = acao;
  }

  async validar(reserva, usuario) {
    if (!reserva.pertenceA(usuario.id) && usuario.tipo !== Usuario.TIPOS.ADMIN) {
      throw new AcessoNegadoError(`Você não tem permissão para ${this.acao} esta reserva.`);
    }
  }
}

module.exports = ApenasDonoOuAdmin;
