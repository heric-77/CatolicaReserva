// Regra: não é possível reservar um horário que já começou.
const { DadosInvalidosError } = require('../../erros');

class SemHorarioNoPassado {
  // agora é uma função para os testes poderem fixar o "momento atual".
  constructor({ agora = () => new Date() } = {}) {
    this.agora = agora;
  }

  async validar(reserva) {
    if (reserva.inicio() <= this.agora()) {
      throw new DadosInvalidosError('Não é possível reservar um horário que já passou.');
    }
  }
}

module.exports = SemHorarioNoPassado;
