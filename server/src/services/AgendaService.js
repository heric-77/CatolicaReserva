// AgendaService - consulta os horários ocupados de todas as salas em uma data.
const { DadosInvalidosError } = require('../dominio/erros');
const { ehDataValida } = require('../dominio/formatos');
const AgendaDoDia = require('../dominio/contratos/AgendaDoDia');

class AgendaService {
  constructor({ agendaDoDia, abertura, fechamento }) {
    this.agendaDoDia = AgendaDoDia.verificar(agendaDoDia);
    this.abertura = abertura;
    this.fechamento = fechamento;
  }

  async doDia(data) {
    if (!ehDataValida(data)) {
      throw new DadosInvalidosError('Informe uma data válida.');
    }
    const ocupadas = await this.agendaDoDia.buscarAtivasPorData(data);
    return { data, abertura: this.abertura, fechamento: this.fechamento, ocupadas };
  }
}

module.exports = AgendaService;
