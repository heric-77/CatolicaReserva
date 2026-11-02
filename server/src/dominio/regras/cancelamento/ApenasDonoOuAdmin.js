// Regra: só o dono da reserva ou um administrador pode cancelá-la (RNF03 - Segurança).
const { AcessoNegadoError } = require('../../erros');
const Usuario = require('../../entidades/Usuario');

class ApenasDonoOuAdmin {
  async validar(reserva, usuario) {
    if (!reserva.pertenceA(usuario.id) && usuario.tipo !== Usuario.TIPOS.ADMIN) {
      throw new AcessoNegadoError('Você não tem permissão para cancelar esta reserva.');
    }
  }
}

module.exports = ApenasDonoOuAdmin;
