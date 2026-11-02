// Regra central do sistema (RF06): NÃO permitir duas reservas ativas
// para a mesma sala em horários que se sobrepõem.
const { ConflitoError } = require('../../erros');
const AgendaDeReservas = require('../../contratos/AgendaDeReservas');

class SemConflitoDeHorario {
  constructor({ agendaDeReservas }) {
    this.agendaDeReservas = AgendaDeReservas.verificar(agendaDeReservas);
  }

  async validar(reserva) {
    const reservasDoDia = await this.agendaDeReservas.buscarAtivasPorSalaEData(
      reserva.salaId,
      reserva.data
    );
    if (reservasDoDia.some((existente) => reserva.sobrepoe(existente))) {
      throw new ConflitoError('Já existe uma reserva para esta sala nesse horário.');
    }
  }
}

module.exports = SemConflitoDeHorario;
